use anyhow::Result;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{SensorReading, SensorReadingInput};

pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPool::connect(database_url).await?;
        
        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;
        
        Ok(Self { pool })
    }
    
    pub async fn insert_sensor_reading(&self, data: SensorReadingInput) -> Result<SensorReading> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        
        let sensor_reading = sqlx::query_as::<_, SensorReading>(
            r#"
            INSERT INTO sensor_readings (id, sensor_type, sensor_name, payload, timestamp, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(&data.sensor_type)
        .bind(&data.sensor_name)
        .bind(&data.payload)
        .bind(data.timestamp)
        .bind(now)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(sensor_reading)
    }
    
    pub async fn insert_batch_sensor_readings(&self, data_batch: Vec<SensorReadingInput>) -> Result<Vec<SensorReading>> {
        let mut results = Vec::new();
        
        for data in data_batch {
            let result = self.insert_sensor_reading(data).await?;
            results.push(result);
        }
        
        Ok(results)
    }
    
    pub async fn get_sensor_readings_by_type(&self, sensor_type: &str) -> Result<Vec<SensorReading>> {
        let data = sqlx::query_as::<_, SensorReading>(
            "SELECT * FROM sensor_readings WHERE sensor_type = $1 ORDER BY timestamp DESC"
        )
        .bind(sensor_type)
        .fetch_all(&self.pool)
        .await?;
        
        Ok(data)
    }
    
    pub async fn get_sensor_readings_by_name(&self, sensor_name: &str) -> Result<Vec<SensorReading>> {
        let data = sqlx::query_as::<_, SensorReading>(
            "SELECT * FROM sensor_readings WHERE sensor_name = $1 ORDER BY timestamp DESC"
        )
        .bind(sensor_name)
        .fetch_all(&self.pool)
        .await?;
        
        Ok(data)
    }
    
    pub async fn get_latest_sensor_readings(&self, limit: i64) -> Result<Vec<SensorReading>> {
        let data = sqlx::query_as::<_, SensorReading>(
            "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT $1"
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        
        Ok(data)
    }
    
    pub async fn get_sensor_readings_by_time_range(
        &self,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<Vec<SensorReading>> {
        let data = sqlx::query_as::<_, SensorReading>(
            "SELECT * FROM sensor_readings WHERE timestamp BETWEEN $1 AND $2 ORDER BY timestamp DESC"
        )
        .bind(start_time)
        .bind(end_time)
        .fetch_all(&self.pool)
        .await?;
        
        Ok(data)
    }
    
    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .fetch_one(&self.pool)
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_sensor_reading_input_creation() {
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
    fn test_sensor_reading_input_with_different_types() {
        let energy_input = SensorReadingInput {
            sensor_type: "energy".to_string(),
            sensor_name: "EnergySensor".to_string(),
            payload: json!({"energy": 150.0}),
            timestamp: Utc::now(),
        };
        
        let air_quality_input = SensorReadingInput {
            sensor_type: "air_quality".to_string(),
            sensor_name: "AirQualitySensor".to_string(),
            payload: json!({"co2": 450, "pm25": 25, "humidity": 60}),
            timestamp: Utc::now(),
        };
        
        assert_eq!(energy_input.sensor_type, "energy");
        assert_eq!(air_quality_input.sensor_type, "air_quality");
    }

    #[test]
    fn test_sensor_reading_input_serialization() {
        let input = SensorReadingInput {
            sensor_type: "motion".to_string(),
            sensor_name: "MotionSensor".to_string(),
            payload: json!({"motion_detected": true}),
            timestamp: Utc::now(),
        };
        
        let json = serde_json::to_string(&input).unwrap();
        let deserialized: SensorReadingInput = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.sensor_type, "motion");
        assert_eq!(deserialized.sensor_name, "MotionSensor");
    }

    // Note: Integration tests for Database would require a real PostgreSQL connection
    // These are unit tests that verify the data structures and logic
}