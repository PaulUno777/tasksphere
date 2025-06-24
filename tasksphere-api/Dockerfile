# ---- Development Stage ----
FROM golang:1.24-alpine AS development

WORKDIR /app

RUN apk add --no-cache git curl

RUN go install github.com/cosmtrek/air@latest

COPY go.mod go.sum ./

RUN go mod download

COPY . .

CMD ["air"]

# ---- Build Stage ----
FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o bin/app ./cmd/main.go

# ---- Production Stage ----
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/bin/app .

EXPOSE 3000

CMD ["./app"]