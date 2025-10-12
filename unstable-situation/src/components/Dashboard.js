import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Tabs, Select } from 'antd';
import { 
  ThunderboltOutlined, 
  CloudOutlined, 
  EyeOutlined, 
  EnvironmentOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { mockApiService } from '../services/mockApiService';
import './Dashboard.css';

const { TabPane } = Tabs;

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [metricsData, readingsData, aggregatedData] = await Promise.all([
          mockApiService.getMetrics(),
          mockApiService.getSensorReadings(20),
          mockApiService.getAggregatedData(selectedTimeRange)
        ]);
        
        if (isMounted) {
          setMetrics(metricsData);
          setSensorReadings(readingsData);
          setAggregatedData(aggregatedData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load data: ' + err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Set up interval for updates
    const interval = setInterval(() => {
      if (isMounted) {
        loadData();
      }
    }, 5000); // Update every 10 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedTimeRange]);

  const loadMetrics = async () => {
    try {
      const metricsData = await mockApiService.getMetrics();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const handleTimeRangeChange = async (range) => {
    setSelectedTimeRange(range);
    try {
      const data = await mockApiService.getAggregatedData(range);
      setAggregatedData(data);
    } catch (err) {
      setError('Failed to load aggregated data: ' + err.message);
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

  const filteredReadings = selectedLocation === 'all' 
    ? sensorReadings 
    : sensorReadings.filter(reading => reading.sensorName === selectedLocation);

  const locations = [...new Set(sensorReadings.map(reading => reading.sensorName))];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>IoT Sensor Dashboard</h1>
        <div className="dashboard-controls">
          <Select
            value={selectedLocation}
            onChange={setSelectedLocation}
            style={{ width: 150, marginRight: 16 }}
          >
            <Select.Option value="all">All Locations</Select.Option>
            {locations.map(location => (
              <Select.Option key={location} value={location}>
                {location}
              </Select.Option>
            ))}
          </Select>
          <Select
            value={selectedTimeRange}
            onChange={handleTimeRangeChange}
            style={{ width: 120 }}
          >
            <Select.Option value="1h">Last Hour</Select.Option>
            <Select.Option value="24h">Last 24 Hours</Select.Option>
            <Select.Option value="7d">Last 7 Days</Select.Option>
            <Select.Option value="30d">Last 30 Days</Select.Option>
          </Select>
        </div>
      </div>

      {/* Metrics Cards */}
      <Row gutter={[16, 16]} className="metrics-row">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Readings"
              value={metrics?.totalReadings || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Energy (W)"
              value={metrics?.averageEnergy?.toFixed(2) || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg CO₂ (ppm)"
              value={metrics?.averageCO2?.toFixed(0) || 0}
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Motion Detected"
              value={metrics?.motionDetectedCount || 0}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Tabs defaultActiveKey="1" className="charts-tabs">
        <TabPane tab={<span><LineChartOutlined />Time Series</span>} key="1">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Energy Consumption Over Time" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aggregatedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Air Quality Over Time" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aggregatedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="co2" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ fill: '#82ca9d' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      dot={{ fill: '#ffc658' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><BarChartOutlined />Distribution</span>} key="2">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Readings by Sensor Type" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(metrics?.readingsByType || {}).map(([type, count]) => ({ type, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Readings by Location" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(metrics?.readingsByLocation || {}).map(([location, count]) => ({ location, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><PieChartOutlined />Overview</span>} key="3">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Sensor Type Distribution" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(metrics?.readingsByType || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(metrics?.readingsByType || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Latest Sensor Readings" className="chart-card">
                <div className="readings-list">
                  {filteredReadings.slice(0, 10).map((reading, index) => (
                    <div key={reading.id} className="reading-item">
                      <div className="reading-header">
                        <span className="sensor-type">{reading.sensorType}</span>
                        <span className="sensor-name">{reading.sensorName}</span>
                      </div>
                      <div className="reading-payload">
                        {Object.entries(reading.payload).map(([key, value]) => (
                          <span key={key} className="payload-item">
                            {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                          </span>
                        ))}
                      </div>
                      <div className="reading-time">
                        {new Date(reading.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <div className="dashboard-footer">
        <p>Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}</p>
      </div>
    </div>
  );
};

export default Dashboard;