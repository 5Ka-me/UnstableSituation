# Data Processor Service

A Rust microservice that consumes sensor data from RabbitMQ and stores it in PostgreSQL.

## Overview

The Data Processor Service receives sensor data messages from RabbitMQ, validates and processes them, then persists the data to PostgreSQL for querying through the GraphQL Gateway.

## Features

- RabbitMQ message consumption
- Data validation and processing
- PostgreSQL storage
- Error handling and retry logic
- Processing statistics tracking

## Technology

- Rust
- Tokio (async runtime)
- Lapin (RabbitMQ client)
- SQLx (PostgreSQL client)

## Configuration

Configuration is managed through `config.yaml`:

- RabbitMQ connection settings
- Database connection string
- Processing parameters

## Running

```bash
# Local development
cargo run

# Docker
docker-compose up data-processor
```
