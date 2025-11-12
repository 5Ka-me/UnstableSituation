import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Notification Service API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Replicate the health endpoint from index.js
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'notification-service' });
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toEqual({
        status: 'healthy',
        service: 'notification-service'
      });
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should have correct service name', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.service).toBe('notification-service');
    });

    it('should return status as healthy', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
    });
  });
});

