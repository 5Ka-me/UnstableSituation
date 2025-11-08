import React from 'react';
import { Card, Row, Col } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SensorMetrics, SensorReading } from '../../types';
import SensorReadingsList from '../SensorReadingsList';

interface OverviewChartsProps {
  metrics: SensorMetrics | null;
  readings: SensorReading[];
}

const OverviewCharts: React.FC<OverviewChartsProps> = ({ metrics, readings }) => {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
  
  const pieChartData = Object.entries(metrics?.readingsByType || {}).map(([name, value]) => ({ 
    name, 
    value 
  }));

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Sensor Type Distribution" className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
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
          <SensorReadingsList readings={readings} maxItems={10} />
        </Card>
      </Col>
    </Row>
  );
};

export default OverviewCharts;
