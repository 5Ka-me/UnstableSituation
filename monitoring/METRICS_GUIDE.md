# Metrics Usage Guide

## Overview

The project implements a monitoring system based on **OpenTelemetry**, **Prometheus**, and **Grafana**. All services export metrics in Prometheus format, which are collected and visualized.

## Monitoring Architecture

```
[Services] → [Prometheus Metrics Endpoints] → [Prometheus] → [Grafana]
```

### Components

1. **OpenTelemetry** - instrumentation for .NET services
2. **Prometheus** - metrics collection and storage
3. **Grafana** - visualization and dashboards

## Starting the Monitoring System

### 1. Starting All Services with Monitoring

```bash
docker-compose up --build
```

This will start:
- All microservices
- Prometheus on port `9090`
- Grafana on port `3004`

### 2. Checking Availability

- **Prometheus UI**: http://localhost:9090
- **Grafana UI**: http://localhost:3004
  - Login: `admin`
  - Password: `admin`

## Metrics by Service

### Data Ingestor (.NET)

**Metrics Endpoint**: `http://data-ingestor:8080/metrics`

**Available Metrics**:
- `dataingestor_data_fetched_total` - total number of fetched data items
- `dataingestor_data_published_total` - total number of published data items
- `dataingestor_api_requests_total` - total number of API requests
- `dataingestor_api_errors_total` - total number of API errors
- `dataingestor_api_request_duration_seconds` - API request duration
- `dataingestor_rabbitmq_publish_total` - total number of messages published to RabbitMQ
- `dataingestor_rabbitmq_errors_total` - total number of RabbitMQ errors
- `dataingestor_rabbitmq_publish_duration_seconds` - RabbitMQ publish duration

### Data Processor (Rust)

**Metrics Endpoint**: `http://data-processor:3002/metrics`

**Available Metrics**:
- `dataprocessor_messages_processed_total` - total number of processed messages
- `dataprocessor_messages_failed_total` - total number of failed messages
- `dataprocessor_processing_duration_seconds` - processing duration
- `dataprocessor_database_insert_duration_seconds` - database insert duration
- `dataprocessor_rabbitmq_consume_duration_seconds` - RabbitMQ consumption duration

### GraphQL Gateway (.NET)

**Metrics Endpoint**: `http://graphql-gateway:8080/metrics`

**Available Metrics**:
- `graphqlgateway_queries_total` - total number of GraphQL queries
- `graphqlgateway_errors_total` - total number of GraphQL errors
- `graphqlgateway_query_duration_seconds` - GraphQL query duration
- `graphqlgateway_database_queries_total` - total number of database queries
- `graphqlgateway_database_query_duration_seconds` - database query duration
- `graphqlgateway_signalr_notifications_total` - total number of SignalR notifications

### Notification Service (Node.js)

**Metrics Endpoint**: `http://notification-service:3001/metrics`

**Available Metrics**:
- `notificationservice_messages_processed_total` - total number of processed messages
- `notificationservice_notifications_sent_total` - total number of sent notifications (with `type` label)
- `notificationservice_notifications_failed_total` - total number of failed notifications (with `type` label)
- `notificationservice_rabbitmq_messages_consumed_total` - total number of messages consumed from RabbitMQ
- `notificationservice_processing_duration_seconds` - notification processing duration
- `notificationservice_signalr_send_duration_seconds` - SignalR send duration

## Using Prometheus

### Viewing Metrics

1. Open Prometheus UI: http://localhost:9090
2. Navigate to the **Graph** section
3. Enter a PromQL query, for example:
   ```promql
   rate(dataingestor_api_requests_total[1m])
   ```

### PromQL Query Examples

#### API Request Rate (Data Ingestor)
```promql
rate(dataingestor_api_requests_count_total[1m])
```
**Note:** OpenTelemetry adds the `_count_total` suffix to counters. Alternative - standard HTTP metrics:
```promql
rate(http_server_request_duration_seconds_count{job="data-ingestor"}[1m])
```

#### Error Percentage (Data Ingestor)
```promql
rate(dataingestor_api_errors_count_total[1m]) / rate(dataingestor_api_requests_count_total[1m]) * 100
```
**Alternative:**
```promql
rate(http_server_request_duration_seconds_count{job="data-ingestor",code=~"5.."}[1m]) / rate(http_server_request_duration_seconds_count{job="data-ingestor"}[1m]) * 100
```

#### 95th Percentile Request Duration (Data Ingestor)
```promql
histogram_quantile(0.95, sum(rate(dataingestor_api_request_duration_seconds_bucket[5m])) by (le))
```
**Alternative:**
```promql
histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket{job="data-ingestor"}[5m])) by (le))
```

#### Messages Processed Per Second (Data Processor)
```promql
rate(dataprocessor_messages_processed_total[1m])
```

#### Notifications by Type (Notification Service)
```promql
sum by (type) (rate(notificationservice_notifications_sent_total[1m]))
```
**Note:** If the metric with the `type` label doesn't work, use:
```promql
rate(notificationservice_notifications_sent_total[1m])
```

#### Service Status
```promql
up{job=~"data-ingestor|data-processor|graphql-gateway|notification-service"}
```

#### Total HTTP Requests
```promql
sum(rate(http_server_request_duration_seconds_count[1m])) by (job)
```

### Checking Targets

1. In Prometheus UI, navigate to **Status** → **Targets**
2. Ensure all services show **UP** status

## Using Grafana

### First Login

1. Open Grafana: http://localhost:3004
2. Login with credentials:
   - Username: `admin`
   - Password: `admin`
3. On first login, you will be prompted to change the password

### Viewing Dashboards

1. In the side menu, click the **Dashboards** icon (four squares)
2. You will see a list of dashboards, including **Microservices Overview**
3. If the dashboard is not displayed, restart Grafana:
   ```bash
   docker-compose restart grafana
   ```

### Creating Custom Dashboards

1. Click **+** → **Create Dashboard**
2. Add a Panel
3. Select **Prometheus** as the data source
4. Enter a PromQL query
5. Configure visualization

### Panel Examples

#### Request Rate Graph
- **Query**: `rate(dataingestor_api_requests_total[1m])`
- **Visualization**: Time series

#### Service Status
- **Query**: `up{job=~"data-ingestor|data-processor|graphql-gateway|notification-service"}`
- **Visualization**: Stat

#### Top Errors
- **Query**: `topk(5, rate(dataingestor_api_errors_total[5m]))`
- **Visualization**: Bar gauge

## Real-time Monitoring

### Checking Metrics via curl

```bash
# Data Ingestor
curl http://localhost:8080/metrics

# Data Processor
curl http://localhost:3002/metrics

# GraphQL Gateway
curl http://localhost:5284/metrics

# Notification Service
curl http://localhost:3001/metrics
```

### Checking via Browser

Open in browser:
- http://localhost:8080/metrics (Data Ingestor)
- http://localhost:3002/metrics (Data Processor)
- http://localhost:5284/metrics (GraphQL Gateway)
- http://localhost:3001/metrics (Notification Service)

## Setting Up Alerts (Optional)

### Creating Alert Rules in Prometheus

Create file `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: microservices_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(dataingestor_api_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
      
      - alert: ServiceDown
        expr: up{job=~"data-ingestor|data-processor|graphql-gateway|notification-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
```

Then update `prometheus.yml`:
```yaml
rule_files:
  - "alerts.yml"
```

## Troubleshooting

### Metrics Not Being Collected

1. Check that services are running:
   ```bash
   docker-compose ps
   ```

2. Check Prometheus logs:
   ```bash
   docker-compose logs prometheus
   ```

3. Check targets in Prometheus UI (Status → Targets)

4. Ensure metrics ports are accessible:
   ```bash
   curl http://localhost:8080/metrics
   ```

### Grafana Not Connecting to Prometheus

1. Check datasource settings in Grafana
2. Ensure Prometheus is accessible at `http://prometheus:9090` from the Grafana container
3. Check Grafana logs:
   ```bash
   docker-compose logs grafana
   ```

### Metrics Not Displaying

1. Ensure metrics are being exported (check `/metrics` endpoints)
2. Check that Prometheus is collecting metrics (Status → Targets)
3. Verify PromQL query correctness
4. Ensure the correct time range is selected in Grafana
5. If a metric is not found, use alternative queries from the "PromQL Query Examples" section

### Dashboard Not Displaying

1. Check Grafana logs:
   ```bash
   docker-compose logs grafana | grep -i dashboard
   ```
2. Ensure the dashboard file exists: `monitoring/grafana/dashboards/microservices-overview.json`
3. Check dashboard file permissions
4. Restart Grafana:
   ```bash
   docker-compose restart grafana
   ```
5. In Grafana UI, navigate to **Configuration** → **Data Sources** and ensure Prometheus is connected
6. If the dashboard is still not visible, create it manually through the UI by copying queries from the dashboard file

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry .NET](https://opentelemetry.io/docs/instrumentation/net/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## Contacts and Support

If you encounter monitoring issues, check:
1. Service logs: `docker-compose logs <service-name>`
2. Prometheus logs: `docker-compose logs prometheus`
3. Grafana logs: `docker-compose logs grafana`
