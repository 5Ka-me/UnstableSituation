# Notification Service

A Node.js microservice that monitors sensor data from RabbitMQ and sends real-time notifications via SignalR.

## Overview

The Notification Service analyzes incoming sensor data from RabbitMQ, detects threshold violations (high CO2, PM2.5, energy consumption, etc.), and sends notifications to connected clients through the GraphQL Gateway's SignalR hub.

## Features

- RabbitMQ message consumption
- Sensor data analysis with configurable thresholds
- Real-time notification delivery via SignalR
- Health check endpoint
- Automatic reconnection handling

## Technology

- Node.js 24.10
- Express
- amqplib (RabbitMQ client)
- @microsoft/signalr

## Notification Types

- **Air Quality**: CO2 and PM2.5 level warnings
- **Energy**: High consumption alerts
- **Motion**: Motion detection notifications
- **Humidity**: Humidity level warnings

## Configuration

Environment variables:

- `RABBITMQ_URL` - RabbitMQ connection URL
- `SIGNALR_URL` - SignalR hub URL
- `PORT` - Service port

## Running

```bash
# Local development
npm start

# Docker
docker-compose up notification-service
```

## Endpoints

- `GET /health` - Health check
