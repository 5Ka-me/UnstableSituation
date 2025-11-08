# Notification Service

Real-time notification service that monitors sensor data from RabbitMQ and sends notifications via SignalR to connected clients.

## Features

- **Real-time Monitoring**: Consumes sensor data from RabbitMQ
- **Smart Notifications**: Analyzes sensor data and generates notifications based on configurable thresholds
- **SignalR Integration**: Sends notifications to clients via SignalR Hub in GraphQLGateway
- **Health Monitoring**: Provides health check endpoint

## Notification Types

### Air Quality Notifications
- **CO2 Levels**:
  - Warning: ≥ 800 ppm
  - Critical: ≥ 1000 ppm
- **PM2.5 Levels**:
  - Warning: ≥ 35 µg/m³
  - Critical: ≥ 50 µg/m³
- **Humidity**:
  - Warning: < 30% or > 70%

### Energy Notifications
- **Energy Consumption**:
  - Warning: ≥ 800 kWh
  - Critical: ≥ 1000 kWh

### Motion Notifications
- **Motion Detection**: Info notification when motion is detected

## Configuration

Environment variables:

- `PORT`: Service port (default: 3001)
- `RABBITMQ_URL`: RabbitMQ connection URL (default: amqp://guest:guest@localhost:5672/)
- `RABBITMQ_EXCHANGE_NAME`: Exchange name (default: meter-data-exchange)
- `RABBITMQ_QUEUE_NAME`: Queue name (default: meter-data-queue)
- `RABBITMQ_ROUTING_KEY`: Routing key (default: meter.data)
- `SIGNALR_URL`: SignalR Hub URL (default: http://localhost:5284/notificationsHub)

## Running Locally

```bash
npm install
npm start
```

## Docker

```bash
docker build -t notification-service .
docker run -p 3001:3001 notification-service
```

