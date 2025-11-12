import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetricsCards from '../metrics/MetricsCards';
import { SensorMetrics } from '../../types';

describe('MetricsCards Component', () => {
  const mockMetrics: SensorMetrics = {
    totalReadings: 1000,
    averageEnergy: 150.75,
    averageCO2: 450,
    averageHumidity: 60,
    motionDetectedCount: 25,
    lastUpdated: new Date().toISOString(),
  };

  it('should render all metric cards', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    
    expect(screen.getByText('Total Readings')).toBeInTheDocument();
    expect(screen.getByText('Avg Energy (W)')).toBeInTheDocument();
    expect(screen.getByText('Avg CO₂ (ppm)')).toBeInTheDocument();
    expect(screen.getByText('Motion Detected')).toBeInTheDocument();
  });

  it('should display metric values', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('150.75')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should display zero values when metrics is null', () => {
    render(<MetricsCards metrics={null} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should format energy value with 2 decimal places', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    
    const energyValue = screen.getByText('150.75');
    expect(energyValue).toBeInTheDocument();
  });

  it('should format CO2 value as integer', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    
    const co2Value = screen.getByText('450');
    expect(co2Value).toBeInTheDocument();
  });

  it('should handle missing metrics gracefully', () => {
    const partialMetrics: Partial<SensorMetrics> = {
      totalReadings: 100,
    };

    render(<MetricsCards metrics={partialMetrics as SensorMetrics} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});

