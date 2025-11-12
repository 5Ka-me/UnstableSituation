import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppHeader from '../layout/AppHeader';

describe('AppHeader Component', () => {
  const mockOnToggleCollapse = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with title', () => {
    render(<AppHeader collapsed={false} onToggleCollapse={mockOnToggleCollapse} />);
    
    expect(screen.getByText('IoT Sensor Monitoring System')).toBeInTheDocument();
  });

  it('should render collapse button', () => {
    render(<AppHeader collapsed={false} onToggleCollapse={mockOnToggleCollapse} />);
    
    const collapseButton = screen.getByRole('button');
    expect(collapseButton).toBeInTheDocument();
  });

  it('should call onToggleCollapse when button is clicked', () => {
    render(<AppHeader collapsed={false} onToggleCollapse={mockOnToggleCollapse} />);
    
    const collapseButton = screen.getByRole('button');
    fireEvent.click(collapseButton);
    
    expect(mockOnToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('should display connection status', () => {
    render(<AppHeader collapsed={false} onToggleCollapse={mockOnToggleCollapse} />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should have status indicator', () => {
    const { container } = render(
      <AppHeader collapsed={false} onToggleCollapse={mockOnToggleCollapse} />
    );
    
    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('connected');
  });
});

