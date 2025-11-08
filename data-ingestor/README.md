# Data Ingestor Service (.NET 8)

A .NET 8 application for fetching and processing data from an unstable external API as part of a microservices architecture.

## Description

Data Ingestor Service is the first microservice in the system that:
- Fetches sensor data from an unstable external API (WeakApp)
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
- ✅ Error handling and structured logging (Serilog)
- ✅ Graceful shutdown
- ✅ Docker containerization
- ✅ YAML configuration support

## Project Structure

```
.
├── Configuration/
│   └── AppConfig.cs
├── Controllers/
│   ├── HealthController.cs
│   └── MetersController.cs
├── Models/
│   └── SensorData.cs
├── Services/
│   ├── ApiClientService.cs
│   ├── ConfigLoader.cs
│   ├── DataIngestionService.cs
│   └── RabbitMQService.cs
├── config.yaml
├── Dockerfile
├── DataIngestor.csproj
└── Program.cs
```

## Quick Start

### Local Development

1. Install .NET 8 SDK

2. Start RabbitMQ locally:
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management-alpine
```

3. Start the unstable API (WeakApp):
```bash
docker run -d --name weakapp -p 8081:8080 nantonov/weakapp:latest
```

4. Update config.yaml for local development:
```yaml
api:
  base_url: "http://localhost:8081"  # URL of unstable API
```

5. Run the application:
```bash
dotnet run
```

### Docker Deployment

1. Start the entire stack:
```bash
docker-compose up -d
```

2. Stop:
```bash
docker-compose down
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

### POST /meters
Manual trigger for data fetching and sending.

**Response:**
```json
{
  "message": "Data ingested successfully",
  "data": [
    {
      "type": "temperature",
      "name": "sensor1",
      "payload": {
        "value": 25.5,
        "unit": "celsius"
      }
    }
  ]
}
```

## Configuration

The `config.yaml` file contains settings:

```yaml
server:
  port: "8080"
  host: "0.0.0.0"

api:
  base_url: "http://weakapp-api:8080"
  timeout: 30s
  retry_count: 3

rabbitmq:
  url: "amqp://guest:guest@rabbitmq:5672/"
  queue_name: "meter-data-queue"

logging:
  level: "info"
```

## Technical Details

- **Language**: C# (.NET 8)
- **HTTP Framework**: ASP.NET Core
- **Logging**: Serilog
- **Message Queue**: RabbitMQ.Client
- **Configuration**: YAML (YamlDotNet)
- **Containerization**: Docker

## Development

```bash
# Build
dotnet build

# Run
dotnet run

# Run with custom config
dotnet run -- -config config.local.yaml
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
```

### WeakApp API Unavailable
Ensure container is running:
```bash
docker logs weakapp
curl http://localhost:8081/health
```

## License

This project is part of a microservices architecture demonstration.

