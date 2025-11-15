import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppHeader from '../layout/AppHeader';

describe('AppHeader Component', () => {
  it('should render header with title', () => {
    render(<AppHeader />);
    
    expect(screen.getByText('Monitoring System')).toBeInTheDocument();
  });

  it('should display connection status', () => {
    render(<AppHeader />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should have status indicator', () => {
    const { container } = render(<AppHeader />);
    
    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('connected');
  });
});

