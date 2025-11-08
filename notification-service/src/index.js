import express from 'express';
import { connectToRabbitMQ } from './rabbitmq.js';
import { connectToSignalR } from './signalr.js';
import { analyzeSensorData } from './notificationEngine.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

app.listen(PORT, () => {
  console.log(`Notification Service listening on port ${PORT}`);
});

async function initialize() {
  try {
    console.log('Initializing Notification Service...');

    const signalRConnection = await connectToSignalR();
    if (!signalRConnection) {
      console.error('Failed to connect to SignalR Hub');
      process.exit(1);
    }

    await connectToRabbitMQ(async (sensorDataArray) => {
      const sensorDataList = Array.isArray(sensorDataArray) ? sensorDataArray : [sensorDataArray];
      
      for (const sensorData of sensorDataList) {
        const notifications = analyzeSensorData(sensorData);
        
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

initialize();

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

