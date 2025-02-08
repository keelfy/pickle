GO_DIR ?= $(shell pwd)
GO_PKG ?= $(shell go list -e -f "{{ .ImportPath }}")

GOOS ?= $(shell go env GOOS || echo linux)
GOARCH ?= $(shell go env GOARCH || echo amd64)
CGO_ENABLED ?= 0

install: init ## install cli tools
	go get -v github.com/rubenv/sql-migrate/... ;\
    go get -u github.com/google/wire/cmd/wire ;

init: ## init packages
	mkdir -p artifacts ;\
    rm -rf artifacts/*

start: ## start daemon on development mode
	./artifacts/bin daemon -c ./artifacts/configs/development.yaml -d

dependencies: ## generate dependencies
	go mod download

add-migration: ## add migration
	migrate create -ext sql -dir $(GO_DIR)/db/migration $(name)

migrate-up: ## migrate up
	migrate -database "$DATABASE_URL" -path $(GO_DIR)/db/migration up

migrate-down: ## migrate down
	migrate -database "$DATABASE_URL" -path $(GO_DIR)/db/migration down

# TODO: Will be used later to communicate with other services
prototool-generate: ## generate proto file
	protoc --go_out=generated --go_opt=paths=source_relative --go-grpc_out=generated --go-grpc_opt=paths=source_relative resources/proto/products/products.proto
	protoc --go_out=generated --go_opt=paths=source_relative --go-grpc_out=generated --go-grpc_opt=paths=source_relative resources/proto/health_checks/health_checks.proto

build: init ## build binary file
	GOOS=${GOOS} CGO_ENABLED=${CGO_ENABLED} GOARCH=${GOARCH} \
	go build -ldflags='-s' -o "$(GO_DIR)/artifacts/bin" "$(GO_DIR)/cmd"

test: ## test application with race
	go test -v $(GO_DIR)/...

coverage: ## test coverage
	go test -coverprofile=coverage.out $(GO_DIR)/...
	go tool cover -html coverage.out

gen:
	wire $(GO_DIR)/cmd && sqlc generate && swag init -g $(GO_DIR)/cmd/main.go --parseDependency --parseInternal

run:
	go run $(GO_DIR)/cmd

.DEFAULT_GOAL := run

# Useful to setup paths
# export GOPATH=$HOME/go && export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
