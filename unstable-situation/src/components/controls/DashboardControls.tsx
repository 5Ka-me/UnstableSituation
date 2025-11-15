import React from 'react';
import { Select } from 'antd';
import { TimeRange } from '../../types';

interface DashboardControlsProps {
  selectedLocation: string;
  selectedTimeRange: TimeRange;
  locations: string[];
  onLocationChange: (location: string) => void;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  selectedLocation,
  selectedTimeRange,
  locations,
  onLocationChange,
  onTimeRangeChange
}) => {
  return (
    <div className="dashboard-controls">
      <span className="real-time-indicator">
        <span className="pulse active"></span>
        Live Data
      </span>
      <Select
        value={selectedLocation}
        onChange={onLocationChange}
        style={{ width: 150, marginRight: 16 }}
        placeholder="Select Location"
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
        onChange={onTimeRangeChange}
        style={{ width: 140 }}
      >
        <Select.Option value="30s">30 Seconds</Select.Option>
        <Select.Option value="1m">1 Minute</Select.Option>
        <Select.Option value="5m">5 Minutes</Select.Option>
        <Select.Option value="15m">15 Minutes</Select.Option>
        <Select.Option value="30m">30 Minutes</Select.Option>
        <Select.Option value="1h">1 Hour</Select.Option>
        <Select.Option value="6h">6 Hours</Select.Option>
        <Select.Option value="24h">24 Hours</Select.Option>
        <Select.Option value="7d">7 Days</Select.Option>
        <Select.Option value="30d">30 Days</Select.Option>
      </Select>
    </div>
  );
};

export default DashboardControls;
