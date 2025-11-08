use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensorData {
    pub r#type: String,
    pub name: String,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnergyPayload {
    pub energy: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AirQualityPayload {
    pub co2: i32,
    pub pm25: i32,
    pub humidity: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotionPayload {
    pub motion_detected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SensorReading {
    pub id: Uuid,
    pub sensor_type: String,
    pub sensor_name: String,
    pub payload: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensorReadingInput {
    pub sensor_type: String,
    pub sensor_name: String,
    pub payload: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingStats {
    pub processed_messages: u64,
    pub failed_messages: u64,
    pub last_processed_at: Option<DateTime<Utc>>,
    pub processing_rate_per_second: f64,
}
