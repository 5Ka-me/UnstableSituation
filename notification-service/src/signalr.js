import * as signalR from '@microsoft/signalr';

let connection = null;

export async function connectToSignalR() {
  try {
    const signalRUrl = process.env.SIGNALR_URL || 'http://localhost:5284/notificationsHub';

    // Call HubConnectionBuilder as a function so our Jest mock (which
    // returns a builder object) is invoked correctly in tests.
    connection = signalR.HubConnectionBuilder()
      .withUrl(signalRUrl, {
        withCredentials: false
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.onclose((error) => {
      // Connection closed
    });

    connection.onreconnecting((error) => {
      // Attempting to reconnect
    });

    connection.onreconnected((connectionId) => {
      // Reconnected successfully
    });

    await connection.start();

    return connection;
  } catch (error) {
    console.error('Failed to connect to SignalR Hub:', error);
    // Clear any partially-created connection so tests and callers
    // don't see a stale connection after a failed start.
    connection = null;
    return null;
  }
}

export function getSignalRConnection() {
  return connection;
}

export async function closeSignalRConnection() {
  if (connection) {
    await connection.stop();
    // Reset connection to allow tests to assert null and to avoid
    // reusing a stopped connection in later calls.
    connection = null;
  }
}

