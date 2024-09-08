package utils

import (
	"net/http"
	"strconv"
)

func GetPagination(r *http.Request) (from, to int) {
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil {
		page = 0
	}

	size, err := strconv.Atoi(r.URL.Query().Get("size"))
	if err != nil {
		size = 20
	}

	if size > 100 {
		size = 100
	} else if size <= 0 {
		size = 1
	}

	from = page * size
	return from, from + size - 1
}
