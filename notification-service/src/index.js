import express from 'express';
import { connectToRabbitMQ } from './rabbitmq.js';
import { connectToSignalR } from './signalr.js';
import { analyzeSensorData } from './notificationEngine.js';
import { register, messagesProcessed, notificationsSent, notificationsFailed, rabbitmqMessagesConsumed, notificationProcessingDuration, signalrSendDuration } from './metrics.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

app.listen(PORT, () => {
  console.log(`Notification Service listening on port ${PORT}`);
});

async function initialize() {
  try {
    const signalRConnection = await connectToSignalR();
    if (!signalRConnection) {
      console.error('Failed to connect to SignalR Hub');
      process.exit(1);
    }

    await connectToRabbitMQ(async (sensorDataArray) => {
      const sensorDataList = Array.isArray(sensorDataArray) ? sensorDataArray : [sensorDataArray];
      rabbitmqMessagesConsumed.inc(sensorDataList.length);
      
      for (const sensorData of sensorDataList) {
        const processStart = Date.now();
        messagesProcessed.inc();
        
        const notifications = analyzeSensorData(sensorData);
        
        for (const notification of notifications) {
          if (signalRConnection.state === 'Connected') {
            const sendStart = Date.now();
            try {
              await signalRConnection.invoke('SendNotification', notification.message, notification.type);
              const sendDuration = (Date.now() - sendStart) / 1000;
              signalrSendDuration.observe(sendDuration);
              notificationsSent.inc({ type: notification.type });
            } catch (error) {
              const sendDuration = (Date.now() - sendStart) / 1000;
              signalrSendDuration.observe(sendDuration);
              notificationsFailed.inc({ type: notification.type });
              console.error('Error sending notification via SignalR:', error);
            }
          } else {
            // SignalR not connected, notification skipped
            notificationsFailed.inc({ type: notification.type });
          }
        }
        
        const processDuration = (Date.now() - processStart) / 1000;
        notificationProcessingDuration.observe(processDuration);
      }
    });
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

