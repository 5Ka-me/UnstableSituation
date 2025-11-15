import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Alert, Badge } from 'antd';
import { 
  LineChartOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { graphqlApiService } from '../services/graphqlApiService';
import { SensorReading, SensorMetrics, AggregatedDataPoint, ProcessingStats, TimeRange } from '../types';
import { calculateMetricsFromReadings, aggregateReadingsByTime } from '../utils/metricsCalculator';
import MetricsCards from './metrics/MetricsCards';
import TimeSeriesCharts from './charts/TimeSeriesCharts';
import DashboardControls from './controls/DashboardControls';
import Notifications from './Notifications';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SensorMetrics | null>(null);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('5m');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastAggregatedDataTimestamp, setLastAggregatedDataTimestamp] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<string[]>([]);

  // Вычисляем метрики из отфильтрованных данных
  const filteredMetrics = useMemo(() => {
    // Всегда вычисляем метрики из sensorReadings, которые уже отфильтрованы по времени
    // Это гарантирует, что Total Readings учитывает и временной диапазон, и локацию
    let readingsToUse = sensorReadings;
    
    // Если выбрана конкретная локация, дополнительно фильтруем по локации
    if (selectedLocation !== 'all') {
      readingsToUse = sensorReadings.filter(reading => reading.sensorName === selectedLocation);
    }
    
    // Вычисляем метрики из отфильтрованных readings
    if (readingsToUse.length > 0) {
      return calculateMetricsFromReadings(readingsToUse);
    }
    
    // Если нет данных, возвращаем пустые метрики
    return {
      totalReadings: 0,
      averageEnergy: 0,
      averageCO2: 0,
      averageHumidity: 0,
      motionDetectedCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }, [sensorReadings, selectedLocation]);

  // Фильтруем агрегированные данные по локации
  const filteredAggregatedData = useMemo(() => {
    if (selectedLocation === 'all') {
      return aggregatedData;
    }
    // Если выбрана конкретная локация, агрегируем данные из отфильтрованных readings
    const filteredReadings = sensorReadings.filter(reading => reading.sensorName === selectedLocation);
    return aggregateReadingsByTime(filteredReadings, selectedTimeRange);
  }, [aggregatedData, selectedLocation, sensorReadings, selectedTimeRange]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        const graphqlTest = await graphqlApiService.testGraphQLConnection();
        if (!graphqlTest) {
          // GraphQL API not available, falling back to mock data
        }
        
        // Load readings based on location filter (load more for aggregation)
        // Передаем timeRange для фильтрации по времени
        const readingsPromise = selectedLocation === 'all' 
          ? graphqlApiService.getSensorReadings(1000, 0, false, selectedTimeRange)
          : graphqlApiService.getSensorReadingsByLocation(selectedLocation, 1000, selectedTimeRange);
        
        const [metricsData, readingsData, aggregatedData, processingData] = await Promise.all([
          graphqlApiService.getMetrics(),
          readingsPromise,
          graphqlApiService.getAggregatedData(selectedTimeRange),
          graphqlApiService.getProcessingStats()
        ]);
        
        if (isMounted) {
          setMetrics(metricsData);
          setSensorReadings(readingsData);
          setAggregatedData(aggregatedData);
          setProcessingStats(processingData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load data: ' + (err as Error).message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedTimeRange, selectedLocation]);

  useEffect(() => {
    let isMounted = true;
    
    const updateData = async () => {
      try {
        setIsUpdating(true);
        
        // Load readings based on location filter (load more for aggregation)
        // Передаем timeRange для фильтрации по времени
        const readingsPromise = selectedLocation === 'all' 
          ? graphqlApiService.getSensorReadings(1000, 0, true, selectedTimeRange)
          : graphqlApiService.getSensorReadingsByLocation(selectedLocation, 1000, selectedTimeRange);
        
        const [metricsData, readingsData, aggregatedData, processingData] = await Promise.all([
          graphqlApiService.getMetrics(true),
          readingsPromise,
          graphqlApiService.getAggregatedData(selectedTimeRange, true),
          graphqlApiService.getProcessingStats(true)
        ]);
        
        if (isMounted) {
          const latestTimestamp = aggregatedData?.[aggregatedData.length - 1]?.timestamp;
          
          setMetrics(metricsData);
          setSensorReadings(readingsData);
          setAggregatedData(aggregatedData);
          setProcessingStats(processingData);
          setLastAggregatedDataTimestamp(latestTimestamp || null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          // Background update failed
        }
      } finally {
        if (isMounted) {
          setIsUpdating(false);
        }
      }
    };

    updateData();

    const interval = setInterval(() => {
      if (isMounted) {
        updateData();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeRange, selectedLocation]);

  // Load all locations once on mount
  useEffect(() => {
    const loadAllLocations = async () => {
      try {
        const allReadings = await graphqlApiService.getSensorReadings(100);
        const uniqueLocations = [...new Set(allReadings.map(reading => reading.sensorName))];
        setAllLocations(uniqueLocations);
      } catch (err) {
        // If failed, use locations from current readings
        const uniqueLocations = [...new Set((sensorReadings || []).map(reading => reading.sensorName))];
        setAllLocations(uniqueLocations);
      }
    };
    
    loadAllLocations();
  }, []);

  // Update locations when sensorReadings change (fallback)
  useEffect(() => {
    if (allLocations.length === 0 && sensorReadings.length > 0) {
      const uniqueLocations = [...new Set(sensorReadings.map(reading => reading.sensorName))];
      setAllLocations(uniqueLocations);
    }
  }, [sensorReadings, allLocations.length]);

  const handleTimeRangeChange = async (range: TimeRange) => {
    setSelectedTimeRange(range);
    try {
      // При изменении временного диапазона загружаем новые агрегированные данные
      // и обновляем readings для корректного отображения метрик
      const [aggregatedData, readingsData] = await Promise.all([
        graphqlApiService.getAggregatedData(range, true),
        selectedLocation === 'all' 
          ? graphqlApiService.getSensorReadings(1000, 0, true, range)
          : graphqlApiService.getSensorReadingsByLocation(selectedLocation, 1000, range)
      ]);
      setAggregatedData(aggregatedData);
      setSensorReadings(readingsData);
    } catch (err) {
      setError('Failed to load aggregated data: ' + (err as Error).message);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        }
      />
    );
  }

  const locations = allLocations.length > 0 ? allLocations : [...new Set((sensorReadings || []).map(reading => reading.sensorName))];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        {isUpdating && (
          <Badge 
            status="processing" 
            text={
              <span style={{ color: '#1890ff', fontSize: '14px' }}>
                <SyncOutlined spin /> Updating charts...
              </span>
            } 
          />
        )}
        <DashboardControls
          selectedLocation={selectedLocation}
          selectedTimeRange={selectedTimeRange}
          locations={locations}
          onLocationChange={setSelectedLocation}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      {/* Metrics Cards */}
      <MetricsCards metrics={filteredMetrics} />

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-header">
          <LineChartOutlined style={{ marginRight: 8 }} />
          <h2>Time Series</h2>
        </div>
        <TimeSeriesCharts 
          data={filteredAggregatedData} 
          timeRange={selectedTimeRange}
          key={`timeseries-${filteredAggregatedData?.[0]?.timestamp || 'empty'}-${selectedTimeRange}-${selectedLocation}`}
        />
      </div>

      {/* Notifications Component */}
      <div className="dashboard-notifications">
        <Notifications />
      </div>

      <div className="dashboard-footer">
        <p>Last updated: {filteredMetrics?.lastUpdated ? new Date(filteredMetrics.lastUpdated).toLocaleString() : 'Never'}</p>
      </div>
    </div>
  );
};

export default Dashboard;
