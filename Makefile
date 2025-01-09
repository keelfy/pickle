exportPath:
	export GOPATH=$HOME/go && export PATH=$PATH:$GOROOT/bin:$GOPATH/bin

gen:
	wire ./cmd && sqlc generate

build:
	go build -o bin/cmd ./cmd

run:
	go run ./cmd
