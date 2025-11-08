import * as signalR from '@microsoft/signalr';

let connection = null;

export async function connectToSignalR() {
  try {
    const signalRUrl = process.env.SIGNALR_URL || 'http://localhost:5284/notificationsHub';
    
    console.log(`Connecting to SignalR Hub at ${signalRUrl}...`);

    connection = new signalR.HubConnectionBuilder()
      .withUrl(signalRUrl, {
        withCredentials: false
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Connection event handlers
    connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
    });

    connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
    });

    // Start connection
    await connection.start();
    console.log('Connected to SignalR Hub successfully');

    return connection;
  } catch (error) {
    console.error('Failed to connect to SignalR Hub:', error);
    return null;
  }
}

export function getSignalRConnection() {
  return connection;
}

export async function closeSignalRConnection() {
  if (connection) {
    await connection.stop();
  }
}

