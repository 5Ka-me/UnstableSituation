import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SensorReadingsList from '../SensorReadingsList';
import { SensorReading } from '../../types';

describe('SensorReadingsList Component', () => {
  const mockReadings: SensorReading[] = [
    {
      id: '1',
      sensorType: 'energy',
      sensorName: 'Sensor1',
      payload: { energy: 100.5 },
      timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    },
    {
      id: '2',
      sensorType: 'air_quality',
      sensorName: 'Sensor2',
      payload: { co2: 450, pm25: 25, humidity: 60 },
      timestamp: new Date('2024-01-01T11:00:00Z').toISOString(),
      createdAt: new Date('2024-01-01T11:00:00Z').toISOString(),
    },
    {
      id: '3',
      sensorType: 'motion',
      sensorName: 'Sensor3',
      payload: { motionDetected: true },
      timestamp: new Date('2024-01-01T12:00:00Z').toISOString(),
      createdAt: new Date('2024-01-01T12:00:00Z').toISOString(),
    },
  ];

  it('should render sensor readings', () => {
    render(<SensorReadingsList readings={mockReadings} />);
    
    expect(screen.getByText('Sensor1')).toBeInTheDocument();
    expect(screen.getByText('Sensor2')).toBeInTheDocument();
    expect(screen.getByText('Sensor3')).toBeInTheDocument();
  });

  it('should display sensor types', () => {
    render(<SensorReadingsList readings={mockReadings} />);
    
    expect(screen.getByText('energy')).toBeInTheDocument();
    expect(screen.getByText('air_quality')).toBeInTheDocument();
    expect(screen.getByText('motion')).toBeInTheDocument();
  });

  it('should display payload values', () => {
    render(<SensorReadingsList readings={mockReadings} />);
    
    expect(screen.getByText(/energy: 100.5/)).toBeInTheDocument();
    expect(screen.getByText(/co2: 450/)).toBeInTheDocument();
    expect(screen.getByText(/motionDetected: Yes/)).toBeInTheDocument();
  });

  it('should limit items to maxItems', () => {
    render(<SensorReadingsList readings={mockReadings} maxItems={2} />);
    
    expect(screen.getByText('Sensor1')).toBeInTheDocument();
    expect(screen.getByText('Sensor2')).toBeInTheDocument();
    expect(screen.queryByText('Sensor3')).not.toBeInTheDocument();
  });

  it('should use default maxItems of 10', () => {
    const manyReadings = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      sensorType: 'energy',
      sensorName: `Sensor${i}`,
      payload: { energy: 100 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }));

    render(<SensorReadingsList readings={manyReadings} />);
    
    expect(screen.getByText('Sensor0')).toBeInTheDocument();
    expect(screen.getByText('Sensor9')).toBeInTheDocument();
    expect(screen.queryByText('Sensor10')).not.toBeInTheDocument();
  });

  it('should format timestamps correctly', () => {
    render(<SensorReadingsList readings={mockReadings} />);
    
    const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('should handle boolean payload values', () => {
    render(<SensorReadingsList readings={mockReadings} />);
    
    expect(screen.getByText(/motionDetected: Yes/)).toBeInTheDocument();
  });

  it('should handle empty readings array', () => {
    render(<SensorReadingsList readings={[]} />);
    
    expect(screen.queryByText('Sensor1')).not.toBeInTheDocument();
  });

  it('should handle missing payload', () => {
    const readingWithoutPayload: SensorReading = {
      id: '4',
      sensorType: 'energy',
      sensorName: 'Sensor4',
      payload: {},
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    render(<SensorReadingsList readings={[readingWithoutPayload]} />);
    
    expect(screen.getByText('Sensor4')).toBeInTheDocument();
  });
});

