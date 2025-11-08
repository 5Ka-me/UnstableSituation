import React from 'react';
import { Card, Row, Col } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SensorMetrics } from '../../types';

interface DistributionChartsProps {
  metrics: SensorMetrics | null;
}

const DistributionCharts: React.FC<DistributionChartsProps> = ({ metrics }) => {
  const readingsByTypeData = Object.entries(metrics?.readingsByType || {}).map(([type, count]) => ({ 
    type, 
    count 
  }));

  const readingsByLocationData = Object.entries(metrics?.readingsByLocation || {}).map(([location, count]) => ({ 
    location, 
    count 
  }));

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Readings by Sensor Type" className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={readingsByTypeData}>
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
            <BarChart data={readingsByLocationData}>
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
  );
};

export default DistributionCharts;
