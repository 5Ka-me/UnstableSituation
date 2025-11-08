import React from 'react';
import { SensorReading } from '../types';

interface SensorReadingsListProps {
  readings: SensorReading[];
  maxItems?: number;
}

const SensorReadingsList: React.FC<SensorReadingsListProps> = ({ readings, maxItems = 10 }) => {
  return (
    <div className="readings-list">
      {readings.slice(0, maxItems).map((reading) => (
        <div key={reading.id} className="reading-item">
          <div className="reading-header">
            <span className="sensor-type">{reading.sensorType}</span>
            <span className="sensor-name">{reading.sensorName}</span>
          </div>
          <div className="reading-payload">
            {Object.entries(reading.payload || {}).map(([key, value]) => (
              <span key={key} className="payload-item">
                {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </span>
            ))}
          </div>
          <div className="reading-time">
            {new Date(reading.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SensorReadingsList;
