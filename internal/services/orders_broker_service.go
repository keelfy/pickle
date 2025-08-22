package services

import (
	"fmt"
	"slices"
	"sync"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

type OrdersBrokerService interface {
	PublishOrder(order *domain.Order)
	Subscribe(userID uuid.UUID) chan *domain.Order
	Unsubscribe(userID uuid.UUID, client chan *domain.Order)
}

type ordersBrokerService struct {
	clients map[uuid.UUID][]chan *domain.Order
	mu      sync.Mutex
}

func NewOrdersBrokerService() OrdersBrokerService {
	return &ordersBrokerService{
		clients: make(map[uuid.UUID][]chan *domain.Order),
		mu:      sync.Mutex{},
	}
}

// Subscribe a client to updates for a specific user
func (b *ordersBrokerService) Subscribe(userID uuid.UUID) chan *domain.Order {
	b.mu.Lock()
	defer b.mu.Unlock()

	client := make(chan *domain.Order, 5) // Buffer a few messages

	if _, exists := b.clients[userID]; !exists {
		b.clients[userID] = []chan *domain.Order{}
	}

	b.clients[userID] = append(b.clients[userID], client)
	fmt.Printf("Client subscribed to user %s (total: %d)\n",
		userID, len(b.clients[userID]))

	return client
}

// Unsubscribe a client
func (b *ordersBrokerService) Unsubscribe(userID uuid.UUID, client chan *domain.Order) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if _, exists := b.clients[userID]; !exists {
		return
	}

	// Find and remove client
	for i, ch := range b.clients[userID] {
		if ch == client {
			b.clients[userID] = slices.Delete(b.clients[userID], i, i+1)
			close(ch)
			break
		}
	}

	fmt.Printf("Client unsubscribed from user %s (remaining: %d)\n",
		userID, len(b.clients[userID]))
}

// Publish a new order to all subscribed clients for a user
func (b *ordersBrokerService) PublishOrder(order *domain.Order) {
	b.mu.Lock()
	defer b.mu.Unlock()

	userID := order.ReceiverID
	if _, exists := b.clients[userID]; !exists {
		return
	}

	// Send to all clients subscribed to this user
	for _, client := range b.clients[userID] {
		// Non-blocking send to avoid slow clients blocking others
		select {
		case client <- order:
		default:
			// Client too slow, could log this
		}
	}
}
