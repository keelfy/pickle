package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"slices"

	"github.com/gorilla/websocket"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ProfileEventsHandler interface {
	GetProfileOrdersWebSocket(w http.ResponseWriter, r *http.Request)
}

type profileEventsHandler struct {
	profileService services.ProfileService
	ordersBroker   services.OrdersBrokerService
}

func NewProfileEventsHandler(profileService services.ProfileService) ProfileEventsHandler {
	return &profileEventsHandler{
		profileService: profileService,
		ordersBroker:   services.NewOrdersBrokerService(),
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")

		// Allow requests with no origin (like mobile apps or curl)
		// if origin == "" {
		// 	return true
		// }

		u, err := url.Parse(origin)
		if err != nil {
			return false
		}

		allowedHosts := config.GetCorsAllowedOrigins()

		if slices.Contains(allowedHosts, u.Host) {
			return true
		}

		if strings.HasPrefix(u.Host, "localhost:") {
			return true
		}

		log.Printf("Rejected WebSocket connection from origin: %s", origin)
		return false
	},
	HandshakeTimeout: 10 * time.Second,
}

func (h *profileEventsHandler) GetProfileOrdersWebSocket(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	receiverID, err := binders.BindPathVariableAsUUID(r, binders.UserIDVariable)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	// Upgrade connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Upgrade error: %v", err)
		return
	}

	// Important: Close connection when handler returns
	defer func() {
		conn.WriteControl(
			websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
			time.Now().Add(time.Second),
		)
		conn.Close()
		log.Printf("WebSocket closed for user %s", receiverID)
	}()

	// Configure WebSocket connection
	conn.SetReadLimit(4096)
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		// Reset the read deadline when we get a pong response
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Subscribe to orders
	orderChan := h.ordersBroker.Subscribe(receiverID)
	defer h.ordersBroker.Unsubscribe(receiverID, orderChan)

	// Send connected message
	connectedMsg := map[string]any{
		"type": "connected",
		"data": map[string]any{
			"message": "Connected to order stream",
		},
	}

	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	if err := conn.WriteJSON(connectedMsg); err != nil {
		log.Printf("Error sending connected message: %v", err)
		return
	}

	// Set up ping interval
	pingTicker := time.NewTicker(30 * time.Second)
	defer pingTicker.Stop()

	// Set up pong handler
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Set initial read deadline
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))

	// Start a goroutine to read messages from the client
	go func() {
		for {
			messageType, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err,
					websocket.CloseGoingAway, websocket.CloseNormalClosure) {
					log.Printf("WebSocket read error: %v", err)
				}
				return
			}

			if messageType == websocket.TextMessage {
				// Process client messages if needed
				var msg map[string]any
				if err := json.Unmarshal(message, &msg); err == nil {
					if msgType, ok := msg["type"].(string); ok && msgType == "ping" {
						// Respond to ping with pong
						conn.WriteJSON(map[string]string{"type": "pong"})
					}
				}
			}
			// Reset read deadline whenever we receive a message
			conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		}
	}()

	// Main loop
	for {
		select {
		case order := <-orderChan:
			// Send new order to client
			err := conn.WriteJSON(map[string]any{
				"type": "order",
				"data": order,
			})
			if err != nil {
				log.Printf("Order write error: %v", err)
				return
			}

		case <-pingTicker.C:
			// Send ping to client
			err := conn.WriteControl(
				websocket.PingMessage,
				[]byte{},
				time.Now().Add(time.Second),
			)
			if err != nil {
				log.Printf("Ping error: %v", err)
				return
			}
		}
	}
}
