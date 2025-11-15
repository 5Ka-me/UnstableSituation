import apolloClient from './apolloClient';
import { gql } from '@apollo/client';
import {
  GET_SENSOR_METRICS,
  GET_SENSOR_READINGS,
  GET_SENSOR_READINGS_BY_TYPE,
  GET_SENSOR_READINGS_BY_LOCATION,
  GET_AGGREGATED_DATA,
  GET_PROCESSING_STATS,
  GET_SENSOR_READING_BY_ID
} from './graphqlQueries';
import {
  SensorReading,
  SensorMetrics,
  AggregatedDataPoint,
  ProcessingStats,
  SensorMetricsResponse,
  SensorReadingsResponse,
  SensorReadingsByTypeResponse,
  SensorReadingsByLocationResponse,
  AggregatedDataResponse,
  ProcessingStatsResponse,
  SensorReadingByIdResponse,
  GraphQLApiService
} from '../types';

class GraphQLApiServiceImpl implements GraphQLApiService {
  private client = apolloClient;

  // Тест подключения к GraphQL
  async testGraphQLConnection(): Promise<SensorMetrics | null> {
    try {
      const result = await this.client.query<SensorMetricsResponse>({
        query: GET_SENSOR_METRICS,
        fetchPolicy: 'network-only'
      });
      
      return result.data.sensorMetrics;
    } catch (error) {
      return null;
    }
  }

  // Получение метрик сенсоров
  async getMetrics(forceRefresh: boolean = false): Promise<SensorMetrics> {
    try {
      // console.log(`📊 Fetching metrics (forceRefresh: ${forceRefresh})`);
      const result = await this.client.query<SensorMetricsResponse>({
        query: GET_SENSOR_METRICS,
        fetchPolicy: forceRefresh ? 'network-only' : 'cache-first'
      });
      
      // console.log(`📊 Metrics fetched: ${result.data.sensorMetrics.totalReadings} total readings`);
      return result.data.sensorMetrics;
    } catch (error) {
      throw error;
    }
  }

  // Получение показаний сенсоров
  async getSensorReadings(limit: number = 50, offset: number = 0, forceRefresh: boolean = false, timeRange?: string): Promise<SensorReading[]> {
    try {
      // console.log(`📡 Fetching sensor readings (limit: ${limit}, forceRefresh: ${forceRefresh}, timeRange: ${timeRange})`);
      const result = await this.client.query<SensorReadingsResponse>({
        query: GET_SENSOR_READINGS,
        variables: { limit, timeRange },
        fetchPolicy: forceRefresh ? 'network-only' : 'cache-first'
      });
      
      // console.log(`📡 Sensor readings fetched: ${result.data.sensorReadings.length} readings`);
      return result.data.sensorReadings;
    } catch (error) {
      throw error;
    }
  }

  // Получение показаний по типу сенсора
  async getSensorReadingsByType(sensorType: string, limit: number = 50): Promise<SensorReading[]> {
    try {
      const result = await this.client.query<SensorReadingsByTypeResponse>({
        query: GET_SENSOR_READINGS_BY_TYPE,
        variables: { sensorType, limit },
        fetchPolicy: 'cache-first'
      });
      
      return result.data.sensorReadingsByType;
    } catch (error) {
      throw error;
    }
  }

  // Получение показаний по локации
  async getSensorReadingsByLocation(sensorName: string, limit: number = 50, timeRange?: string): Promise<SensorReading[]> {
    try {
      const result = await this.client.query<SensorReadingsByLocationResponse>({
        query: GET_SENSOR_READINGS_BY_LOCATION,
        variables: { sensorName, limit, timeRange },
        fetchPolicy: 'network-only' // Всегда загружаем свежие данные при фильтрации
      });
      
      return result.data.sensorReadingsByLocation;
    } catch (error) {
      throw error;
    }
  }

  // Получение агрегированных данных
  async getAggregatedData(timeRange: string = '24h', forceRefresh: boolean = false): Promise<AggregatedDataPoint[]> {
    try {
      // console.log(`📊 Fetching aggregated data (timeRange: ${timeRange}, forceRefresh: ${forceRefresh})`);
      const result = await this.client.query<AggregatedDataResponse>({
        query: GET_AGGREGATED_DATA,
        variables: { timeRange },
        fetchPolicy: forceRefresh ? 'network-only' : 'cache-first'
      });
      
      // console.log(`📊 Aggregated data fetched: ${result.data.aggregatedData.length} data points`, {
      //   firstPoint: result.data.aggregatedData[0],
      //   lastPoint: result.data.aggregatedData[result.data.aggregatedData.length - 1]
      // });
      
      return result.data.aggregatedData;
    } catch (error) {
      throw error;
    }
  }

  // Получение статистики обработки
  async getProcessingStats(forceRefresh: boolean = false): Promise<ProcessingStats> {
    try {
      const result = await this.client.query<ProcessingStatsResponse>({
        query: GET_PROCESSING_STATS,
        fetchPolicy: forceRefresh ? 'network-only' : 'cache-first'
      });
      
      return result.data.processingStats;
    } catch (error) {
      throw error;
    }
  }

  // Получение конкретного показания по ID
  async getSensorReadingById(id: string): Promise<SensorReading> {
    try {
      const result = await this.client.query<SensorReadingByIdResponse>({
        query: GET_SENSOR_READING_BY_ID,
        variables: { id },
        fetchPolicy: 'cache-first'
      });
      
      return result.data.sensorReadingById;
    } catch (error) {
      throw error;
    }
  }

  // Обновление кэша для real-time обновлений
  updateSensorReadingCache(newReading: SensorReading): void {
    try {
      const client = this.client;
      client.cache.modify({
        fields: {
          getSensorReadings(existingReadings: readonly any[] = []) {
            const newReadingRef = client.cache.writeFragment({
              data: newReading,
              fragment: gql`
                fragment NewSensorReading on SensorReading {
                  id
                  sensorType
                  sensorName
                  payload
                  timestamp
                  createdAt
                }
              `
            });
            
            return [newReadingRef, ...existingReadings];
          }
        }
      });
    } catch (error) {
      // Cache update failed
    }
  }

  // Обновление метрик в кэше
  updateMetricsCache(newMetrics: SensorMetrics): void {
    try {
      this.client.cache.writeQuery({
        query: GET_SENSOR_METRICS,
        data: {
          sensorMetrics: newMetrics
        }
      });
    } catch (error) {
      // Metrics cache update failed
    }
  }
}

export const graphqlApiService = new GraphQLApiServiceImpl();
