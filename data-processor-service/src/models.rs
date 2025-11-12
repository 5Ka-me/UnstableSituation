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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_sensor_data_serialization() {
        let sensor_data = SensorData {
            r#type: "energy".to_string(),
            name: "Sensor1".to_string(),
            payload: json!({"value": 100.5}),
        };
        
        let json = serde_json::to_string(&sensor_data).unwrap();
        let deserialized: SensorData = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.r#type, "energy");
        assert_eq!(deserialized.name, "Sensor1");
    }

    #[test]
    fn test_energy_payload() {
        let payload = EnergyPayload { energy: 150.75 };
        let json = serde_json::to_string(&payload).unwrap();
        let deserialized: EnergyPayload = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.energy, 150.75);
    }

    #[test]
    fn test_air_quality_payload() {
        let payload = AirQualityPayload {
            co2: 450,
            pm25: 25,
            humidity: 60,
        };
        let json = serde_json::to_string(&payload).unwrap();
        let deserialized: AirQualityPayload = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.co2, 450);
        assert_eq!(deserialized.pm25, 25);
        assert_eq!(deserialized.humidity, 60);
    }

    #[test]
    fn test_motion_payload() {
        let payload = MotionPayload {
            motion_detected: true,
        };
        let json = serde_json::to_string(&payload).unwrap();
        let deserialized: MotionPayload = serde_json::from_str(&json).unwrap();
        
        assert!(deserialized.motion_detected);
    }

    #[test]
    fn test_sensor_reading_input() {
        let input = SensorReadingInput {
            sensor_type: "energy".to_string(),
            sensor_name: "Sensor1".to_string(),
            payload: json!({"value": 100.5}),
            timestamp: Utc::now(),
        };
        
        assert_eq!(input.sensor_type, "energy");
        assert_eq!(input.sensor_name, "Sensor1");
    }

    #[test]
    fn test_processing_stats() {
        let stats = ProcessingStats {
            processed_messages: 1000,
            failed_messages: 10,
            last_processed_at: Some(Utc::now()),
            processing_rate_per_second: 50.5,
        };
        
        assert_eq!(stats.processed_messages, 1000);
        assert_eq!(stats.failed_messages, 10);
        assert!(stats.last_processed_at.is_some());
        assert_eq!(stats.processing_rate_per_second, 50.5);
    }

    #[test]
    fn test_processing_stats_without_last_processed() {
        let stats = ProcessingStats {
            processed_messages: 500,
            failed_messages: 5,
            last_processed_at: None,
            processing_rate_per_second: 25.0,
        };
        
        assert_eq!(stats.processed_messages, 500);
        assert_eq!(stats.failed_messages, 5);
        assert!(stats.last_processed_at.is_none());
    }
}