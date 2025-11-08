import React, { useState, useEffect } from 'react';
import { Spin, Alert, Tabs, Badge } from 'antd';
import { 
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { graphqlApiService } from '../services/graphqlApiService';
import { SensorReading, SensorMetrics, AggregatedDataPoint, ProcessingStats, TimeRange } from '../types';
import MetricsCards from './metrics/MetricsCards';
import ProcessingStatsCards from './metrics/ProcessingStatsCards';
import TimeSeriesCharts from './charts/TimeSeriesCharts';
import DistributionCharts from './charts/DistributionCharts';
import OverviewCharts from './charts/OverviewCharts';
import DashboardControls from './controls/DashboardControls';
import Notifications from './Notifications';
import './Dashboard.css';

const { TabPane } = Tabs;

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SensorMetrics | null>(null);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('5m');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedSensorType, setSelectedSensorType] = useState<string>('all');
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastAggregatedDataTimestamp, setLastAggregatedDataTimestamp] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        const graphqlTest = await graphqlApiService.testGraphQLConnection();
        if (graphqlTest) {
          console.log('GraphQL API is working!');
        } else {
          console.log('GraphQL API not available, falling back to mock data');
        }
        
        const [metricsData, readingsData, aggregatedData, processingData] = await Promise.all([
          graphqlApiService.getMetrics(),
          graphqlApiService.getSensorReadings(20),
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
  }, [selectedTimeRange, selectedLocation, selectedSensorType]);

  useEffect(() => {
    let isMounted = true;
    
    const updateData = async () => {
      try {
        setIsUpdating(true);
        const [metricsData, readingsData, aggregatedData, processingData] = await Promise.all([
          graphqlApiService.getMetrics(true),
          graphqlApiService.getSensorReadings(20, 0, true),
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
          console.error('Background update failed:', err);
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
  }, [selectedTimeRange]);

  const handleTimeRangeChange = async (range: TimeRange) => {
    setSelectedTimeRange(range);
    try {
      const data = await graphqlApiService.getAggregatedData(range, true);
      setAggregatedData(data);
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

  const filteredReadings = sensorReadings.filter(reading => {
    const locationMatch = selectedLocation === 'all' || reading.sensorName === selectedLocation;
    const typeMatch = selectedSensorType === 'all' || reading.sensorType === selectedSensorType;
    return locationMatch && typeMatch;
  });

  const locations = [...new Set(sensorReadings.map(reading => reading.sensorName))];
  const sensorTypes = [...new Set(sensorReadings.map(reading => reading.sensorType))];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1>IoT Sensor Dashboard</h1>
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
        </div>
        <DashboardControls
          selectedLocation={selectedLocation}
          selectedSensorType={selectedSensorType}
          selectedTimeRange={selectedTimeRange}
          locations={locations}
          sensorTypes={sensorTypes}
          onLocationChange={setSelectedLocation}
          onSensorTypeChange={setSelectedSensorType}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      {/* Metrics Cards */}
      <MetricsCards metrics={metrics} />

      {/* Processing Stats Row */}
      {processingStats && (
        <ProcessingStatsCards processingStats={processingStats} />
      )}

      {/* Charts Section */}
      <Tabs defaultActiveKey="1" className="charts-tabs">
        <TabPane tab={<span><LineChartOutlined />Time Series</span>} key="1">
          <TimeSeriesCharts 
            data={aggregatedData} 
            timeRange={selectedTimeRange}
            key={`timeseries-${aggregatedData?.[0]?.timestamp || 'empty'}-${selectedTimeRange}`}
          />
        </TabPane>

        <TabPane tab={<span><BarChartOutlined />Distribution</span>} key="2">
          <DistributionCharts metrics={metrics} />
        </TabPane>

        <TabPane tab={<span><PieChartOutlined />Overview</span>} key="3">
          <OverviewCharts 
            metrics={metrics} 
            readings={filteredReadings}
          />
        </TabPane>
      </Tabs>

      {/* Notifications Component */}
      <div className="dashboard-notifications">
        <Notifications />
      </div>

      <div className="dashboard-footer">
        <p>Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}</p>
      </div>
    </div>
  );
};

export default Dashboard;
