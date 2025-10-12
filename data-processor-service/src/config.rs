use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub rabbitmq: RabbitMQConfig,
    pub database: DatabaseConfig,
    pub processing: ProcessingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RabbitMQConfig {
    pub connection_string: String,
    pub exchange_name: String,
    pub queue_name: String,
    pub routing_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub acquire_timeout_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingConfig {
    pub batch_size: usize,
    pub processing_interval_ms: u64,
    pub retry_attempts: u32,
    pub retry_delay_ms: u64,
}

impl Config {
    pub fn load(path: &str) -> Result<Self> {
        let content = fs::read_to_string(path)?;
        let config: Config = serde_yaml::from_str(&content)?;
        Ok(config)
    }
    
    pub fn default() -> Self {
        Self {
            rabbitmq: RabbitMQConfig {
                connection_string: "amqp://guest:guest@localhost:5672/%2f".to_string(),
                exchange_name: "meter-data-exchange".to_string(),
                queue_name: "meter-data-queue".to_string(),
                routing_key: "meter.data".to_string(),
            },
            database: DatabaseConfig {
                url: "postgres://postgres:postgres@localhost:5432/microservices_db".to_string(),
                max_connections: 10,
                min_connections: 1,
                acquire_timeout_seconds: 30,
            },
            processing: ProcessingConfig {
                batch_size: 100,
                processing_interval_ms: 1000,
                retry_attempts: 3,
                retry_delay_ms: 1000,
            },
        }
    }
}
