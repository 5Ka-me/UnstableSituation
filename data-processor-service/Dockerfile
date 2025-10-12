# Use the official Rust image as the base image
FROM rust:1.90-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the Cargo.toml and Cargo.lock files (if they exist)
COPY Cargo.toml ./
COPY Cargo.lock* ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Generate Cargo.lock and build dependencies (this layer will be cached)
RUN cargo generate-lockfile && cargo build --release

# Remove the dummy main.rs
RUN rm src/main.rs

# Copy the source code
COPY src ./src
COPY migrations ./migrations

# Build the application
RUN cargo build --release

# Use a minimal runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -r -s /bin/false appuser

# Set the working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/data_processor_service /app/

# Copy configuration file
COPY config.yaml /app/

# Change ownership to the appuser
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Run the application
CMD ["./data_processor_service", "--config", "config.yaml"]
