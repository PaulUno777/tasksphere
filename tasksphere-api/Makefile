.PHONY: help build run dev test lint format clean tidy deps docker-up docker-down

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
dev: ## Run the application in development mode with hot reload
	@echo "Starting development server with hot reload..."
	@air

run: ## Run the application
	@echo "Running application..."
	@go run cmd/main.go

build: ## Build the application
	@echo "Building application..."
	@go build -o bin/tasksphere cmd/main.go

# Code quality
test: ## Run tests
	@echo "Running tests..."
	@go test -v ./...

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html

lint: ## Run linter
	@echo "Running linter..."
	@golangci-lint run

format: ## Format code
	@echo "Formatting code..."
	@gofmt -s -w .
	@goimports -w .

# Dependencies
deps: ## Download dependencies
	@echo "Downloading dependencies..."
	@go mod download

tidy: ## Tidy dependencies
	@echo "Tidying dependencies..."
	@go mod tidy

# Utilities
clean: ## Clean build artifacts
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -rf tmp/
	@rm -rf logs/
	@rm -f coverage.out coverage.html

# Docker (for external services)
docker-up: ## Start external services (MongoDB, Redis)
	@echo "Starting external services..."
	@docker-compose up -d

docker-down: ## Stop external services
	@echo "Stopping external services..."
	@docker-compose down

# Environment
env: ## Copy environment file
	@echo "Copying environment file..."
	@cp .env.example .env
	@echo "Please edit .env file with your configuration"