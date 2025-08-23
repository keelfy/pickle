# syntax=docker/dockerfile:1

# Build stage
FROM golang:1.24 AS builder
WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary
RUN go build -o monolith .

# Runtime stage
FROM debian:bookworm-slim
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/monolith .

# Expose port (adjust if needed)
EXPOSE 8080

# Run the binary
CMD ["./monolith"]