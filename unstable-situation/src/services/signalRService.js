// SignalR service for real-time updates (Mock implementation)
class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  async connect() {
    try {
      // Mock SignalR connection for now - will be replaced with actual SignalR hub
      console.log('Connecting to SignalR hub...');
      
      // For now, we'll simulate the connection
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('SignalR connected successfully');
      return true;
    } catch (error) {
      console.error('SignalR connection failed:', error);
      this.handleReconnection();
      return false;
    }
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (error) {
        console.log('Error stopping connection:', error);
      }
    }
    this.isConnected = false;
    console.log('SignalR disconnected');
  }

  // Subscribe to sensor data updates
  onSensorDataUpdate(callback) {
    if (!this.isConnected) {
      console.warn('SignalR not connected. Cannot subscribe to updates.');
      return () => {}; // Return empty function for cleanup
    }

    // Mock real-time updates - replace with actual SignalR subscription
    const interval = setInterval(() => {
      const mockData = {
        id: `update-${Date.now()}`,
        sensorType: ['energy', 'air_quality', 'motion'][Math.floor(Math.random() * 3)],
        sensorName: ['Office', 'Living Room', 'Kitchen', 'Bedroom', 'Garage', 'Corridor'][Math.floor(Math.random() * 6)],
        payload: this.generateMockPayload(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      callback(mockData);
    }, 3000); // Update every 3 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  // Subscribe to metrics updates
  onMetricsUpdate(callback) {
    if (!this.isConnected) {
      console.warn('SignalR not connected. Cannot subscribe to metrics updates.');
      return () => {}; // Return empty function for cleanup
    }

    // Mock metrics updates
    const interval = setInterval(() => {
      const mockMetrics = {
        totalReadings: Math.floor(Math.random() * 1000) + 500,
        readingsByType: {
          energy: Math.floor(Math.random() * 100) + 50,
          air_quality: Math.floor(Math.random() * 100) + 50,
          motion: Math.floor(Math.random() * 100) + 50
        },
        readingsByLocation: {
          'Office': Math.floor(Math.random() * 50) + 20,
          'Living Room': Math.floor(Math.random() * 50) + 20,
          'Kitchen': Math.floor(Math.random() * 50) + 20,
          'Bedroom': Math.floor(Math.random() * 50) + 20,
          'Garage': Math.floor(Math.random() * 50) + 20,
          'Corridor': Math.floor(Math.random() * 50) + 20
        },
        averageEnergy: Math.random() * 500 + 200,
        averageCO2: Math.random() * 300 + 400,
        averageHumidity: Math.random() * 30 + 40,
        motionDetectedCount: Math.floor(Math.random() * 20) + 5,
        lastUpdated: new Date().toISOString()
      };
      
      callback(mockMetrics);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }

  // Subscribe to system notifications
  onNotification(callback) {
    if (!this.isConnected) {
      console.warn('SignalR not connected. Cannot subscribe to notifications.');
      return () => {}; // Return empty function for cleanup
    }

    // Mock notifications
    const notifications = [
      'High energy consumption detected in Office',
      'CO2 levels above normal in Living Room',
      'Motion detected in Kitchen',
      'System maintenance scheduled',
      'New sensor data available',
      'Alert: Air quality threshold exceeded'
    ];

    const interval = setInterval(() => {
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
      const notification = {
        id: `notification-${Date.now()}`,
        message: randomNotification,
        type: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
        timestamp: new Date().toISOString(),
        read: false
      };
      
      callback(notification);
    }, 10000); // Notification every 10 seconds

    return () => clearInterval(interval);
  }

  generateMockPayload() {
    const types = ['energy', 'air_quality', 'motion'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    switch (randomType) {
      case 'energy':
        return { energy: Math.random() * 1000 + 100 };
      case 'air_quality':
        return {
          co2: Math.random() * 500 + 400,
          pm25: Math.random() * 50 + 10,
          humidity: Math.random() * 50 + 30
        };
      case 'motion':
        return { motionDetected: Math.random() > 0.5 };
      default:
        return {};
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached. SignalR connection failed.');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const signalRService = new SignalRService();
