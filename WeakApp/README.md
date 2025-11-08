# WeakApp API

An external API service that provides sensor data for the IoT monitoring system.

## Overview

WeakApp is an external API that simulates IoT sensor data. It provides meter readings including energy consumption, air quality measurements, and motion detection data.

## Features

- Sensor data endpoint
- Health check endpoints
- API key authentication

## Endpoints

- `GET /meters` - Get sensor data (requires `X-Api-Key: supersecret`)
- `GET /health` - Health check
- `GET /healthz` - Health check
- `GET /.well-known/health` - Health check

## Running

```bash
# Docker
docker-compose up weakapp
```

## Access

- API URL: http://localhost:8081
- Health: http://localhost:8081/health
