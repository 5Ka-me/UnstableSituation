# Data Ingestor Service

A simple Go application for fetching and processing data from an unstable external API as part of a microservices architecture.

## Description

Data Ingestor Service is the first microservice in the system that:
- Fetches weather data from an unstable external API
- Sends data to RabbitMQ message queue
- Provides HTTP API for monitoring and manual triggering

## Architecture

```
External API (WeakApp) → Data Ingestor → RabbitMQ → Data Processor
```

## Features

- ✅ Fetches data from external API every 5 seconds
- ✅ Sends data to RabbitMQ queue
- ✅ HTTP API for health check and manual triggering
- ✅ Error handling and structured logging
- ✅ Graceful shutdown
- ✅ Docker containerization

## Project Structure

```
.
├── cmd/
│   └── data-ingestor/
│       ├── main.go
│       └── main_test.go
├── config.yaml
├── config.local.yaml
├── Dockerfile
├── docker-compose.yml
├── go.mod
├── go.sum
├── Makefile
├── check-service.sh
├── check-service.ps1
└── README.md
```

## Quick Start

### Local Development

1. Install dependencies:
```bash
make deps
```

2. Start RabbitMQ locally:
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management-alpine
```

3. Start the unstable API (WeakApp):
```bash
docker run -d --name weakapp -p 5000:5000 nantonov/weakapp:latest
```

4. Update config for local development:
```yaml
api:
  base_url: "http://localhost:5000"  # URL of unstable API
```

5. Run the application:
```bash
make run
```

### Docker Deployment

1. Start the entire stack:
```bash
make docker-run
```

2. Stop:
```bash
make docker-stop
```

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T12:00:00Z",
  "service": "data-ingestor"
}
```

### POST /ingest
Manual trigger for data fetching and sending.

**Response:**
```json
{
  "message": "Data ingested successfully",
  "data": {
    "id": 1,
    "temperature": 25.5,
    "humidity": 60.0,
    "pressure": 1013.25,
    "location": "Moscow",
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

## Configuration

The `config.yaml` file contains settings:

```yaml
server:
  port: "8080"
  host: "0.0.0.0"

api:
  base_url: "http://weakapp:5000"
  timeout: 30s
  retry_count: 3

rabbitmq:
  url: "amqp://guest:guest@rabbitmq:5672/"
  queue_name: "weather_data"

logging:
  level: "info"
```

## Testing

```bash
# Run tests
make test

# Run tests with coverage
make test-coverage
```

## Monitoring

- **HTTP Server**: http://localhost:8080
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## Service Verification

### Using PowerShell (Windows):
```powershell
.\check-service.ps1
```

### Using Bash (Linux/Mac):
```bash
chmod +x check-service.sh
./check-service.sh
```

## Next Steps

This basic application is ready for expansion with:

1. **Data Processor Service** - Process messages from RabbitMQ
2. **GraphQL API Gateway** - Provide data through GraphQL
3. **Notification Service** - Real-time notifications via WebSocket
4. **Frontend** - React/Angular interface
5. **CI/CD** - GitHub Actions pipelines

## Technical Details

- **Language**: Go 1.21
- **HTTP Framework**: Gin
- **Logging**: Logrus
- **Message Queue**: RabbitMQ
- **Containerization**: Docker
- **Testing**: Testify

## Development

```bash
# Format code
make fmt

# Lint code
make lint

# Build
make build

# Clean
make clean
```

## Troubleshooting

### Port Already in Use
If port 8080 is occupied, change in config.yaml:
```yaml
server:
  port: "8081"  # Different port
```

### RabbitMQ Not Starting
Check if Docker is running and ports are free:
```bash
docker ps
netstat -an | findstr :5672  # Windows
netstat -an | grep :5672     # Linux/Mac
```

### WeakApp API Unavailable
Ensure container is running:
```bash
docker logs weakapp
curl http://localhost:5000/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is part of a microservices architecture demonstration.
