import express from 'express';
import { connectToRabbitMQ } from './rabbitmq.js';
import { connectToSignalR } from './signalr.js';
import { analyzeSensorData } from './notificationEngine.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

app.listen(PORT, () => {
  console.log(`Notification Service listening on port ${PORT}`);
});

// Initialize services
async function initialize() {
  try {
    console.log('Initializing Notification Service...');

    // Connect to SignalR Hub
    const signalRConnection = await connectToSignalR();
    if (!signalRConnection) {
      console.error('Failed to connect to SignalR Hub');
      process.exit(1);
    }

    // Connect to RabbitMQ and start consuming messages
    await connectToRabbitMQ(async (sensorDataArray) => {
      // sensorDataArray can be a single object or an array
      const sensorDataList = Array.isArray(sensorDataArray) ? sensorDataArray : [sensorDataArray];
      
      // Process each sensor reading
      for (const sensorData of sensorDataList) {
        // Analyze sensor data and generate notifications
        const notifications = analyzeSensorData(sensorData);
        
        // Send notifications via SignalR
        for (const notification of notifications) {
          if (signalRConnection.state === 'Connected') {
            try {
              await signalRConnection.invoke('SendNotification', notification.message, notification.type);
              console.log(`Notification sent: ${notification.type} - ${notification.message}`);
            } catch (error) {
              console.error('Error sending notification via SignalR:', error);
            }
          } else {
            console.warn('SignalR not connected, notification queued:', notification);
          }
        }
      }
    });

    console.log('Notification Service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Notification Service:', error);
    process.exit(1);
  }
}

// Start the service
initialize();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

