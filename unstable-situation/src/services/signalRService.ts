// SignalR service for real-time updates
import * as signalR from '@microsoft/signalr';

interface SignalRConnectionStatus {
  isConnected: boolean;
  reconnectAttempts: number;
}

interface SignalRServiceInterface {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  onSensorDataUpdate(callback: (data: any) => void): () => void;
  onMetricsUpdate(callback: (data: any) => void): () => void;
  onNotification(callback: (data: any) => void): () => void;
  getConnectionStatus(): SignalRConnectionStatus;
}

class SignalRService implements SignalRServiceInterface {
  private connection: signalR.HubConnection | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 2000;
  private readonly hubUrl: string = 'http://localhost:5284/notificationsHub';  // GraphQL Gateway SignalR Hub

  async connect(): Promise<boolean> {
    try {
      console.log('Connecting to SignalR hub...');
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          withCredentials: false
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.connection.onclose((error?: Error) => {
        console.log('SignalR connection closed:', error);
        this.isConnected = false;
        this.handleReconnection();
      });

      this.connection.onreconnecting((error?: Error) => {
        console.log('SignalR reconnecting:', error);
        this.isConnected = false;
      });

      this.connection.onreconnected((connectionId?: string) => {
        console.log('SignalR reconnected:', connectionId);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      // Set up event handlers for hub events
      // SignalR converts method names to camelCase, so "ConnectionStatus" becomes "connectionStatus"
      this.connection.on('connectionStatus', (status: string) => {
        console.log('SignalR connection status:', status);
        this.isConnected = status === 'Connected';
      });

      // Start connection
      await this.connection.start();
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

  async disconnect(): Promise<void> {
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
  onSensorDataUpdate(callback: (data: any) => void): () => void {
    if (!this.isConnected || !this.connection) {
      console.warn('SignalR not connected. Cannot subscribe to updates.');
      return () => {}; // Return empty function for cleanup
    }

    // Set up SignalR event handler
    this.connection.on('SensorDataUpdate', callback);

    // Return unsubscribe function
    return () => {
      if (this.connection) {
        this.connection.off('SensorDataUpdate', callback);
      }
    };
  }

  // Subscribe to metrics updates
  onMetricsUpdate(callback: (data: any) => void): () => void {
    if (!this.isConnected || !this.connection) {
      console.warn('SignalR not connected. Cannot subscribe to metrics updates.');
      return () => {}; // Return empty function for cleanup
    }

    // Set up SignalR event handler
    this.connection.on('MetricsUpdate', callback);

    // Return unsubscribe function
    return () => {
      if (this.connection) {
        this.connection.off('MetricsUpdate', callback);
      }
    };
  }

  // Subscribe to system notifications
  onNotification(callback: (data: any) => void): () => void {
    // Set up SignalR event handler
    // SignalR converts method names to camelCase, so "Notification" becomes "notification"
    if (this.connection) {
      // Remove any existing handler first to avoid duplicates
      this.connection.off('notification', callback);
      // Add the handler
      this.connection.on('notification', callback);
      console.log('Subscribed to notification events');
    } else {
      console.warn('SignalR connection not available. Handler will be set up when connection is established.');
      // Try to set up handler after connection is established
      const checkConnection = setInterval(() => {
        if (this.connection) {
          // Remove any existing handler first to avoid duplicates
          this.connection.off('notification', callback);
          // Add the handler
          this.connection.on('notification', callback);
          console.log('Subscribed to notification events (delayed)');
          clearInterval(checkConnection);
        }
      }, 500);
      
      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkConnection), 10000);
    }

    // Return unsubscribe function
    return () => {
      if (this.connection) {
        this.connection.off('notification', callback);
      }
    };
  }

  private generateMockPayload(): Record<string, any> {
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

  private handleReconnection(): void {
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
  getConnectionStatus(): SignalRConnectionStatus {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const signalRService = new SignalRService();
