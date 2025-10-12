-- Migration: Create sensor_data table
-- Description: Creates the main table for storing sensor data from RabbitMQ

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_type VARCHAR(100) NOT NULL,
    sensor_name VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type ON sensor_readings(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_name ON sensor_readings(sensor_name);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at ON sensor_readings(created_at);

-- Create composite index for type and name queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type_name ON sensor_readings(sensor_type, sensor_name);

-- Create index for JSONB payload queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_payload ON sensor_readings USING GIN (payload);

-- Create table for processing statistics
CREATE TABLE IF NOT EXISTS processing_stats (
    id SERIAL PRIMARY KEY,
    processed_messages BIGINT NOT NULL DEFAULT 0,
    failed_messages BIGINT NOT NULL DEFAULT 0,
    last_processed_at TIMESTAMPTZ,
    processing_rate_per_second DECIMAL(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
