# syntax=docker/dockerfile:1

# Build stage
FROM golang:1.24-bullseye AS buildx
WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Install kessoku
RUN go install github.com/mazrean/kessoku/cmd/kessoku@latest
ENV PATH="/go/bin:${PATH}"

# Copy source
COPY . .

# Generate wire file in the correct directory, but only if it doesn't exist
RUN if [ ! -f cmd/kessoku_band.go ]; then cd cmd && go generate ./cmd; fi

# Build binary with limited memory usage
RUN GOOS=linux CGO_ENABLED=0 go build -ldflags='-s' -o ./bin/api ./cmd
RUN GOOS=linux CGO_ENABLED=0 go build -ldflags='-s' -o ./bin/migrate ./cmd/migrate

# Runtime stage
FROM debian:bookworm-slim
WORKDIR /app

# Install ca-certificates
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binary from buildx
COPY --from=buildx /app/bin/api .
COPY --from=buildx /app/bin/migrate .
COPY --from=buildx /app/db/elasticsearch/migration ./db/elasticsearch/migration/

# Expose port (adjust if needed)
EXPOSE 8080

# Run the binary
CMD ["./bin/api"]