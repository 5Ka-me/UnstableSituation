use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};
use std::sync::Arc;
use crate::metrics::Metrics;

pub async fn start_metrics_server(metrics: Arc<Metrics>, port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let app = Router::new()
        .route("/metrics", get(metrics_handler))
        .route("/health", get(health_handler))
        .with_state(metrics);
    
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    tracing::info!("Metrics server started on port {}", port);
    
    axum::serve(listener, app).await?;
    Ok(())
}

async fn metrics_handler(State(metrics): State<Arc<Metrics>>) -> impl IntoResponse {
    (StatusCode::OK, metrics.gather())
}

async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

