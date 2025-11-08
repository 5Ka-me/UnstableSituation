# Data Ingestor Service

A .NET 8 microservice that fetches sensor data from an external API and publishes it to RabbitMQ.

## Overview

The Data Ingestor Service periodically fetches sensor data from the WeakApp API and sends it to RabbitMQ for further processing by the Data Processor Service.

## Features

- Periodic data fetching (every 12 seconds)
- RabbitMQ message publishing
- Health check endpoint
- Structured logging with Serilog
- Docker containerization

## Technology

- .NET 8
- ASP.NET Core
- RabbitMQ.Client
- Serilog

## Configuration

Configuration is managed through `appsettings.json` and environment variables:

- API endpoint URL
- RabbitMQ connection settings
- Fetch interval
- Logging level

## Running

```bash
# Local development
dotnet run

# Docker
docker-compose up data-ingestor
```

## Endpoints

- `GET /health` - Health check
- `POST /meters` - Manual trigger for data ingestion
