# Microservices Architecture Project

## 🏗️ Project Structure

```
├── data-ingestor-service/     # Node.js service - fetches data from unstable API
├── data-processor-service/    # Go service - processes Kafka messages
├── graphql-api-gateway/       # .NET service - GraphQL API with filtering/pagination
├── notification-service/       # Rust service - SignalR/WebSockets notifications
├── frontend/                  # React app - dashboards and visualizations
├── monitoring/                # Prometheus + Grafana configuration
├── WeakApp/                   # Unstable external API (provided)
└── docker-compose.yaml       # Complete infrastructure setup
```

## 🚀 Architecture Overview

```
[Unstable API] → [Data Ingestor] → [Kafka] → [Data Processor] → [PostgreSQL]
                                                                    ↓
[Frontend] ← [GraphQL Gateway] ← [PostgreSQL] ← [Notification Service] ← [Kafka]
```

## 📋 Development Plan

### Phase 1: Infrastructure Setup ✅
- [x] Create project structure
- [x] Configure docker-compose with all services
- [x] Setup Kafka message queue
- [x] Setup PostgreSQL database
- [x] Setup monitoring stack (Prometheus + Grafana)

### Phase 2: Core Services Development
- [ ] **Data Ingestor Service (Node.js)**
  - Fetch data from unstable API (port 8081)
  - Implement retry logic with exponential backoff
  - Push data to Kafka topics
  - Add health checks and metrics

- [ ] **Data Processor Service (Go)**
  - Consume messages from Kafka
  - Validate and transform data
  - Persist to PostgreSQL
  - Implement error handling and dead letter queue

- [ ] **GraphQL API Gateway (.NET)**
  - Define GraphQL schema with strongly-typed models
  - Implement filtering, pagination, aggregations
  - Add Entity Framework Core with PostgreSQL
  - Implement caching and performance optimization

- [ ] **Notification Service (Rust)**
  - WebSocket server for real-time updates
  - Consume Kafka events for notifications
  - Implement connection management
  - Add authentication and authorization

### Phase 3: Frontend Development
- [ ] **React Frontend**
  - Setup with Apollo Client for GraphQL
  - Create dashboard components
  - Implement real-time charts (Chart.js/Recharts)
  - Add WebSocket connection for notifications
  - Implement responsive design
  - Add error handling and loading states

### Phase 4: DevOps & CI/CD
- [ ] **GitHub Actions Pipelines**
  - Unit tests, build, and linting for each service
  - Docker image building and pushing
  - Integration tests
  - End-to-end tests with Playwright

- [ ] **Git Workflow**
  - Branch strategy (main + feature/*)
  - Pull request requirements
  - Code review process

### Phase 5: Advanced Features
- [ ] **Monitoring & Observability**
  - OpenTelemetry integration
  - Custom metrics and dashboards
  - Alerting rules
  - Log aggregation

- [ ] **Security & Performance**
  - Authentication and authorization
  - Rate limiting
  - Caching strategies
  - Database optimization

## 🛠️ Technology Stack

### Backend Services
- **Data Ingestor**: Node.js + Express + KafkaJS
- **Data Processor**: Go + Gin + Kafka + GORM
- **GraphQL Gateway**: .NET 8 + HotChocolate + Entity Framework Core
- **Notification Service**: Rust + Tokio + WebSockets

### Frontend
- **React** + TypeScript + Apollo Client + Material-UI

### Infrastructure
- **Message Queue**: Apache Kafka
- **Database**: PostgreSQL
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker + Docker Compose

### DevOps
- **CI/CD**: GitHub Actions
- **Testing**: Jest, Go testing, xUnit, Playwright
- **Code Quality**: ESLint, Go fmt, StyleCop

## 🚦 Getting Started

1. **Start the infrastructure**:
   ```bash
   docker-compose up -d postgres kafka zookeeper prometheus grafana
   ```

2. **Develop services incrementally**:
   - Start with Data Ingestor service
   - Add Data Processor service
   - Implement GraphQL Gateway
   - Build Notification Service
   - Create React Frontend

3. **Run the complete stack**:
   ```bash
   docker-compose up --build
   ```

## 📊 API Endpoints

- **Unstable API**: http://localhost:8081
- **GraphQL Gateway**: http://localhost:5000/graphql
- **Frontend**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## 🎯 Success Criteria

- [ ] All services communicate through Kafka
- [ ] GraphQL API supports filtering, pagination, aggregations
- [ ] Frontend displays real-time data with charts
- [ ] WebSocket notifications work correctly
- [ ] All services have comprehensive tests
- [ ] CI/CD pipelines are working
- [ ] Monitoring and alerting are configured
- [ ] System handles unstable API gracefully

## 🔧 Development Notes

- The unstable API is deployed on port 8081 and frequently throws errors
- Implement robust error handling and retry mechanisms
- Use circuit breaker patterns for external API calls
- Monitor system performance and implement caching where needed
- Follow microservices best practices for service communication
