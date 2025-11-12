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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_config_default() {
        let config = Config::default();
        
        assert_eq!(config.rabbitmq.exchange_name, "meter-data-exchange");
        assert_eq!(config.rabbitmq.queue_name, "meter-data-queue");
        assert_eq!(config.rabbitmq.routing_key, "meter.data");
        assert_eq!(config.database.max_connections, 10);
        assert_eq!(config.database.min_connections, 1);
        assert_eq!(config.processing.batch_size, 100);
        assert_eq!(config.processing.retry_attempts, 3);
    }

    #[test]
    fn test_config_load() {
        let mut temp_file = NamedTempFile::new().unwrap();
        let yaml_content = r#"
rabbitmq:
  connection_string: "amqp://guest:guest@localhost:5672/%2f"
  exchange_name: "test-exchange"
  queue_name: "test-queue"
  routing_key: "test.key"
database:
  url: "postgres://postgres:postgres@localhost:5432/test_db"
  max_connections: 20
  min_connections: 2
  acquire_timeout_seconds: 60
processing:
  batch_size: 200
  processing_interval_ms: 2000
  retry_attempts: 5
  retry_delay_ms: 2000
"#;
        temp_file.write_all(yaml_content.as_bytes()).unwrap();
        temp_file.flush().unwrap();
        
        let config = Config::load(temp_file.path().to_str().unwrap()).unwrap();
        
        assert_eq!(config.rabbitmq.exchange_name, "test-exchange");
        assert_eq!(config.rabbitmq.queue_name, "test-queue");
        assert_eq!(config.rabbitmq.routing_key, "test.key");
        assert_eq!(config.database.max_connections, 20);
        assert_eq!(config.database.min_connections, 2);
        assert_eq!(config.processing.batch_size, 200);
        assert_eq!(config.processing.retry_attempts, 5);
    }

    #[test]
    fn test_config_load_invalid_path() {
        let result = Config::load("nonexistent_file.yaml");
        assert!(result.is_err());
    }

    #[test]
    fn test_rabbitmq_config() {
        let config = RabbitMQConfig {
            connection_string: "amqp://test:test@localhost:5672/%2f".to_string(),
            exchange_name: "test-exchange".to_string(),
            queue_name: "test-queue".to_string(),
            routing_key: "test.key".to_string(),
        };
        
        assert_eq!(config.connection_string, "amqp://test:test@localhost:5672/%2f");
        assert_eq!(config.exchange_name, "test-exchange");
        assert_eq!(config.queue_name, "test-queue");
        assert_eq!(config.routing_key, "test.key");
    }

    #[test]
    fn test_database_config() {
        let config = DatabaseConfig {
            url: "postgres://user:pass@localhost:5432/db".to_string(),
            max_connections: 15,
            min_connections: 3,
            acquire_timeout_seconds: 45,
        };
        
        assert_eq!(config.url, "postgres://user:pass@localhost:5432/db");
        assert_eq!(config.max_connections, 15);
        assert_eq!(config.min_connections, 3);
        assert_eq!(config.acquire_timeout_seconds, 45);
    }

    #[test]
    fn test_processing_config() {
        let config = ProcessingConfig {
            batch_size: 150,
            processing_interval_ms: 1500,
            retry_attempts: 4,
            retry_delay_ms: 1500,
        };
        
        assert_eq!(config.batch_size, 150);
        assert_eq!(config.processing_interval_ms, 1500);
        assert_eq!(config.retry_attempts, 4);
        assert_eq!(config.retry_delay_ms, 1500);
    }
}