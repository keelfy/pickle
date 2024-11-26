package repo

import (
	"encoding/json"
	"log"

	"github.com/pickle.pw/monolith/models"
	"github.com/pickle.pw/monolith/storage"
	"github.com/supabase-community/postgrest-go"
	"github.com/supabase-community/supabase-go"
)

type Orders struct {
	sb *supabase.Client
}

func NewOrderRepository(sb *supabase.Client) *Orders {
	return &Orders{sb: sb}
}

const ordersTable = "orders"

func (repo *Orders) GetTotalElements(receiver string) (int, error) {
	sb := storage.InitSupabase()
	bytes, _, err := sb.From(ordersTable).Select("id", "exact", false).Filter("receiver", "eq", receiver).Execute()
	if err != nil {
		log.Printf("Error occurred during total orders count: %v", err)
		return 0, err
	}

	result := &[]struct{}{}

	err = json.Unmarshal(bytes[:], result)
	if err != nil {
		log.Printf("Error occurred during total orders unmarshalling: %v", err)
		return 0, err
	}

	return len(*result), nil
}

func (repo *Orders) GetOrders(receiver string, serialFrom, serialTo int) (*[]models.Order, int, error) {
	sb := storage.InitSupabase()
	bytes, _, err := sb.From(ordersTable).Select("*", "", false).Filter("receiver", "eq", receiver).Order("serial_number", &postgrest.OrderOpts{Ascending: true}).Range(serialFrom, serialTo, "").Execute()
	if err != nil {
		log.Printf("Error occurred during orders fetch: %v", err)
		return nil, 0, err
	}

	orders := &[]models.Order{}
	err = json.Unmarshal(bytes[:], orders)
	if err != nil {
		log.Printf("Error occurred during orders parsing: %v", err)
		return nil, 0, err
	}

	totalElements, err := repo.GetTotalElements(receiver)
	if err != nil {
		log.Printf("Error occurred during total orders calculation: %v", err)
		return nil, 0, err
	}

	return orders, totalElements, nil
}

func (repo *Orders) GetLastOrders(receiver string, amount int) (*[]models.Order, int, error) {
	return repo.GetOrders(receiver, 0, amount-1)
}
