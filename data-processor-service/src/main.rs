use anyhow::Result;
use clap::Parser;
use data_processor_service::config::Config;
use data_processor_service::processor::DataProcessor;
use data_processor_service::metrics::Metrics;
use data_processor_service::metrics_server::start_metrics_server;
use std::sync::Arc;
use tracing::{info, error};

#[derive(Parser)]
#[command(name = "data-processor-service")]
#[command(about = "Data Processor Service for microservices architecture")]
struct Args {
    #[arg(short, long, default_value = "config.yaml")]
    config: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let args = Args::parse();
    
    info!("Starting Data Processor Service...");
    info!("Config file: {}", args.config);
    
    let config = Config::load(&args.config)?;
    info!("Configuration loaded successfully");
    info!("RabbitMQ connection: {}", config.rabbitmq.connection_string);
    info!("Database URL: {}", config.database.url);
    
    // Initialize metrics
    let metrics = Arc::new(Metrics::new());
    
    // Start metrics server in background
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        if let Err(e) = start_metrics_server(metrics_clone, 3002).await {
            error!("Metrics server error: {}", e);
        }
    });
    
    let mut processor = match DataProcessor::new(config, metrics.clone()).await {
        Ok(p) => {
            info!("Data processor initialized successfully");
            p
        }
        Err(e) => {
            error!("Failed to initialize data processor: {}", e);
            return Err(e);
        }
    };
    
    info!("Starting data processing loop...");
    if let Err(e) = processor.start().await {
        error!("Data processor failed: {}", e);
        return Err(e);
    }
    
    Ok(())
}
