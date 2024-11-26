package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/repo"
	"github.com/pickle.pw/monolith/types"
	"github.com/pickle.pw/monolith/utils"
)

type User struct {
	userRepo *repo.Users
}

func NewUserHandler(userRepo *repo.Users) *User {
	return &User{userRepo: userRepo}
}

func (h *User) GetUserDetails(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	user, err := h.userRepo.GetUserById(id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if user == nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	w.Header().Add(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &types.UserDetailsRes{}
	copier.Copy(response, user)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding user response: %v", err)
	}
}
