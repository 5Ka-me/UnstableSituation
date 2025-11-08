import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { 
  ThunderboltOutlined, 
  CloudOutlined, 
  EyeOutlined, 
  EnvironmentOutlined
} from '@ant-design/icons';
import { SensorMetrics } from '../../types';

interface MetricsCardsProps {
  metrics: SensorMetrics | null;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  return (
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
  );
};

export default MetricsCards;
