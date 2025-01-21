exportPath:
	export GOPATH=$HOME/go && export PATH=$PATH:$GOROOT/bin:$GOPATH/bin

gen:
	wire ./cmd && sqlc generate && swag init -g cmd/main.go --parseDependency --parseInternal

build:
	go build -o bin/cmd ./cmd

run:
	go run ./cmd
