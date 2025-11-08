# GraphQL Gateway

A .NET 8 GraphQL API gateway that provides query access to sensor data and real-time updates via SignalR.

## Overview

The GraphQL Gateway serves as the main API layer for the frontend, providing GraphQL queries for sensor readings, metrics, and aggregated data. It also includes a SignalR hub for real-time notifications.

## Features

- GraphQL API with HotChocolate
- Sensor data queries with filtering
- Aggregated metrics and statistics
- SignalR hub for real-time updates
- PostgreSQL integration via Entity Framework Core

## Technology

- .NET 8
- HotChocolate (GraphQL)
- Entity Framework Core
- SignalR
- PostgreSQL

## Endpoints

- `POST /graphql` - GraphQL endpoint
- `GET /graphql` - GraphQL Playground (Banana Cake Pop)
- `/notificationsHub` - SignalR hub endpoint

## Running

```bash
# Local development
dotnet run

# Docker
docker-compose up graphql-gateway
```

## GraphQL Queries

- `sensorReadings` - Get sensor readings
- `sensorMetrics` - Get aggregated metrics
- `aggregatedData` - Get time-series aggregated data
- `processingStats` - Get processing statistics

