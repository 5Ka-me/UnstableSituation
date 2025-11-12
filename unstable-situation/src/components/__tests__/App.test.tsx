import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import { signalRService } from '../../services/signalRService';

// Mock SignalR service
jest.mock('../../services/signalRService', () => ({
  signalRService: {
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock child components to simplify testing
jest.mock('../Dashboard', () => {
  return function MockDashboard() {
    return <div>Dashboard</div>;
  };
});

jest.mock('../layout/AppLayout', () => {
  return function MockAppLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="app-layout">{children}</div>;
  };
});

jest.mock('../layout/AppMenu', () => {
  return function MockAppMenu({ onSelect }: { onSelect?: (key: string) => void }) {
    return (
      <div data-testid="app-menu">
        <button onClick={() => onSelect?.('dashboard')}>Dashboard</button>
        <button onClick={() => onSelect?.('metrics')}>Metrics</button>
      </div>
    );
  };
});

jest.mock('../layout/AppHeader', () => {
  return function MockAppHeader({ onToggleCollapse }: { onToggleCollapse: () => void }) {
    return (
      <div data-testid="app-header">
        <button onClick={onToggleCollapse}>Toggle</button>
      </div>
    );
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render app layout', () => {
    render(<App />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('should initialize SignalR connection on mount', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(signalRService.connect).toHaveBeenCalled();
    });
  });

  it('should render dashboard by default', () => {
    render(<App />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render app header', () => {
    render(<App />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  it('should render app menu', () => {
    render(<App />);
    expect(screen.getByTestId('app-menu')).toBeInTheDocument();
  });
});

