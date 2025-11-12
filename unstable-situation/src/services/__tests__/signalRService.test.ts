import { signalRService } from '../signalRService';
import * as signalR from '@microsoft/signalr';

// Create mock connection and builder
const mockConnection = {
  start: jest.fn(),
  stop: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  state: 'Disconnected',
};

const mockBuilder = {
  withUrl: jest.fn().mockReturnThis(),
  withAutomaticReconnect: jest.fn().mockReturnThis(),
  configureLogging: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockConnection),
};

// Mock @microsoft/signalr
jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn(() => mockBuilder),
  LogLevel: {
    Information: 2,
  },
}));

describe('SignalRService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should create connection with correct URL', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      mockConnection.state = 'Connected';

      const result = await signalRService.connect();

      expect(signalR.HubConnectionBuilder).toHaveBeenCalled();
      expect(mockBuilder.withUrl).toHaveBeenCalledWith(
        'http://localhost:5284/notificationsHub',
        { withCredentials: false }
      );
      expect(mockBuilder.withAutomaticReconnect).toHaveBeenCalledWith([0, 2000, 10000, 30000]);
      expect(mockConnection.start).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockConnection.start.mockRejectedValue(new Error('Connection failed'));

      const result = await signalRService.connect();

      expect(result).toBe(false);
    });

    it('should set up connection event handlers', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      mockConnection.state = 'Connected';

      await signalRService.connect();

      expect(mockConnection.on).toHaveBeenCalledWith('connectionStatus', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should stop connection if it exists', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      mockConnection.state = 'Connected';
      
      await signalRService.connect();
      await signalRService.disconnect();

      expect(mockConnection.stop).toHaveBeenCalled();
    });

    it('should handle missing connection gracefully', async () => {
      await expect(signalRService.disconnect()).resolves.not.toThrow();
    });
  });

  describe('onSensorDataUpdate', () => {
    it('should subscribe to SensorDataUpdate events when connected', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      mockConnection.state = 'Connected';
      
      await signalRService.connect();

      const callback = jest.fn();
      const unsubscribe = signalRService.onSensorDataUpdate(callback);

      expect(mockConnection.on).toHaveBeenCalledWith('SensorDataUpdate', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return no-op function when not connected', () => {
      const callback = jest.fn();
      const unsubscribe = signalRService.onSensorDataUpdate(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe(); // Should not throw
    });
  });

  describe('onMetricsUpdate', () => {
    it('should subscribe to MetricsUpdate events when connected', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      mockConnection.state = 'Connected';
      
      await signalRService.connect();

      const callback = jest.fn();
      const unsubscribe = signalRService.onMetricsUpdate(callback);

      expect(mockConnection.on).toHaveBeenCalledWith('MetricsUpdate', callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('onNotification', () => {
    it('should subscribe to notification events when connected', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      mockConnection.state = 'Connected';
      
      await signalRService.connect();

      const callback = jest.fn();
      const unsubscribe = signalRService.onNotification(callback);

      expect(mockConnection.on).toHaveBeenCalledWith('notification', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle subscription when connection is not available', () => {
      const callback = jest.fn();
      const unsubscribe = signalRService.onNotification(callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status', () => {
      const status = signalRService.getConnectionStatus();

      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('reconnectAttempts');
      expect(typeof status.isConnected).toBe('boolean');
      expect(typeof status.reconnectAttempts).toBe('number');
    });

    it('should reflect connection state', async () => {
      mockConnection.start.mockResolvedValue(undefined);
      mockConnection.state = 'Connected';
      
      await signalRService.connect();

      const status = signalRService.getConnectionStatus();
      expect(status.isConnected).toBe(true);
    });
  });
});

