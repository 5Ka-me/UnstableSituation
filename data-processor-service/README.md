# DataProcessorService

DataProcessorService is a Rust-based microservice that is part of a microservices architecture for processing data from an unstable external API.

## Description

DataProcessorService is responsible for:
- Reading messages from RabbitMQ queue
- Processing and validating meter data
- Storing data in PostgreSQL database
- Providing metrics for monitoring

## Architecture

The service is part of a microservices architecture and interacts with:
- **RabbitMQ** - for receiving messages from Data Ingestor Service
- **PostgreSQL** - for storing processed data
- **Prometheus** - for metrics export

## Technology Stack

- **Rust** 1.90+ - primary programming language
- **Tokio** - asynchronous runtime
- **Lapin** - RabbitMQ client for working with RabbitMQ
- **SQLx** - asynchronous PostgreSQL client
- **Serde** - serialization/deserialization
- **Tracing** - structured logging
- **OpenTelemetry** - metrics and observability

## Project Structure

```
DataProcessorService/
├── src/
│   ├── main.rs              # Entry point
│   ├── lib.rs               # Library modules
│   ├── config.rs            # Configuration
│   ├── database.rs          # Database operations
│   ├── rabbitmq.rs          # RabbitMQ client
│   ├── models.rs            # Data models
│   ├── processor.rs         # Main processing logic
│   └── metrics.rs           # Metrics
├── migrations/              # SQL migrations
├── config.yaml             # Configuration file
├── Dockerfile              # Docker image
├── Cargo.toml              # Rust dependencies
└── README.md               # Documentation
```

## Installation and Running

### Local Development

1. Install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Install dependencies:
```bash
cargo build
```

3. Run tests:
```bash
cargo test
```

4. Run the service:
```bash
cargo run --bin data_processor_service -- --config config.yaml
```

### Docker

1. Build the image:
```bash
docker build -t data-processor-service .
```

2. Run the container:
```bash
docker run -p 8082:8082 data-processor-service
```

### Docker Compose

The service automatically starts with other microservices:

```bash
docker-compose up data-processor
```

## Configuration

Main configuration parameters in `config.yaml`:

```yaml
rabbitmq:
  connection_string: "amqp://guest:guest@rabbitmq:5672/%2f"
  exchange_name: "meter-data-exchange"
  queue_name: "meter-data-queue"
  routing_key: "meter.data"

database:
  url: "postgres://postgres:postgres@postgres:5432/microservices_db"
  max_connections: 10

processing:
  batch_size: 100
  processing_interval_ms: 1000
  retry_attempts: 3
```

## API and Metrics

### Health Check
- **Endpoint**: `GET /health`
- **Description**: Service health check

### Metrics (Prometheus)
- **Endpoint**: `GET /metrics`
- **Port**: 8082

Available metrics:
- `messages_processed_total` - total number of processed messages
- `messages_failed_total` - total number of failed messages
- `processing_duration_seconds` - message processing time
- `batch_size` - size of processed batches

## Database

### Tables

1. **meter_data** - main table for storing meter data
2. **processing_stats** - processing statistics
3. **aggregated_data** - aggregated data for analytics

### Migrations

Migrations are automatically executed when the service starts using SQLx.

## Logging

The service uses structured logging with the `tracing` library:

```bash
# Set logging level
export RUST_LOG=info
cargo run
```

## Monitoring

The service exports metrics in Prometheus format for monitoring:
- Number of processed messages
- Processing time
- Batch sizes
- Processing errors

## Development

### Adding New Features

1. Create a new branch:
```bash
git checkout -b feature/new-feature
```

2. Make changes and add tests
3. Run tests:
```bash
cargo test
```

4. Check formatting:
```bash
cargo fmt
```

5. Check linter:
```bash
cargo clippy
```

### Testing

```bash
# Run all tests
cargo test

# Run tests with coverage
cargo test -- --nocapture

# Integration tests
cargo test --test integration
```

## Performance

The service is optimized for high performance:
- Asynchronous message processing
- Batch data processing
- Connection pooling for database
- Efficient indexes in PostgreSQL

## Security

- Runs as non-privileged user in Docker
- Input data validation
- Error handling without information leakage
- Use of secure dependencies

## Troubleshooting

### Common Issues

1. **RabbitMQ connection error**:
   - Check RabbitMQ server availability
   - Verify connection string and credentials

2. **PostgreSQL connection error**:
   - Check connection string
   - Ensure database availability

3. **High memory usage**:
   - Reduce batch size in configuration
   - Check connection pool settings

### Logs

For diagnostics, use logs:
```bash
docker logs data-processor
```

## License

MIT License

## Container Debugging

### Container Won't Start

If the container fails to start, try these debugging steps:

1. **Check container logs**:
```bash
docker logs data-processor
```

2. **Build debug version**:
```bash
docker build -f Dockerfile.debug -t data-processor-service-debug ./data-processor-service
docker run --rm -it data-processor-service-debug
```

3. **Test container locally**:
```bash
chmod +x test-container.sh
./test-container.sh
```

4. **Common issues**:
   - **Database connection**: Ensure PostgreSQL is running and accessible
   - **RabbitMQ connection**: Ensure RabbitMQ is running and accessible
   - **Missing dependencies**: Check that all runtime dependencies are installed
   - **Permission issues**: Verify file ownership and permissions
   - **RabbitMQ exchange/queue missing**: The exchange and queue must be created in RabbitMQ

#### RabbitMQ Exchange and Queue Setup

If you see RabbitMQ connection errors, ensure the exchange and queue are properly configured:

1. **Automatic setup** (recommended):
```bash
# The docker-compose.yaml should include RabbitMQ with management plugin
docker-compose up rabbitmq
```

2. **Manual setup via RabbitMQ Management UI**:
   - Access RabbitMQ Management UI at http://localhost:15672
   - Login with guest/guest
   - Create exchange: `meter-data-exchange` (type: topic, durable: true)
   - Create queue: `meter-data-queue` (durable: true)
   - Bind queue to exchange with routing key: `meter.data`

3. **Manual setup via CLI**:
```bash
# Create exchange
docker exec rabbitmq rabbitmqctl eval 'rabbit_exchange:declare({resource, <<"/">>, exchange, <<"meter-data-exchange">>}, topic, true, false, false, []).'

# Create queue
docker exec rabbitmq rabbitmqctl eval 'rabbit_amqqueue:declare({resource, <<"/">>, queue, <<"meter-data-queue">>}, true, false, [], none).'

# Bind queue to exchange
docker exec rabbitmq rabbitmqctl eval 'rabbit_binding:add({binding, {resource, <<"/">>, exchange, <<"meter-data-exchange">>}, {resource, <<"/">>, queue, <<"meter-data-queue">>}, <<"meter.data">>, []}).'
```

### Debug Mode

For detailed debugging, use the debug Dockerfile:
```bash
docker build -f Dockerfile.debug -t data-processor-service-debug .
docker run --rm -it data-processor-service-debug
```

This will show system calls and help identify connection issues.
