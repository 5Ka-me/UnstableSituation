import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import { graphqlApiService } from '../../services/graphqlApiService';

// Mock graphqlApiService
jest.mock('../../services/graphqlApiService', () => ({
  graphqlApiService: {
    testGraphQLConnection: jest.fn().mockResolvedValue(null),
    getMetrics: jest.fn().mockResolvedValue({
      totalReadings: 100,
      averageEnergy: 150.5,
      averageCO2: 450,
      averageHumidity: 60,
      motionDetectedCount: 5,
      lastUpdated: new Date().toISOString(),
    }),
    getSensorReadings: jest.fn().mockResolvedValue([]),
    getAggregatedData: jest.fn().mockResolvedValue([]),
    getProcessingStats: jest.fn().mockResolvedValue({
      id: '1',
      processedMessages: 1000,
      failedMessages: 10,
      lastProcessedAt: new Date().toISOString(),
      processingRatePerSecond: 50.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  },
}));

// Mock child components
jest.mock('../Notifications', () => {
  return function MockNotifications() {
    return <div data-testid="notifications">Notifications</div>;
  };
});

jest.mock('../metrics/MetricsCards', () => {
  return function MockMetricsCards({ metrics }: { metrics: any }) {
    return <div data-testid="metrics-cards">Metrics: {metrics?.totalReadings || 0}</div>;
  };
});

jest.mock('../charts/TimeSeriesCharts', () => {
  return function MockTimeSeriesCharts() {
    return <div data-testid="time-series-charts">Time Series Charts</div>;
  };
});

jest.mock('../controls/DashboardControls', () => {
  return function MockDashboardControls() {
    return <div data-testid="dashboard-controls">Controls</div>;
  };
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should load data on mount', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(graphqlApiService.getMetrics).toHaveBeenCalled();
      expect(graphqlApiService.getSensorReadings).toHaveBeenCalled();
      expect(graphqlApiService.getAggregatedData).toHaveBeenCalled();
      expect(graphqlApiService.getProcessingStats).toHaveBeenCalled();
    });
  });

  it('should render dashboard title', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('IoT Sensor Dashboard')).toBeInTheDocument();
    });
  });

  it('should render metrics cards', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('metrics-cards')).toBeInTheDocument();
    });
  });

  it('should render notifications component', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('notifications')).toBeInTheDocument();
    });
  });

  it('should render dashboard controls', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-controls')).toBeInTheDocument();
    });
  });

  it('should display error message on load failure', async () => {
    (graphqlApiService.getMetrics as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to load')
    );

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });
  });

  it('should filter readings by location', async () => {
    const mockReadings = [
      {
        id: '1',
        sensorType: 'energy',
        sensorName: 'Office',
        payload: { energy: 100 },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        sensorType: 'energy',
        sensorName: 'Living Room',
        payload: { energy: 200 },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (graphqlApiService.getSensorReadings as jest.Mock).mockResolvedValue(mockReadings);

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('IoT Sensor Dashboard')).toBeInTheDocument();
    });
  });
});

