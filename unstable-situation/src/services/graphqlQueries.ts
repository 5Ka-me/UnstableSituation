import { gql } from '@apollo/client';

// Запрос для получения метрик сенсоров
export const GET_SENSOR_METRICS = gql`
  query GetSensorMetrics {
    sensorMetrics {
      totalReadings
      averageEnergy
      averageCO2
      averageHumidity
      motionDetectedCount
      lastUpdated
    }
  }
`;

// Запрос для получения показаний сенсоров
export const GET_SENSOR_READINGS = gql`
  query GetSensorReadings($limit: Int, $timeRange: String) {
    sensorReadings(limit: $limit, timeRange: $timeRange) {
      id
      sensorType
      sensorName
      payload
      timestamp
      createdAt
    }
  }
`;

// Запрос для получения показаний по типу сенсора
export const GET_SENSOR_READINGS_BY_TYPE = gql`
  query GetSensorReadingsByType($sensorType: String!, $limit: Int) {
    sensorReadingsByType(sensorType: $sensorType, limit: $limit) {
      id
      sensorType
      sensorName
      payload
      timestamp
      createdAt
    }
  }
`;

// Запрос для получения показаний по локации
export const GET_SENSOR_READINGS_BY_LOCATION = gql`
  query GetSensorReadingsByLocation($sensorName: String!, $limit: Int, $timeRange: String) {
    sensorReadingsByLocation(sensorName: $sensorName, limit: $limit, timeRange: $timeRange) {
      id
      sensorType
      sensorName
      payload
      timestamp
      createdAt
    }
  }
`;

// Запрос для получения агрегированных данных
export const GET_AGGREGATED_DATA = gql`
  query GetAggregatedData($timeRange: String) {
    aggregatedData(timeRange: $timeRange) {
      timestamp
      energy
      co2
      pm25
      humidity
      motionDetected
    }
  }
`;

// Запрос для получения статистики обработки
export const GET_PROCESSING_STATS = gql`
  query GetProcessingStats {
    processingStats {
      id
      processedMessages
      failedMessages
      lastProcessedAt
      processingRatePerSecond
      createdAt
      updatedAt
    }
  }
`;

// Запрос для получения конкретного показания по ID
export const GET_SENSOR_READING_BY_ID = gql`
  query GetSensorReadingById($id: UUID!) {
    sensorReadingById(id: $id) {
      id
      sensorType
      sensorName
      payload
      timestamp
      createdAt
    }
  }
`;
