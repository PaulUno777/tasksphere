# TaskSphere Backend

A robust task management system built with Go and Fiber framework following Clean Architecture principles.

## Features

- 🏗️ **Clean Architecture** - Well-structured, maintainable codebase
- 🚀 **Fiber Framework** - Fast and efficient HTTP server
- 🔐 **JWT Authentication** - Secure access and refresh token implementation
- 🌐 **WebSocket Support** - Real-time notifications
- 📊 **MongoDB Integration** - Flexible document database
- ⚡ **Redis Caching** - High-performance caching layer
- 🌍 **Internationalization** - Multi-language support (EN/FR)
- 📝 **Comprehensive Logging** - Structured logging with rotation
- 🔍 **Request Validation** - Input validation with custom validators
- 📄 **Pagination** - Efficient data pagination
- 🛡️ **Rate Limiting** - API rate limiting protection
- 🧪 **Testing Ready** - Unit and integration test structure

## Quick Start

### Prerequisites

- Go 1.21+
- MongoDB
- Redis
- Docker (optional, for services)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tasksphere/backend
```

2. Install dependencies:
```bash
make deps
```

3. Set up environment:
```bash
make env
# Edit .env file with your configuration
```

4. Start external services (optional):
```bash
make docker-up
```

5. Run the application:
```bash
# Development mode with hot reload
make dev

# Or normal run
make run
```

## Development

### Available Commands

```bash
make help          # Show all available commands
make dev           # Start with hot reload
make build         # Build the application
make test          # Run tests
make lint          # Run linter
make format        # Format code
make clean         # Clean build artifacts
```

### Project Structure

The project follows Clean Architecture principles:

- `cmd/` - Application entry points
- `config/` - Configuration management
- `domain/` - Business entities and interfaces
- `usecase/` - Business logic implementation
- `interface/` - HTTP handlers and routes
- `infrastructure/` - External services (DB, cache, etc.)
- `pkg/` - Utility packages

## Environment Variables

See `.env.example` for all available configuration options.

## Testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage
```

## Deployment

```bash
# Build for production
make build

# Binary will be available at bin/tasksphere