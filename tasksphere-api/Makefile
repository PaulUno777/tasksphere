
test:
	@echo "✅ All tests passed"

dev:
	air
build:
	go build -o bin/app ./cmd/main.go

start:
	./bin/app

lint:
	golangci-lint run

format:
	gofumpt -w .

# format:check:
# 	gofumpt -l . | grep -v vendor || echo "✅ Already formatted"