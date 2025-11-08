import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { 
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { ProcessingStats } from '../../types';

interface ProcessingStatsCardsProps {
  processingStats: ProcessingStats;
}

const ProcessingStatsCards: React.FC<ProcessingStatsCardsProps> = ({ processingStats }) => {
  return (
    <Row gutter={[16, 16]} className="processing-stats-row">
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Processed Messages"
            value={processingStats.processedMessages || 0}
            prefix={<LineChartOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Failed Messages"
            value={processingStats.failedMessages || 0}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Processing Rate"
            value={processingStats.processingRatePerSecond?.toFixed(2) || 0}
            suffix="msg/s"
            prefix={<PieChartOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Last Processed"
            value={processingStats.lastProcessedAt ? 
              new Date(processingStats.lastProcessedAt).toLocaleTimeString() : 
              'Never'
            }
            prefix={<ThunderboltOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProcessingStatsCards;
