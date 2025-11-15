use prometheus::{Counter, Histogram, Registry, Encoder, TextEncoder};
use std::sync::Arc;

pub struct Metrics {
    pub messages_processed: Counter,
    pub messages_failed: Counter,
    pub processing_duration: Histogram,
    pub database_insert_duration: Histogram,
    pub rabbitmq_consume_duration: Histogram,
    registry: Arc<Registry>,
}

impl Metrics {
    pub fn new() -> Self {
        let registry = Registry::new();
        
        let messages_processed = Counter::with_opts(
            prometheus::opts!(
                "dataprocessor_messages_processed_total",
                "Total number of messages processed"
            )
        ).unwrap();
        
        let messages_failed = Counter::with_opts(
            prometheus::opts!(
                "dataprocessor_messages_failed_total",
                "Total number of messages that failed to process"
            )
        ).unwrap();
        
        let processing_duration = Histogram::with_opts(
            prometheus::histogram_opts!(
                "dataprocessor_processing_duration_seconds",
                "Duration of message processing in seconds"
            )
        ).unwrap();
        
        let database_insert_duration = Histogram::with_opts(
            prometheus::histogram_opts!(
                "dataprocessor_database_insert_duration_seconds",
                "Duration of database insert operations in seconds"
            )
        ).unwrap();
        
        let rabbitmq_consume_duration = Histogram::with_opts(
            prometheus::histogram_opts!(
                "dataprocessor_rabbitmq_consume_duration_seconds",
                "Duration of RabbitMQ message consumption in seconds"
            )
        ).unwrap();
        
        registry.register(Box::new(messages_processed.clone())).unwrap();
        registry.register(Box::new(messages_failed.clone())).unwrap();
        registry.register(Box::new(processing_duration.clone())).unwrap();
        registry.register(Box::new(database_insert_duration.clone())).unwrap();
        registry.register(Box::new(rabbitmq_consume_duration.clone())).unwrap();
        
        Self {
            messages_processed,
            messages_failed,
            processing_duration,
            database_insert_duration,
            rabbitmq_consume_duration,
            registry: Arc::new(registry),
        }
    }
    
    pub fn gather(&self) -> String {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        let mut buffer = Vec::new();
        encoder.encode(&metric_families, &mut buffer).unwrap();
        String::from_utf8(buffer).unwrap()
    }
}

impl Default for Metrics {
    fn default() -> Self {
        Self::new()
    }
}

