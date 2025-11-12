import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppLayout from '../layout/AppLayout';

describe('AppLayout Component', () => {
  const mockOnCollapse = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <AppLayout collapsed={false} onCollapse={mockOnCollapse}>
        <div>Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render logo', () => {
    const { container } = render(
      <AppLayout collapsed={false} onCollapse={mockOnCollapse}>
        <div>Test</div>
      </AppLayout>
    );
    
    const logo = container.querySelector('.logo');
    expect(logo).toBeInTheDocument();
  });

  it('should show logo text when not collapsed', () => {
    const { container } = render(
      <AppLayout collapsed={false} onCollapse={mockOnCollapse}>
        <div>Test</div>
      </AppLayout>
    );
    
    const logoText = container.querySelector('.logo-text');
    expect(logoText).toBeInTheDocument();
    expect(logoText).toHaveTextContent('IoT Dashboard');
  });

  it('should hide logo text when collapsed', () => {
    const { container } = render(
      <AppLayout collapsed={true} onCollapse={mockOnCollapse}>
        <div>Test</div>
      </AppLayout>
    );
    
    const logoText = container.querySelector('.logo-text');
    expect(logoText).not.toBeInTheDocument();
  });
});

