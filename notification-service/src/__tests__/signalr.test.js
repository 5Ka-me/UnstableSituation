import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Prepare mocks for ESM module using unstable_mockModule and dynamic imports
const mockHubConnection = {
  start: jest.fn(),
  stop: jest.fn(),
  onclose: jest.fn(),
  onreconnecting: jest.fn(),
  onreconnected: jest.fn(),
  invoke: jest.fn(),
  state: 'Connected'
};

const mockHubConnectionBuilder = {
  withUrl: jest.fn().mockReturnThis(),
  withAutomaticReconnect: jest.fn().mockReturnThis(),
  configureLogging: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockHubConnection)
};

jest.unstable_mockModule('@microsoft/signalr', () => ({
  __esModule: true,
  HubConnectionBuilder: jest.fn(() => mockHubConnectionBuilder),
  LogLevel: {
    Information: 2
  }
}));

let signalR;
let connectToSignalR;
let getSignalRConnection;
let closeSignalRConnection;

describe('SignalR Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHubConnection.state = 'Connected';
    // Import mocked signalR module and the module under test after mock is registered
    return Promise.all([
      import('@microsoft/signalr').then((m) => { signalR = m; }),
      import('../signalr.js').then((m) => {
        connectToSignalR = m.connectToSignalR;
        getSignalRConnection = m.getSignalRConnection;
        closeSignalRConnection = m.closeSignalRConnection;
      })
    ]);
  });

  describe('connectToSignalR', () => {
    it('should connect to SignalR with default URL', async () => {
      mockHubConnection.start.mockResolvedValue(undefined);

      const connection = await connectToSignalR();

      expect(signalR.HubConnectionBuilder).toHaveBeenCalled();
      expect(mockHubConnectionBuilder.withUrl).toHaveBeenCalledWith(
        'http://localhost:5284/notificationsHub',
        { withCredentials: false }
      );
      expect(mockHubConnectionBuilder.withAutomaticReconnect).toHaveBeenCalledWith([0, 2000, 10000, 30000]);
      expect(mockHubConnectionBuilder.configureLogging).toHaveBeenCalledWith(signalR.LogLevel.Information);
      expect(mockHubConnection.start).toHaveBeenCalled();
      expect(connection).toBe(mockHubConnection);
    });

    it('should use environment variable for SignalR URL', async () => {
      const originalUrl = process.env.SIGNALR_URL;
      process.env.SIGNALR_URL = 'http://test:5000/hub';
      
      mockHubConnection.start.mockResolvedValue(undefined);
      
      await connectToSignalR();
      
      expect(mockHubConnectionBuilder.withUrl).toHaveBeenCalledWith(
        'http://test:5000/hub',
        { withCredentials: false }
      );
      
      process.env.SIGNALR_URL = originalUrl;
    });

    it('should set up connection event handlers', async () => {
      mockHubConnection.start.mockResolvedValue(undefined);
      
      await connectToSignalR();
      
      expect(mockHubConnection.onclose).toHaveBeenCalled();
      expect(mockHubConnection.onreconnecting).toHaveBeenCalled();
      expect(mockHubConnection.onreconnected).toHaveBeenCalled();
    });

    it('should return null on connection failure', async () => {
      mockHubConnection.start.mockRejectedValue(new Error('Connection failed'));
      
      const connection = await connectToSignalR();
      
      expect(connection).toBeNull();
    });

    it('should configure automatic reconnect', async () => {
      mockHubConnection.start.mockResolvedValue(undefined);
      
      await connectToSignalR();
      
      expect(mockHubConnectionBuilder.withAutomaticReconnect).toHaveBeenCalledWith([0, 2000, 10000, 30000]);
    });

    it('should configure logging level', async () => {
      mockHubConnection.start.mockResolvedValue(undefined);
      
      await connectToSignalR();
      
      expect(mockHubConnectionBuilder.configureLogging).toHaveBeenCalledWith(signalR.LogLevel.Information);
    });
  });

  describe('getSignalRConnection', () => {
    it('should return current connection', async () => {
      mockHubConnection.start.mockResolvedValue(undefined);
      await connectToSignalR();
      
      const connection = getSignalRConnection();
      
      expect(connection).toBe(mockHubConnection);
    });

    it('should return null if no connection exists', async () => {
      // Ensure connection is closed/reset
      await closeSignalRConnection();
      
      const connection = getSignalRConnection();
      expect(connection).toBeNull();
    });
  });

  describe('closeSignalRConnection', () => {
    it('should stop connection if it exists', async () => {
      mockHubConnection.start.mockResolvedValue(undefined);
      await connectToSignalR();
      
      mockHubConnection.stop.mockResolvedValue(undefined);
      
      await closeSignalRConnection();
      
      expect(mockHubConnection.stop).toHaveBeenCalled();
    });

    it('should handle missing connection gracefully', async () => {
      // Ensure connection is null
      await closeSignalRConnection();
      
      // Should not throw when called again
      await expect(closeSignalRConnection()).resolves.not.toThrow();
    });
  });
});

