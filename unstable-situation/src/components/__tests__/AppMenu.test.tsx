import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppMenu from '../layout/AppMenu';

describe('AppMenu Component', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render menu items', () => {
    render(<AppMenu selectedKey="dashboard" onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('Sensors')).toBeInTheDocument();
    expect(screen.getByText('Air Quality')).toBeInTheDocument();
  });

  it('should call onSelect when menu item is clicked', () => {
    render(<AppMenu selectedKey="dashboard" onSelect={mockOnSelect} />);
    
    const metricsItem = screen.getByText('Metrics');
    fireEvent.click(metricsItem);
    
    expect(mockOnSelect).toHaveBeenCalledWith('metrics');
  });

  it('should use default selectedKey when not provided', () => {
    render(<AppMenu onSelect={mockOnSelect} />);
    
    // Menu should still render
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should not call onSelect when not provided', () => {
    render(<AppMenu selectedKey="dashboard" />);
    
    const metricsItem = screen.getByText('Metrics');
    fireEvent.click(metricsItem);
    
    // Should not throw error
    expect(metricsItem).toBeInTheDocument();
  });
});

