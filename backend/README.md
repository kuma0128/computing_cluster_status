# Cluster Status Monitor - Go Backend

Modern Go backend for the Cluster Status Monitoring System.

## Architecture

```
backend/
├── cmd/
│   └── server/          # Application entry point
│       └── main.go
├── internal/
│   ├── api/            # HTTP API layer
│   │   ├── handlers/   # Request handlers
│   │   └── router.go   # Route configuration
│   ├── storage/        # Storage abstraction layer
│   │   ├── storage.go  # Interface definition
│   │   ├── json.go     # JSON file storage
│   │   └── mysql.go    # MySQL storage
│   ├── models/         # Data models
│   └── config/         # Configuration management
├── Dockerfile
└── go.mod
```

## Features

- **Modern Go Architecture**: Clean, idiomatic Go code with proper separation of concerns
- **Storage Abstraction**: Support for both JSON files and MySQL database
- **RESTful API**: Chi router with middleware support
- **Health Checks**: Built-in health check endpoint
- **Graceful Shutdown**: Proper signal handling and graceful shutdown
- **Docker Ready**: Optimized multi-stage Docker build

## API Endpoints

### Metrics API

- `GET /api/metrics?type={type}` - Get metrics data
  - Types: `current`, `load`, `pbs`, `cpu`, `nodes`, `all`

### Cluster API

- `GET /api/cluster?name={name}&type={type}` - Get cluster information
  - Types: `users`, `disk`, `history`, or omit for summary

### Health Check

- `GET /health` - Health check endpoint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `STORAGE_TYPE` | Storage type (`json` or `mysql`) | `json` |
| `STORAGE_PATH` | Path for JSON storage | `./data` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | MySQL database name | `cluster_status` |
| `DB_USER` | MySQL username | `cluster_user` |
| `DB_PASSWORD` | MySQL password | `cluster_pass` |

## Development

### Prerequisites

- Go 1.22 or higher
- Docker (optional, for containerized development)

### Local Development

```bash
# Install dependencies
go mod download

# Run tests
go test -v ./...

# Run the server
go run cmd/server/main.go

# Build binary
go build -o server cmd/server/main.go
```

### Docker Development

```bash
# Build image
docker build -t cluster-status-backend .

# Run container
docker run -p 8080:8080 \
  -e STORAGE_TYPE=json \
  -e STORAGE_PATH=/data \
  -v $(pwd)/data:/data \
  cluster-status-backend
```

## Testing

```bash
# Run all tests
go test -v ./...

# Run tests with coverage
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run tests with race detector
go test -v -race ./...
```

## Deployment

The application is designed to run in Docker containers. See the root `docker-compose.yml` for the complete deployment configuration.

```bash
# From project root
docker compose up -d
```

## Migration from PHP

This Go backend replaces the legacy PHP backend with:

- Better performance and lower memory usage
- Type safety and compile-time error checking
- Built-in concurrency support
- Modern tooling and ecosystem
- Easier testing and maintainability

The API remains backward compatible with the PHP version for seamless migration.
