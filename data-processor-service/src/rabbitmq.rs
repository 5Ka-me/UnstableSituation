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
        
        // Declare queue
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
        
        // Bind queue to exchange
        channel
            .queue_bind(
                &queue_name,
                &exchange_name,
                &routing_key,
                QueueBindOptions::default(),
                FieldTable::default(),
            )
            .await?;
        
        // Create consumer
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
                            
                            // Process sensor data
                            if let Err(e) = handler(sensor_data).await {
                                error!("Failed to process sensor data: {}", e);
                            }
                            
                            // Acknowledge message
                            if let Err(e) = delivery.ack(BasicAckOptions::default()).await {
                                error!("Failed to acknowledge message: {}", e);
                            }
                        }
                        Err(e) => {
                            error!("Failed to deserialize sensor data: {}", e);
                            
                            // Reject message
                            if let Err(e) = delivery.reject(BasicRejectOptions::default()).await {
                                error!("Failed to reject message: {}", e);
                            }
                        }
                    }
                }
                Ok(None) => {
                    // No message received, continue
                    continue;
                }
                Err(_) => {
                    // Timeout, continue polling
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
