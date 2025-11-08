// GraphQL Types
export interface SensorReading {
  id: string;
  sensorType: string;
  sensorName: string;
  payload: Record<string, any>; // Now always an object, not a string
  timestamp: string;
  createdAt: string;
}

export interface SensorMetrics {
  totalReadings: number;
  averageEnergy: number;
  averageCO2: number;
  averageHumidity: number;
  motionDetectedCount: number;
  lastUpdated: string;
  readingsByType?: Record<string, number>;
  readingsByLocation?: Record<string, number>;
}

export interface AggregatedDataPoint {
  timestamp: string;
  energy: number;
  co2: number;
  pm25: number;
  humidity: number;
  motionDetected: number;
}

export interface ProcessingStats {
  id: string;
  processedMessages: number;
  failedMessages: number;
  lastProcessedAt: string;
  processingRatePerSecond: number;
  createdAt: string;
  updatedAt: string;
}

// GraphQL Response Types
export interface SensorMetricsResponse {
  sensorMetrics: SensorMetrics;
}

export interface SensorReadingsResponse {
  sensorReadings: SensorReading[];
}

export interface SensorReadingsByTypeResponse {
  sensorReadingsByType: SensorReading[];
}

export interface SensorReadingsByLocationResponse {
  sensorReadingsByLocation: SensorReading[];
}

export interface AggregatedDataResponse {
  aggregatedData: AggregatedDataPoint[];
}

export interface ProcessingStatsResponse {
  processingStats: ProcessingStats;
}

export interface SensorReadingByIdResponse {
  sensorReadingById: SensorReading;
}

// Component Props Types
export interface DashboardProps {}

export interface MetricCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  valueStyle?: React.CSSProperties;
}

export interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface TimeSeriesChartProps {
  data: AggregatedDataPoint[];
  timeRange: string;
}

export interface BarChartProps {
  data: Array<{ type?: string; location?: string; count: number }>;
  dataKey: string;
  xAxisKey: string;
}

export interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
}

export interface SensorReadingsListProps {
  readings: SensorReading[];
  maxItems?: number;
}

// Service Types
export interface GraphQLApiService {
  testGraphQLConnection(): Promise<SensorMetrics | null>;
  getMetrics(forceRefresh?: boolean): Promise<SensorMetrics>;
  getSensorReadings(limit?: number, offset?: number, forceRefresh?: boolean): Promise<SensorReading[]>;
  getSensorReadingsByType(sensorType: string, limit?: number): Promise<SensorReading[]>;
  getSensorReadingsByLocation(sensorName: string, limit?: number): Promise<SensorReading[]>;
  getAggregatedData(timeRange?: string, forceRefresh?: boolean): Promise<AggregatedDataPoint[]>;
  getProcessingStats(forceRefresh?: boolean): Promise<ProcessingStats>;
  getSensorReadingById(id: string): Promise<SensorReading>;
  updateSensorReadingCache(newReading: SensorReading): void;
  updateMetricsCache(newMetrics: SensorMetrics): void;
}

// Utility Types
export type TimeRange = '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '24h' | '7d' | '30d';

export interface FilterOptions {
  location: string;
  sensorType: string;
  timeRange: TimeRange;
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: string;
  energy?: number;
  co2?: number;
  humidity?: number;
  [key: string]: any;
}

export interface DistributionData {
  type?: string;
  location?: string;
  count: number;
}

export interface PieChartData {
  name: string;
  value: number;
}
