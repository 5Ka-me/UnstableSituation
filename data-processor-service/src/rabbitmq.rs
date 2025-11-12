use anyhow::Result;
use lapin::{
    options::*, publisher_confirm::Confirmation, types::FieldTable, Connection,
    ConnectionProperties, Consumer, ExchangeKind, BasicProperties,
};
use futures_lite::stream::StreamExt;
use std::time::Duration;
use tokio::time::timeout;
use tracing::{debug, error, info};
use crate::models::SensorData;

pub struct RabbitMQConsumer {
    connection: Connection,
    consumer: Consumer,
    queue_name: String,
}

impl RabbitMQConsumer {
    pub async fn new(
        connection_string: &str,
        queue_name: String,
        exchange_name: String,
        routing_key: String,
    ) -> Result<Self> {
        info!("Connecting to RabbitMQ at: {}", connection_string);
        
        let connection = Connection::connect(connection_string, ConnectionProperties::default()).await?;
        let channel = connection.create_channel().await?;
        
        // Declare exchange
        channel
            .exchange_declare(
                &exchange_name,
                ExchangeKind::Topic,
                ExchangeDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                FieldTable::default(),
            )
            .await?;
        
        let _queue = channel
            .queue_declare(
                &queue_name,
                QueueDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                FieldTable::default(),
            )
            .await?;
        
        channel
            .queue_bind(
                &queue_name,
                &exchange_name,
                &routing_key,
                QueueBindOptions::default(),
                FieldTable::default(),
            )
            .await?;
        
        let consumer = channel
            .basic_consume(
                &queue_name,
                "data-processor",
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await?;
        
        Ok(Self {
            connection,
            consumer,
            queue_name,
        })
    }
    
    pub async fn consume_messages<F, Fut>(&mut self, mut handler: F) -> Result<()>
    where
        F: FnMut(Vec<SensorData>) -> Fut,
        Fut: std::future::Future<Output = Result<()>>,
    {
        loop {
            match timeout(Duration::from_millis(1000), self.consumer.next()).await {
                Ok(Some(delivery)) => {
                    let delivery = delivery?;
                    
                    match serde_json::from_slice::<Vec<SensorData>>(&delivery.data) {
                        Ok(sensor_data) => {
                            debug!("Received sensor data: {:?}", sensor_data);
                            
                            if let Err(e) = handler(sensor_data).await {
                                error!("Failed to process sensor data: {}", e);
                            }
                            
                            if let Err(e) = delivery.ack(BasicAckOptions::default()).await {
                                error!("Failed to acknowledge message: {}", e);
                            }
                        }
                        Err(e) => {
                            error!("Failed to deserialize sensor data: {}", e);
                            
                            if let Err(e) = delivery.reject(BasicRejectOptions::default()).await {
                                error!("Failed to reject message: {}", e);
                            }
                        }
                    }
                }
                Ok(None) => {
                    continue;
                }
                Err(_) => {
                    continue;
                }
            }
        }
    }
}

pub struct RabbitMQProducer {
    connection: Connection,
    channel: lapin::Channel,
    exchange_name: String,
}

impl RabbitMQProducer {
    pub async fn new(connection_string: &str, exchange_name: String) -> Result<Self> {
        info!("Connecting to RabbitMQ at: {}", connection_string);
        
        let connection = Connection::connect(connection_string, ConnectionProperties::default()).await?;
        let channel = connection.create_channel().await?;
        
        // Declare exchange
        channel
            .exchange_declare(
                &exchange_name,
                ExchangeKind::Topic,
                ExchangeDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                FieldTable::default(),
            )
            .await?;
        
        Ok(Self {
            connection,
            channel,
            exchange_name,
        })
    }
    
    pub async fn send_sensor_data(&self, routing_key: &str, sensor_data: &[SensorData]) -> Result<()> {
        let payload = serde_json::to_vec(sensor_data)?;
        
        let confirm = self
            .channel
            .basic_publish(
                &self.exchange_name,
                routing_key,
                BasicPublishOptions::default(),
                &payload,
                BasicProperties::default(),
            )
            .await?
            .await?;
        
        match confirm {
            Confirmation::Ack(_) => {
                debug!("Sensor data sent successfully to exchange: {} with routing key: {}", self.exchange_name, routing_key);
                Ok(())
            }
            Confirmation::Nack(_) => {
                error!("Sensor data was not acknowledged by RabbitMQ");
                Err(anyhow::anyhow!("Sensor data was not acknowledged"))
            }
            Confirmation::NotRequested => {
                debug!("Sensor data sent successfully to exchange: {} with routing key: {} (no confirmation requested)", self.exchange_name, routing_key);
                Ok(())
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_sensor_data_serialization_for_rabbitmq() {
        let sensor_data = vec![
            SensorData {
                r#type: "energy".to_string(),
                name: "Sensor1".to_string(),
                payload: json!({"value": 100.5}),
            },
            SensorData {
                r#type: "air_quality".to_string(),
                name: "Sensor2".to_string(),
                payload: json!({"co2": 450, "pm25": 25}),
            },
        ];
        
        let json = serde_json::to_vec(&sensor_data).unwrap();
        let deserialized: Vec<SensorData> = serde_json::from_slice(&json).unwrap();
        
        assert_eq!(deserialized.len(), 2);
        assert_eq!(deserialized[0].r#type, "energy");
        assert_eq!(deserialized[1].r#type, "air_quality");
    }

    #[test]
    fn test_sensor_data_deserialization() {
        let json_data = r#"[{"type":"energy","name":"Sensor1","payload":{"value":100.5}}]"#;
        let sensor_data: Vec<SensorData> = serde_json::from_str(json_data).unwrap();
        
        assert_eq!(sensor_data.len(), 1);
        assert_eq!(sensor_data[0].r#type, "energy");
        assert_eq!(sensor_data[0].name, "Sensor1");
    }

    #[test]
    fn test_sensor_data_with_different_payloads() {
        let energy_data = SensorData {
            r#type: "energy".to_string(),
            name: "EnergySensor".to_string(),
            payload: json!({"energy": 150.0}),
        };
        
        let air_quality_data = SensorData {
            r#type: "air_quality".to_string(),
            name: "AirQualitySensor".to_string(),
            payload: json!({"co2": 450, "pm25": 25, "humidity": 60}),
        };
        
        let motion_data = SensorData {
            r#type: "motion".to_string(),
            name: "MotionSensor".to_string(),
            payload: json!({"motion_detected": true}),
        };
        
        assert_eq!(energy_data.r#type, "energy");
        assert_eq!(air_quality_data.r#type, "air_quality");
        assert_eq!(motion_data.r#type, "motion");
    }

    #[test]
    fn test_sensor_data_batch_serialization() {
        let batch: Vec<SensorData> = (0..5)
            .map(|i| SensorData {
                r#type: "energy".to_string(),
                name: format!("Sensor{}", i),
                payload: json!({"value": i as f64 * 10.0}),
            })
            .collect();
        
        let json = serde_json::to_vec(&batch).unwrap();
        let deserialized: Vec<SensorData> = serde_json::from_slice(&json).unwrap();
        
        assert_eq!(deserialized.len(), 5);
        for (i, data) in deserialized.iter().enumerate() {
            assert_eq!(data.name, format!("Sensor{}", i));
        }
    }

    // Note: Integration tests for RabbitMQConsumer and RabbitMQProducer would require
    // a real RabbitMQ connection. These are unit tests that verify serialization/deserialization
}