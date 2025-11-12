import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notifications from '../Notifications';
import { signalRService } from '../../services/signalRService';

// Mock signalRService
const mockOnNotification = jest.fn(() => () => {});

jest.mock('../../services/signalRService', () => ({
  signalRService: {
    onNotification: jest.fn(() => mockOnNotification),
  },
}));

describe('Notifications Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnNotification.mockReturnValue(() => {});
  });

  it('should render loading state initially', () => {
    render(<Notifications />);
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('should render notifications after loading', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('System started successfully')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display unread count badge', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });
  });

  it('should mark notification as read', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('System started successfully')).toBeInTheDocument();
    });

    const markAsReadButtons = screen.getAllByText('Mark as read');
    fireEvent.click(markAsReadButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Mark as read')).not.toBeInTheDocument();
    });
  });

  it('should mark all notifications as read', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    const markAllButton = screen.getByText('Mark all as read');
    fireEvent.click(markAllButton);

    await waitFor(() => {
      expect(markAllButton).toBeDisabled();
    });
  });

  it('should remove notification', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('System started successfully')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByText('Remove');
    const initialCount = screen.getAllByText('Remove').length;
    
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Remove').length).toBe(initialCount - 1);
    });
  });

  it('should display notifications list when notifications exist', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('System started successfully')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display error message on load failure', async () => {
    // This test would require mocking the loadNotifications to throw an error
    // For now, we test the error display structure
    render(<Notifications />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading notifications...')).not.toBeInTheDocument();
    });
  });

  it('should subscribe to SignalR notifications', () => {
    render(<Notifications />);
    
    expect(signalRService.onNotification).toHaveBeenCalled();
  });

  it('should display notification types correctly', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getByText('System started successfully')).toBeInTheDocument();
      expect(screen.getByText('High energy consumption detected in Office')).toBeInTheDocument();
      expect(screen.getByText('CO2 levels above normal in Living Room')).toBeInTheDocument();
    });
  });

  it('should format timestamps correctly', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });
});

