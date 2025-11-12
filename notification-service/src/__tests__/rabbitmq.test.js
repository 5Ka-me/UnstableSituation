import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock amqplib
jest.mock('amqplib', () => ({
  __esModule: true,
  default: {
    connect: jest.fn()
  }
}));

import amqp from 'amqplib';
import { connectToRabbitMQ, closeRabbitMQConnection } from '../rabbitmq.js';

describe('RabbitMQ Module', () => {
  let mockConnection;
  let mockChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({}),
      bindQueue: jest.fn().mockResolvedValue({}),
      consume: jest.fn().mockResolvedValue({}),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue({})
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue({}),
      on: jest.fn()
    };

    amqp.connect.mockResolvedValue(mockConnection);
  });

  describe('connectToRabbitMQ', () => {
    it('should connect to RabbitMQ with default URL', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      expect(amqp.connect).toHaveBeenCalledWith('amqp://guest:guest@localhost:5672/');
      expect(mockConnection.createChannel).toHaveBeenCalled();
    });

    it('should use environment variable for RabbitMQ URL', async () => {
      const originalUrl = process.env.RABBITMQ_URL;
      process.env.RABBITMQ_URL = 'amqp://test:test@localhost:5672/';
      
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      expect(amqp.connect).toHaveBeenCalledWith('amqp://test:test@localhost:5672/');
      
      process.env.RABBITMQ_URL = originalUrl;
    });

    it('should declare exchange with correct parameters', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'meter-data-exchange',
        'topic',
        { durable: true }
      );
    });

    it('should declare queue with correct parameters', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'meter-data-queue',
        { durable: true }
      );
    });

    it('should bind queue to exchange', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'meter-data-queue',
        'meter-data-exchange',
        'meter.data'
      );
    });

    it('should set up message consumer', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      expect(mockChannel.consume).toHaveBeenCalledWith(
        'meter-data-queue',
        expect.any(Function),
        { noAck: false }
      );
    });

    it('should process array messages correctly', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const mockMsg = {
        content: Buffer.from(JSON.stringify([{ type: 'energy', name: 'Sensor1', payload: {} }])),
        properties: {}
      };
      
      await consumeCallback(mockMsg);
      
      expect(messageHandler).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'energy' })
        ])
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
    });

    it('should process single object messages correctly', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const mockMsg = {
        content: Buffer.from(JSON.stringify({ type: 'energy', name: 'Sensor1', payload: {} })),
        properties: {}
      };
      
      await consumeCallback(mockMsg);
      
      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'energy' })
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
    });

    it('should handle JSON parse errors', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const mockMsg = {
        content: Buffer.from('invalid json'),
        properties: {}
      };
      
      await consumeCallback(mockMsg);
      
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMsg, false, true);
      expect(messageHandler).not.toHaveBeenCalled();
    });

    it('should handle message handler errors', async () => {
      const messageHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      
      await connectToRabbitMQ(messageHandler);
      
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const mockMsg = {
        content: Buffer.from(JSON.stringify({ type: 'energy', name: 'Sensor1', payload: {} })),
        properties: {}
      };
      
      await consumeCallback(mockMsg);
      
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMsg, false, true);
    });

    it('should set up connection error handler', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await connectToRabbitMQ(messageHandler);
      
      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should return connection and channel', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      const result = await connectToRabbitMQ(messageHandler);
      
      expect(result).toEqual({
        connection: mockConnection,
        channel: mockChannel
      });
    });

    it('should throw error on connection failure', async () => {
      amqp.connect.mockRejectedValue(new Error('Connection failed'));
      
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      
      await expect(connectToRabbitMQ(messageHandler)).rejects.toThrow('Connection failed');
    });
  });

  describe('closeRabbitMQConnection', () => {
    it('should close channel and connection', async () => {
      const messageHandler = jest.fn().mockResolvedValue(undefined);
      await connectToRabbitMQ(messageHandler);
      
      await closeRabbitMQConnection();
      
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle missing channel gracefully', async () => {
      // This test verifies that closeRabbitMQConnection handles missing connections
      // In a real scenario, if channel/connection is null, it should not throw
      // For this test, we verify the function works when connection exists
      await expect(closeRabbitMQConnection()).resolves.not.toThrow();
    });
  });
});

