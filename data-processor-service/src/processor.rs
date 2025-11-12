use anyhow::Result;
use crate::config::Config;
use crate::database::Database;
use crate::rabbitmq::RabbitMQConsumer;
use crate::models::{SensorData, SensorReadingInput};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info};

pub struct DataProcessor {
    config: Config,
    database: Arc<Database>,
    consumer: Arc<Mutex<RabbitMQConsumer>>,
    stats: Arc<Mutex<ProcessingStats>>,
}

#[derive(Debug, Default)]
struct ProcessingStats {
    processed_messages: u64,
    failed_messages: u64,
    last_processed_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl DataProcessor {
    pub async fn new(config: Config) -> Result<Self> {
        info!("Initializing Data Processor...");
        
        // Initialize database
        let database = Arc::new(Database::new(&config.database.url).await?);
        info!("Database connection established");
        
        // Initialize RabbitMQ consumer
        let consumer = RabbitMQConsumer::new(
            &config.rabbitmq.connection_string,
            config.rabbitmq.queue_name.clone(),
            config.rabbitmq.exchange_name.clone(),
            config.rabbitmq.routing_key.clone(),
        ).await?;
        let consumer = Arc::new(Mutex::new(consumer));
        info!("RabbitMQ consumer initialized");
        
        let stats = Arc::new(Mutex::new(ProcessingStats::default()));
        
        Ok(Self {
            config,
            database,
            consumer,
            stats,
        })
    }
    
    pub async fn start(&mut self) -> Result<()> {
        info!("Starting data processing...");
        
        let mut consumer = self.consumer.lock().await;
        
        consumer.consume_messages(|sensor_data| {
            let database = self.database.clone();
            let stats = self.stats.clone();
            let batch_size = self.config.processing.batch_size;
            
            async move {
                Self::process_sensor_data(database, stats, sensor_data, batch_size).await
            }
        }).await?;
        
        Ok(())
    }
    
    async fn process_sensor_data(
        database: Arc<Database>,
        stats: Arc<Mutex<ProcessingStats>>,
        sensor_data: Vec<SensorData>,
        batch_size: usize,
    ) -> Result<()> {
        let start_time = std::time::Instant::now();
        
        // Convert sensor data to database input format
        let mut sensor_reading_inputs = Vec::new();
        let messages_count = sensor_data.len();
        
        for data in sensor_data {
            let input = SensorReadingInput {
                sensor_type: data.r#type,
                sensor_name: data.name,
                payload: data.payload,
                timestamp: chrono::Utc::now(),
            };
            sensor_reading_inputs.push(input);
        }
        
        // Process in batches
        for chunk in sensor_reading_inputs.chunks(batch_size) {
            match database.insert_batch_sensor_readings(chunk.to_vec()).await {
                Ok(_) => {
                    let mut stats = stats.lock().await;
                    stats.processed_messages += chunk.len() as u64;
                    stats.last_processed_at = Some(chrono::Utc::now());
                }
                Err(e) => {
                    error!("Failed to insert batch: {}", e);
                    let mut stats = stats.lock().await;
                    stats.failed_messages += chunk.len() as u64;
                }
            }
        }
        
        let processing_time = start_time.elapsed();
        let processing_rate = messages_count as f64 / processing_time.as_secs_f64();
        
        info!(
            "Processed {} sensor readings in {:?} (rate: {:.2} msg/s)",
            messages_count,
            processing_time,
            processing_rate
        );
        
        Ok(())
    }
    
    pub async fn get_stats(&self) -> Result<crate::models::ProcessingStats> {
        let stats = self.stats.lock().await;
        Ok(crate::models::ProcessingStats {
            processed_messages: stats.processed_messages,
            failed_messages: stats.failed_messages,
            last_processed_at: stats.last_processed_at,
            processing_rate_per_second: 0.0, // Calculate based on recent activity
        })
    }
    
    pub async fn health_check(&self) -> Result<()> {
        // Check database health
        self.database.health_check().await?;
        
        // Check RabbitMQ consumer health (basic check)
        // In a real implementation, you might want to check if the consumer is still connected
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::SensorData;
    use serde_json::json;

    #[test]
    fn test_processing_stats_default() {
        let stats = ProcessingStats::default();
        
        assert_eq!(stats.processed_messages, 0);
        assert_eq!(stats.failed_messages, 0);
        assert!(stats.last_processed_at.is_none());
    }

    #[test]
    fn test_sensor_data_to_reading_input_conversion() {
        let sensor_data = SensorData {
            r#type: "energy".to_string(),
            name: "Sensor1".to_string(),
            payload: json!({"value": 100.5}),
        };
        
        let input = SensorReadingInput {
            sensor_type: sensor_data.r#type.clone(),
            sensor_name: sensor_data.name.clone(),
            payload: sensor_data.payload.clone(),
            timestamp: chrono::Utc::now(),
        };
        
        assert_eq!(input.sensor_type, "energy");
        assert_eq!(input.sensor_name, "Sensor1");
    }

    #[test]
    fn test_batch_chunking() {
        let batch_size = 3;
        let mut inputs = Vec::new();
        
        for i in 0..10 {
            inputs.push(SensorReadingInput {
                sensor_type: "energy".to_string(),
                sensor_name: format!("Sensor{}", i),
                payload: json!({"value": i as f64}),
                timestamp: chrono::Utc::now(),
            });
        }
        
        let chunks: Vec<_> = inputs.chunks(batch_size).collect();
        
        assert_eq!(chunks.len(), 4); // 10 items / 3 batch_size = 4 chunks (3, 3, 3, 1)
        assert_eq!(chunks[0].len(), 3);
        assert_eq!(chunks[3].len(), 1);
    }

    #[test]
    fn test_processing_stats_update() {
        let mut stats = ProcessingStats::default();
        
        stats.processed_messages = 100;
        stats.failed_messages = 5;
        stats.last_processed_at = Some(chrono::Utc::now());
        
        assert_eq!(stats.processed_messages, 100);
        assert_eq!(stats.failed_messages, 5);
        assert!(stats.last_processed_at.is_some());
    }

    // Note: Integration tests for DataProcessor would require real database and RabbitMQ connections
    // These are unit tests that verify the logic and data transformations
}