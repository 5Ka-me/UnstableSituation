import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

// Counters
const messagesProcessed = new Counter({
  name: 'notificationservice_messages_processed_total',
  help: 'Total number of messages processed',
  registers: [register]
});

const notificationsSent = new Counter({
  name: 'notificationservice_notifications_sent_total',
  help: 'Total number of notifications sent via SignalR',
  labelNames: ['type'],
  registers: [register]
});

const notificationsFailed = new Counter({
  name: 'notificationservice_notifications_failed_total',
  help: 'Total number of failed notifications',
  labelNames: ['type'],
  registers: [register]
});

const rabbitmqMessagesConsumed = new Counter({
  name: 'notificationservice_rabbitmq_messages_consumed_total',
  help: 'Total number of messages consumed from RabbitMQ',
  registers: [register]
});

// Histograms
const notificationProcessingDuration = new Histogram({
  name: 'notificationservice_processing_duration_seconds',
  help: 'Duration of notification processing in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

const signalrSendDuration = new Histogram({
  name: 'notificationservice_signalr_send_duration_seconds',
  help: 'Duration of SignalR send operations in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register]
});

export {
  register,
  messagesProcessed,
  notificationsSent,
  notificationsFailed,
  rabbitmqMessagesConsumed,
  notificationProcessingDuration,
  signalrSendDuration
};

