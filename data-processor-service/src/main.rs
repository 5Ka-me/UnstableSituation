use anyhow::Result;
use clap::Parser;
use data_processor_service::config::Config;
use data_processor_service::processor::DataProcessor;
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
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let args = Args::parse();
    
    info!("Starting Data Processor Service...");
    info!("Config file: {}", args.config);
    
    // Load configuration
    let config = Config::load(&args.config)?;
    info!("Configuration loaded successfully");
    info!("RabbitMQ connection: {}", config.rabbitmq.connection_string);
    info!("Database URL: {}", config.database.url);
    
    // Initialize data processor
    let mut processor = match DataProcessor::new(config).await {
        Ok(p) => {
            info!("Data processor initialized successfully");
            p
        }
        Err(e) => {
            error!("Failed to initialize data processor: {}", e);
            return Err(e);
        }
    };
    
    // Start data processing
    info!("Starting data processing loop...");
    if let Err(e) = processor.start().await {
        error!("Data processor failed: {}", e);
        return Err(e);
    }
    
    Ok(())
}
