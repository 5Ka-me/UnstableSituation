import React from 'react';
import { Card, Row, Col } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AggregatedDataPoint, TimeRange } from '../../types';

interface TimeSeriesChartsProps {
  data: AggregatedDataPoint[];
  timeRange: TimeRange;
}

const TimeSeriesCharts: React.FC<TimeSeriesChartsProps> = ({ data, timeRange }) => {
  // Debug logging to see what data we're receiving
  // console.log('📈 TimeSeriesCharts received data:', {
  //   dataLength: data?.length,
  //   timeRange,
  //   latestTimestamp: data?.[0]?.timestamp,
  //   sampleData: data?.slice(0, 2)
  // });

  // Calculate dynamic Y-axis ranges based on actual data
  const calculateYAxisRange = (dataKey: string) => {
    if (!data || data.length === 0) return { min: 0, max: 100 };
    
    const values = data.map(d => (d as any)[dataKey]).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return { min: 0, max: 100 };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // If there's very little variation, ensure we show at least 5% of the value range
    const variation = max - min;
    const minVariation = Math.max(max * 0.05, 1); // At least 5% of the max value or 1 unit
    
    if (variation < minVariation) {
      const center = (min + max) / 2;
      const padding = minVariation / 2;
      return { 
        min: Math.max(0, center - padding), 
        max: center + padding 
      };
    }
    
    // Add 10% padding above and below the data range
    const padding = Math.max(variation * 0.1, 1);
    const rangeMin = Math.max(0, min - padding);
    const rangeMax = max + padding;
    
    return { min: rangeMin, max: rangeMax };
  };

  const energyRange = calculateYAxisRange('energy');
  const co2Range = calculateYAxisRange('co2');
  const pm25Range = calculateYAxisRange('pm25');
  const humidityRange = calculateYAxisRange('humidity');
  const motionRange = calculateYAxisRange('motionDetected');

  // Calculate appropriate number of X-axis ticks based on time range
  const getXAxisTickCount = () => {
    if (!data || data.length === 0) return 5;
    
    const dataLength = data.length;
    if (dataLength <= 5) return dataLength;
    if (dataLength <= 10) return 5;
    if (dataLength <= 20) return 6;
    return Math.min(8, Math.floor(dataLength / 3));
  };

  // console.log('📊 Y-axis ranges calculated:', {
  //   energy: energyRange,
  //   co2: co2Range,
  //   pm25: pm25Range,
  //   humidity: humidityRange,
  //   motion: motionRange,
  //   xAxisTickCount: getXAxisTickCount()
  // });

  const formatTimeLabel = (timestamp: string): string => {
    const date = new Date(timestamp);
    
    // Format based on selected time range for better granularity
    if (timeRange === '30s' || timeRange === '1m') {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } else if (timeRange === '5m' || timeRange === '15m') {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (timeRange === '30m') {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (timeRange === '1h' || timeRange === '6h') {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (timeRange === '24h') {
      return date.toLocaleTimeString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (timeRange === '7d' || timeRange === '30d') {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card 
          title={`Energy Consumption Over Time`} 
          className="chart-card"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} key={`energy-chart-${data?.[0]?.timestamp || 'empty'}`}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimeLabel}
                tickCount={getXAxisTickCount()}
              />
              <YAxis 
                domain={[energyRange.min, energyRange.max]}
                tickCount={6}
                label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any) => [`${Number(value).toFixed(2)} kWh`, 'Energy']}
              />
              <Line 
                type="monotone" 
                dataKey="energy" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', r: 3 }}
                name="Energy"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card 
          title={`Air Quality - CO2 & PM2.5`} 
          className="chart-card"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} key={`air-quality-chart-${data?.[0]?.timestamp || 'empty'}`}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimeLabel}
                tickCount={getXAxisTickCount()}
              />
              <YAxis 
                yAxisId="left"
                domain={[co2Range.min, co2Range.max]}
                tickCount={6}
                label={{ value: 'CO2 (ppm)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[pm25Range.min, pm25Range.max]}
                tickCount={6}
                label={{ value: 'PM2.5 (µg/m³)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="co2" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ fill: '#82ca9d', r: 3 }}
                name="CO2"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="pm25" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={{ fill: '#ff7300', r: 3 }}
                name="PM2.5"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card 
          title={`Humidity Over Time`} 
          className="chart-card"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} key={`humidity-chart-${data?.[0]?.timestamp || 'empty'}`}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimeLabel}
                tickCount={getXAxisTickCount()}
              />
              <YAxis 
                domain={[humidityRange.min, humidityRange.max]}
                tickCount={6}
                label={{ value: 'Humidity (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any) => [`${Number(value).toFixed(0)}%`, 'Humidity']}
              />
              <Line 
                type="monotone" 
                dataKey="humidity" 
                stroke="#ffc658" 
                strokeWidth={2}
                dot={{ fill: '#ffc658', r: 3 }}
                name="Humidity"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card 
          title={`Motion Detections Over Time`} 
          className="chart-card"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} key={`motion-chart-${data?.[0]?.timestamp || 'empty'}`}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimeLabel}
                tickCount={getXAxisTickCount()}
              />
              <YAxis 
                domain={[0, Math.max(motionRange.max, 1)]}
                tickCount={Math.max(Math.ceil(motionRange.max), 5)}
                label={{ value: 'Motion Detections', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any) => [`${Number(value).toFixed(0)}`, 'Motion Detections']}
              />
              <Line 
                type="monotone" 
                dataKey="motionDetected" 
                stroke="#ff6b6b" 
                strokeWidth={2}
                dot={{ fill: '#ff6b6b', r: 3 }}
                name="Motion Detections"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default TimeSeriesCharts;
