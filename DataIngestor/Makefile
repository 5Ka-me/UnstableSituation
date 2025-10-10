.PHONY: build test run clean docker-build docker-run docker-stop

# Build the application
build:
	go build -o bin/data-ingestor ./cmd/data-ingestor

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Run the application locally
run:
	go run ./cmd/data-ingestor

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Build Docker image
docker-build:
	docker build -t data-ingestor:latest .

# Run with docker-compose
docker-run:
	docker-compose up --build

# Stop docker-compose
docker-stop:
	docker-compose down

# Run tests in Docker
docker-test:
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Install dependencies
deps:
	go mod download
	go mod tidy

# Generate mocks (if using mockgen)
mocks:
	mockgen -source=internal/interfaces.go -destination=internal/mocks/mock_interfaces.go


