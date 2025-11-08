# IoT Sensor Monitoring System

A microservices-based system for monitoring IoT sensor data with real-time notifications and data visualization.

## Architecture

```
[WeakApp API] → [Data Ingestor] → [RabbitMQ] → [Data Processor] → [PostgreSQL]
                                                                    ↓
[Frontend] ← [GraphQL Gateway] ← [PostgreSQL] ← [Notification Service] ← [RabbitMQ]
```

## Services

- **WeakApp** - External API providing sensor data
- **Data Ingestor** (.NET 8) - Fetches data from external API and publishes to RabbitMQ
- **Data Processor** (Rust) - Consumes messages from RabbitMQ and stores in PostgreSQL
- **GraphQL Gateway** (.NET 8) - GraphQL API for querying sensor data with SignalR support
- **Notification Service** (Node.js) - Analyzes sensor data and sends real-time notifications via SignalR
- **Frontend** (React) - Web dashboard for visualizing sensor data and receiving notifications

## Technology Stack

- **Backend**: .NET 8, Rust, Node.js 24.10
- **Frontend**: React, TypeScript, Ant Design
- **Message Queue**: RabbitMQ
- **Database**: PostgreSQL
- **API**: GraphQL (HotChocolate)
- **Real-time**: SignalR
- **Containerization**: Docker, Docker Compose

## Quick Start

1. **Start all services**:
   ```bash
   docker-compose up --build
   ```

2. **Access services**:
   - Frontend: http://localhost:3000
   - GraphQL Playground: http://localhost:5284/graphql
   - RabbitMQ Management: http://localhost:15672 (guest/guest)
   - Adminer: http://localhost:8083

## Project Structure

```
.
├── data-ingestor/          # .NET 8 service for data ingestion
├── data-processor-service/ # Rust service for data processing
├── GraphQLGateway/        # .NET 8 GraphQL API gateway
├── notification-service/  # Node.js notification service
├── unstable-situation/    # React frontend application
├── WeakApp/              # External API service
└── docker-compose.yaml   # Docker Compose configuration
```

## Features

- Real-time sensor data ingestion
- Data processing and storage
- GraphQL API with filtering and aggregation
- Real-time notifications via SignalR
- Interactive dashboard with charts and metrics
- Automatic data updates every 5 seconds

## Development

Each service can be run independently or as part of the Docker Compose stack. See individual service README files for specific setup instructions.
