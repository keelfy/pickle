package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
	twitchws "github.com/vpetrigo/go-twitch-ws"
)

type TwitchWSService interface {
	CreateConnection(ctx context.Context, needLock bool, identityID uuid.UUID) (uuid.UUID, error)
	CloseConnection(connID uuid.UUID, needLock bool) error
	GetConnectionStatus(ctx context.Context, connID uuid.UUID) (*ConnectionStatus, error)
	Shutdown(ctx context.Context) error
}

type twitchWSService struct {
	connections        map[uuid.UUID]*WebsocketConnection
	sqlDB              storage.RelationalStorage
	mu                 sync.RWMutex
	statusChan         chan ConnectionStatus
	wg                 sync.WaitGroup
	twitchEventService TwitchEventService
	ctx                context.Context
	cancel             context.CancelFunc
}

type WebsocketConnection struct {
	ID                uuid.UUID
	SessionID         *string
	Conn              *websocket.Conn
	Status            string // "connecting", "active", "error", "closed"
	LastPing          time.Time
	ErrorCount        int
	SubscriptionCount int
	ctx               context.Context
	cancel            context.CancelFunc
}

type ConnectionStatus struct {
	ID           uuid.UUID
	SessionID    *string
	Status       string
	LastPing     time.Time
	ErrorCount   int
	ErrorMessage string
}

func NewTwitchWSService(db storage.RelationalStorage, twitchEventService TwitchEventService) TwitchWSService {
	ctx, cancel := context.WithCancel(context.Background())
	cm := &twitchWSService{
		connections:        make(map[uuid.UUID]*WebsocketConnection),
		sqlDB:              db,
		statusChan:         make(chan ConnectionStatus, config.GetTwitchWebsocketSubscriptionsLimit()),
		twitchEventService: twitchEventService,
		ctx:                ctx,
		cancel:             cancel,
	}

	// Запускаем процесс обновления состояний в БД
	cm.wg.Add(1)
	go cm.statusUpdater(ctx)

	// Запускаем процесс мониторинга подключений
	cm.wg.Add(1)
	go cm.connectionMonitor(ctx)

	cm.wg.Add(1)
	go cm.subscriptionManager(ctx)

	return cm
}

func (cm *twitchWSService) statusUpdater(ctx context.Context) {
	defer func() {
		logger.Debugf(ctx, "Status updater goroutine finished")
		cm.wg.Done()
	}()

	logger.Debugf(ctx, "Status updater started")

	for {
		select {
		case <-ctx.Done():
			// Graceful shutdown requested
			logger.Debugf(ctx, "Status updater received cancellation signal")
			return
		case status, ok := <-cm.statusChan:
			if !ok {
				// Channel closed
				logger.Debugf(ctx, "Status updater received channel closed signal")
				return
			}
			err := cm.updateConnectionStatusInDB(ctx, status)
			if err != nil {
				log.Printf("Error updating status in DB: %v", err)
			}
		}
	}
}

// Создание нового подключения
func (cm *twitchWSService) CreateConnection(ctx context.Context, needLock bool, identityID uuid.UUID) (uuid.UUID, error) {
	if needLock {
		cm.mu.Lock()
		defer cm.mu.Unlock()
	}

	// Генерируем уникальный ID
	connID := uuid.New()

	// Создаем запись в БД
	_, err := cm.sqlDB.Queries().InsertWebsocketConnection(ctx, db.InsertWebsocketConnectionParams{
		ID:         connID,
		Status:     "connecting",
		IdentityID: identityID,
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create connection record: %w", err)
	}

	err = cm.executeConnection(ctx, connID, false)
	if err != nil {
		return uuid.Nil, err
	}

	return connID, nil
}

func (cm *twitchWSService) executeConnection(ctx context.Context, connID uuid.UUID, needLock bool) error {
	if needLock {
		cm.mu.Lock()
		defer cm.mu.Unlock()
	}

	if _, exists := cm.connections[connID]; exists {
		return fmt.Errorf("connection %v already exists", connID)
	}

	// Создаем контекст с отменой для управления жизненным циклом горутины
	connCtx, cancel := context.WithCancel(ctx)

	tx, err := cm.sqlDB.Begin(ctx)
	if err != nil {
		cancel()
		return err
	}
	qtx := cm.sqlDB.Queries().WithTx(tx)
	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		} else {
			tx.Commit(ctx)
		}
	}()

	err = qtx.UpdateEventsubSubscriptionsStatusByConnectionID(ctx, db.UpdateEventsubSubscriptionsStatusByConnectionIDParams{
		ConnectionID: connID,
		Status:       "assigned",
	})
	if err != nil {
		cancel()
		return err
	}

	err = qtx.UpdateWebsocketConnectionStatus(ctx, db.UpdateWebsocketConnectionStatusParams{
		ID:     connID,
		Status: "connecting",
	})
	if err != nil {
		cancel()
		return err
	}

	// Инициализируем подключение
	conn := &WebsocketConnection{
		ID:     connID,
		Status: "connecting",
		ctx:    connCtx,
		cancel: cancel,
	}

	// Добавляем в карту
	cm.connections[connID] = conn

	// Запускаем горутину для подключения к Twitch
	cm.wg.Add(1)
	go cm.runConnection(conn)

	return nil
}

// Закрытие подключения
func (cm *twitchWSService) CloseConnection(connID uuid.UUID, needLock bool) error {
	if needLock {
		cm.mu.Lock()
		defer cm.mu.Unlock()
	}

	conn, exists := cm.connections[connID]

	if !exists {
		logger.Debugf(context.Background(), "Connection %v not found for closing", connID)
		return fmt.Errorf("connection %v not found", connID)
	}

	logger.Debugf(conn.ctx, "Closing connection %v", connID)

	// Отменяем контекст, что приведет к завершению горутины
	conn.cancel()

	// Обновляем статус в БД
	cm.sendStatusUpdate(ConnectionStatus{
		ID:     connID,
		Status: "closing",
	})

	logger.Debugf(conn.ctx, "Connection %v close initiated", connID)
	return nil
}

// Получение состояния подключения
func (cm *twitchWSService) GetConnectionStatus(ctx context.Context, connID uuid.UUID) (*ConnectionStatus, error) {
	cm.mu.RLock()
	conn, exists := cm.connections[connID]
	cm.mu.RUnlock()

	if !exists {
		// Проверяем БД
		var status *ConnectionStatus
		session, err := cm.sqlDB.Queries().FindWebsocketConnectionByID(ctx, connID)
		if err != nil {
			return nil, fmt.Errorf("failed to find connection: %w", err)
		}

		status = &ConnectionStatus{
			ID:           session.ID,
			SessionID:    session.SessionID,
			Status:       session.Status,
			LastPing:     session.LastPing,
			ErrorCount:   int(session.ErrorCount),
			ErrorMessage: session.ErrorMessage,
		}

		return status, nil
	}

	return &ConnectionStatus{
		ID:         conn.ID,
		SessionID:  conn.SessionID,
		Status:     conn.Status,
		LastPing:   conn.LastPing,
		ErrorCount: conn.ErrorCount,
	}, nil
}

// Запуск WebSocket подключения в отдельной горутине
func (cm *twitchWSService) runConnection(conn *WebsocketConnection) {
	defer func() {
		logger.Debugf(conn.ctx, "WebSocket connection %s goroutine finished", conn.ID)
		cm.wg.Done()
	}()

	defer func() {
		logger.Debugf(conn.ctx, "WebSocket connection %s cleanup started", conn.ID)

		cm.mu.Lock()
		delete(cm.connections, conn.ID)
		cm.mu.Unlock()

		// Always skip status updates during shutdown - check service context, not connection context
		select {
		case <-cm.ctx.Done():
			logger.Debugf(conn.ctx, "WebSocket connection %s skipping status update due to service shutdown", conn.ID)
		default:
			// Only send status update if service is not shutting down
			cm.sendStatusUpdate(ConnectionStatus{
				ID:     conn.ID,
				Status: "closed",
			})
		}

		logger.Debugf(conn.ctx, "WebSocket connection %s cleanup finished", conn.ID)
	}()

	logger.Debugf(conn.ctx, "WebSocket connection %s goroutine started", conn.ID)

	// Обновляем статус
	cm.sendStatusUpdate(ConnectionStatus{
		ID:     conn.ID,
		Status: "connecting",
	})

	// Check if context is already cancelled before attempting to dial
	select {
	case <-conn.ctx.Done():
		logger.Debugf(conn.ctx, "WebSocket connection %s cancelled before dial", conn.ID)
		return
	default:
	}

	// Подключаемся к Twitch WebSocket with context-aware dialer
	logger.Debugf(conn.ctx, "WebSocket connection %s attempting to dial", conn.ID)
	dialer := websocket.DefaultDialer
	dialer.HandshakeTimeout = 10 * time.Second

	wsConn, _, err := dialer.DialContext(conn.ctx, "wss://eventsub.wss.twitch.tv/ws", nil)
	if err != nil {
		logger.Debugf(conn.ctx, "WebSocket connection %s dial failed: %v", conn.ID, err)
		cm.sendStatusUpdate(ConnectionStatus{
			ID:           conn.ID,
			Status:       "error",
			ErrorCount:   conn.ErrorCount + 1,
			ErrorMessage: err.Error(),
		})
		return
	}
	defer wsConn.Close()

	logger.Debugf(conn.ctx, "WebSocket connection %s dial successful", conn.ID)

	conn.Conn = wsConn
	conn.Status = "waiting_welcome"

	// Обновляем статус
	cm.sendStatusUpdate(ConnectionStatus{
		ID:     conn.ID,
		Status: conn.Status,
	})

	// Устанавливаем пинг/понг хендлеры
	wsConn.SetPingHandler(func(data string) error {
		conn.LastPing = time.Now()
		cm.sendStatusUpdate(ConnectionStatus{
			ID:       conn.ID,
			LastPing: conn.LastPing,
		})
		return wsConn.WriteControl(websocket.PongMessage, []byte(data), time.Now().Add(time.Second))
	})

	// Канал для приема сообщений
	messageChan := make(chan []byte)
	errorChan := make(chan error)

	// Читаем сообщения в отдельной горутине
	go func() {
		defer func() {
			close(messageChan)
			close(errorChan)
			logger.Debugf(conn.ctx, "WebSocket connection %s reading goroutine finished", conn.ID)
		}()

		logger.Debugf(conn.ctx, "WebSocket connection %s reading goroutine started", conn.ID)

		for {
			select {
			case <-conn.ctx.Done():
				// Context cancelled, stop reading
				logger.Debugf(conn.ctx, "WebSocket connection %s reading goroutine cancelled", conn.ID)
				return
			default:
				messageType, message, err := wsConn.ReadMessage()
				if err != nil {
					// Send error and exit goroutine
					logger.Debugf(conn.ctx, "WebSocket connection %s read error: %v", conn.ID, err)

					// Try to send error, but don't block if context is cancelled
					select {
					case errorChan <- err:
						logger.Debugf(conn.ctx, "WebSocket connection %s error sent to channel", conn.ID)
					case <-conn.ctx.Done():
						logger.Debugf(conn.ctx, "WebSocket connection %s skipping error send due to cancellation", conn.ID)
					}
					return
				}

				// Only process text/binary messages
				if messageType != websocket.TextMessage && messageType != websocket.BinaryMessage {
					continue
				}

				select {
				case messageChan <- message:
					// Message sent successfully
				case <-conn.ctx.Done():
					logger.Debugf(conn.ctx, "WebSocket connection %s reading goroutine cancelled while sending message", conn.ID)
					return
				}
			}
		}
	}()

	logger.Debugf(conn.ctx, "WebSocket connection %s entering main loop", conn.ID)

	// Обработка сообщений и управление жизненным циклом
	for {
		select {
		case <-conn.ctx.Done():
			// Контекст отменен, закрываем соединение
			logger.Debugf(conn.ctx, "WebSocket connection %s main loop cancelled", conn.ID)
			return

		case err, ok := <-errorChan:
			if !ok {
				// Channel closed, reading goroutine exited
				logger.Debugf(conn.ctx, "WebSocket connection %s error channel closed", conn.ID)
				return
			}
			// Ошибка чтения
			conn.ErrorCount++
			conn.Status = "error"
			logger.Debugf(conn.ctx, "WebSocket connection %s received error: %v", conn.ID, err)
			cm.sendStatusUpdate(ConnectionStatus{
				ID:           conn.ID,
				Status:       "error",
				ErrorCount:   conn.ErrorCount,
				ErrorMessage: err.Error(),
			})
			return

		case message, ok := <-messageChan:
			if !ok {
				// Channel closed, reading goroutine exited
				logger.Debugf(conn.ctx, "WebSocket connection %s message channel closed", conn.ID)
				return
			}
			// Получено сообщение
			if err := cm.handleTwitchMessage(conn.ctx, conn, message); err != nil {
				logger.Debugf(conn.ctx, "WebSocket connection %s handle twitch message error: %v", conn.ID, err)

				conn.ErrorCount++
				cm.sendStatusUpdate(ConnectionStatus{
					ID:           conn.ID,
					Status:       conn.Status,
					ErrorCount:   conn.ErrorCount,
					ErrorMessage: err.Error(),
				})
			}
		}
	}
}

// Обработка сообщений от Twitch
func (cm *twitchWSService) handleTwitchMessage(ctx context.Context, conn *WebsocketConnection, message []byte) error {
	var rawPayload map[string]any
	if err := json.Unmarshal(message, &rawPayload); err != nil {
		return fmt.Errorf("failed to parse message: %w", err)
	}

	rawMetadata, ok := rawPayload["metadata"].(map[string]any)
	if !ok {
		return fmt.Errorf("invalid message format: missing metadata")
	}
	metadataJson, err := json.Marshal(rawMetadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}
	metadata := &twitchws.Metadata{}
	if err := json.Unmarshal(metadataJson, metadata); err != nil {
		return fmt.Errorf("failed to unmarshal metadata: %w", err)
	}

	nestedPayload, ok := rawPayload["payload"].(map[string]any)
	if !ok {
		return fmt.Errorf("invalid notification message format")
	}
	payloadJson, err := json.Marshal(nestedPayload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	logger.Debugf(ctx, "Handle twitch message: %s with payload: %v", metadata.MessageType, nestedPayload)

	switch metadata.MessageType {
	case "session_welcome":
		sessionID, ok := nestedPayload["session"].(map[string]any)["id"].(string)
		if !ok {
			return fmt.Errorf("invalid session ID")
		}

		cm.sendStatusUpdate(ConnectionStatus{
			ID:        conn.ID,
			SessionID: &sessionID,
			Status:    "active",
		})

		cm.twitchEventService.OnWelcomeEvent(ctx, conn.ID, metadata, sessionID)
	case "session_keepalive":
		// Просто обновляем время последнего пинга
		conn.LastPing = time.Now()
		cm.sendStatusUpdate(ConnectionStatus{
			ID:       conn.ID,
			LastPing: conn.LastPing,
		})

		cm.twitchEventService.OnKeepaliveEvent(ctx, conn.ID, metadata, conn.SessionID)
	case "notification":
		notification := &twitchws.Notification{}
		if err := json.Unmarshal(payloadJson, notification); err != nil {
			return fmt.Errorf("failed to unmarshal payload: %w", err)
		}

		cm.twitchEventService.OnNotificationEvent(ctx, metadata, notification)
	case "session_reconnect":
		reconnectURL, ok := nestedPayload["session"].(map[string]any)["reconnect_url"].(string)
		if !ok {
			return fmt.Errorf("invalid reconnect URL")
		}

		// Обновляем статус
		conn.Status = "reconnecting"
		cm.sendStatusUpdate(ConnectionStatus{
			ID:     conn.ID,
			Status: "reconnecting",
		})

		// Закрываем текущее соединение
		conn.Conn.Close()

		// Подключаемся по новому URL
		newConn, _, err := websocket.DefaultDialer.Dial(reconnectURL, nil)
		if err != nil {
			return fmt.Errorf("failed to reconnect: %w", err)
		}

		conn.Conn = newConn
		conn.Status = "active"
		cm.sendStatusUpdate(ConnectionStatus{
			ID:     conn.ID,
			Status: "active",
		})
	}

	return nil
}

// Обновление статуса подключения в БД
func (cm *twitchWSService) updateConnectionStatusInDB(ctx context.Context, status ConnectionStatus) error {
	if status.SessionID == nil {
		status.SessionID = new(string)
	}

	_, err := cm.sqlDB.Queries().UpdateWebsocketConnection(ctx, db.UpdateWebsocketConnectionParams{
		ID:           status.ID,
		Status:       status.Status,
		SessionID:    *status.SessionID,
		LastPing:     status.LastPing,
		ErrorCount:   int32(status.ErrorCount),
		ErrorMessage: status.ErrorMessage,
	})
	return err
}

// Мониторинг подключений
func (cm *twitchWSService) connectionMonitor(ctx context.Context) {
	defer func() {
		logger.Debugf(ctx, "Connection monitor goroutine finished")
		cm.wg.Done()
	}()

	logger.Debugf(ctx, "Connection monitor started")

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			// Graceful shutdown requested
			logger.Debugf(ctx, "Connection monitor received cancellation signal")
			return
		case <-ticker.C:
			logger.Debugf(ctx, "Connection monitor is ticking")

			cm.mu.RLock()
			for id, conn := range cm.connections {
				// Проверяем устаревшие соединения (без пинга более 5 минут)
				if conn.Status == "active" && time.Since(conn.LastPing) > 5*time.Minute {
					logger.Debugf(ctx, "Connection %s has not received ping for too long, reconnecting", id)
					// Закрываем и позволяем автоматически переподключиться
					cm.CloseConnection(id, true)
				}
			}
			cm.mu.RUnlock()

			// Восстанавливаем подключения из БД, которые должны быть активны
			cm.restoreConnections(ctx)
		}
	}
}

func (cm *twitchWSService) subscriptionManager(ctx context.Context) {
	defer func() {
		logger.Debugf(ctx, "Subscription manager goroutine finished")
		cm.wg.Done()
	}()

	logger.Debugf(ctx, "Subscription manager started")

	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			// Graceful shutdown requested
			logger.Debugf(ctx, "Subscription manager received cancellation signal")
			return
		case <-ticker.C:
			logger.Debugf(ctx, "Subscription manager is ticking")

			cm.mu.Lock()
			err := cm.subscribeByRequests(ctx)
			if err != nil {
				logger.Errorf(ctx, "Error subscribing by requests: %v", err)
			}
			cm.mu.Unlock()
		}
	}
}

func (cm *twitchWSService) subscribeByRequests(ctx context.Context) error {
	tx, err := cm.sqlDB.Begin(ctx)
	if err != nil {
		return err
	}
	qtx := cm.sqlDB.Queries().WithTx(tx)

	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		} else {
			tx.Commit(ctx)
		}
	}()

	availableConnections, err := qtx.FindAvailableWebsocketConnectionsToSubscribe(ctx)
	if err != nil {
		return err
	}

	subscriptions, err := qtx.FindPendingEventSubscriptions(ctx)
	if err != nil {
		return err
	}

	subsByIdentityID := make(map[uuid.UUID][]*db.EventsubSubscription)
	for _, sub := range subscriptions {
		subsByIdentityID[sub.IdentityID] = append(subsByIdentityID[sub.IdentityID], sub)
	}

	logger.Debugf(ctx, "Found %d available connections and %d pending subscriptions", len(availableConnections), len(subscriptions))

	// Early return if no subscriptions to process
	if len(subscriptions) == 0 {
		logger.Debugf(ctx, "No pending subscriptions to process")
		return nil
	}

	logger.Debugf(ctx, "Found %d pending subscriptions", len(subscriptions))

	for _, conn := range availableConnections {
		subs := subsByIdentityID[conn.IdentityID]
		if len(subs) == 0 {
			continue
		}

		if err := cm.createAndAssign(ctx, qtx, conn.IdentityID, subs); err != nil {
			return err
		}

		delete(subsByIdentityID, conn.IdentityID)
	}

	if len(subsByIdentityID) == 0 {
		logger.Debugf(ctx, "All requested subscriptions assigned to existing connections")
		return nil
	}

	for identityID, subs := range subsByIdentityID {
		if err := cm.createAndAssign(ctx, qtx, identityID, subs); err != nil {
			return err
		}
	}

	logger.Debugf(ctx, "All requested subscriptions assigned to existing connections")
	return nil
}

func (cm *twitchWSService) asignSubscription(ctx context.Context, qtx *db.Queries, connID uuid.UUID, count int, sub *db.EventsubSubscription) error {
	err := qtx.UpdateEventsubSubscriptionConnectionID(ctx, db.UpdateEventsubSubscriptionConnectionIDParams{
		ID:           sub.ID,
		ConnectionID: connID,
		Status:       "assigned",
	})
	if err != nil {
		return err
	}

	err = qtx.UpdateWebsocketConnectionSubscriptionCount(ctx, db.UpdateWebsocketConnectionSubscriptionCountParams{
		ID:                connID,
		SubscriptionCount: int32(count),
	})
	if err != nil {
		return err
	}

	cm.connections[connID].SubscriptionCount++
	logger.Debugf(ctx, "Assigned subscription %s to connection %s [%d/%d]", sub.ID, connID, count, config.GetTwitchWebsocketSubscriptionsLimit())
	return nil
}

// createAndAssign — создаёт новую ws, заполняет её subscriptions
func (cm *twitchWSService) createAndAssign(ctx context.Context, qtx *db.Queries, identityID uuid.UUID, subs []*db.EventsubSubscription) error {
	connID, err := cm.CreateConnection(ctx, false, identityID)
	if err != nil {
		return err
	}

	for i, sub := range subs {
		if err := cm.asignSubscription(ctx, qtx, connID, i+1, sub); err != nil {
			return err
		}
	}
	return nil
}

// Восстановление подключений из БД
func (cm *twitchWSService) restoreConnections(ctx context.Context) {
	rows, err := cm.sqlDB.Queries().FindWebsocketConnectionsToRestore(ctx)
	if err != nil {
		log.Printf("Error querying connections to restore: %v", err)
		return
	}

	logger.Debugf(ctx, "Found %d connections to restore: %v", len(rows), rows)

	for _, connID := range rows {
		// Проверяем, есть ли уже такое подключение
		cm.mu.RLock()
		_, exists := cm.connections[connID]
		cm.mu.RUnlock()

		if !exists {
			// Восстанавливаем подключение
			log.Printf("Restoring connection %s", connID)
			if err := cm.executeConnection(ctx, connID, true); err != nil {
				log.Printf("Failed to restore connection %s: %v", connID, err)
			}
		} else {
			logger.Warnf(ctx, "Connection is not alive but found in memory: %s", connID)
		}
	}
}

// Shutdown gracefully shuts down the websocket service
func (cm *twitchWSService) Shutdown(ctx context.Context) error {
	logger.Debugf(ctx, "Starting websocket service shutdown")

	// Cancel the service context to stop all goroutines
	cm.cancel()

	// Close all active connections - get connection list first, then close without holding lock
	cm.mu.RLock()
	connIDs := make([]uuid.UUID, 0, len(cm.connections))
	for id := range cm.connections {
		connIDs = append(connIDs, id)
	}
	cm.mu.RUnlock()

	// Now close each connection without holding the main mutex
	for _, id := range connIDs {
		cm.CloseConnection(id, true)
	}
	logger.Debugf(ctx, "All websocket connections closed")

	// Close the status channel to signal statusUpdater to stop
	close(cm.statusChan)
	logger.Debugf(ctx, "Status channel closed")

	// Wait for all goroutines to finish with timeout
	done := make(chan struct{})
	go func() {
		cm.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.Debugf(ctx, "All goroutines finished - websocket service shutdown completed")
		return nil
	case <-ctx.Done():
		logger.Debugf(ctx, "Websocket service shutdown timed out")
		return ctx.Err()
	}
}

// sendStatusUpdate safely sends a status update to the status channel
func (cm *twitchWSService) sendStatusUpdate(status ConnectionStatus) {
	select {
	case cm.statusChan <- status:
		// Successfully sent
	default:
		// Channel is full or closed, skip the update
	}
}
