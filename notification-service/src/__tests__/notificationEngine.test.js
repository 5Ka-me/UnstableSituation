import { describe, it, expect } from '@jest/globals';
import { analyzeSensorData } from '../notificationEngine.js';

describe('NotificationEngine', () => {
  describe('analyzeSensorData', () => {
    it('should return empty array for invalid sensor data', () => {
      expect(analyzeSensorData(null)).toEqual([]);
      expect(analyzeSensorData(undefined)).toEqual([]);
      expect(analyzeSensorData({})).toEqual([]);
      expect(analyzeSensorData({ type: 'energy' })).toEqual([]);
      expect(analyzeSensorData({ payload: {} })).toEqual([]);
    });

    it('should return empty array for unknown sensor type', () => {
      const sensorData = {
        type: 'unknown',
        name: 'Sensor1',
        payload: { value: 100 }
      };
      expect(analyzeSensorData(sensorData)).toEqual([]);
    });
  });

  describe('Air Quality Analysis', () => {
    it('should generate critical CO2 notification', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { co2: 1200 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toContain('Critical CO2 level');
      expect(notifications[0].message).toContain('1200');
    });

    it('should generate warning CO2 notification', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { co2: 850 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toContain('High CO2 level');
      expect(notifications[0].message).toContain('850');
    });

    it('should not generate notification for normal CO2 level', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { co2: 400 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(0);
    });

    it('should generate critical PM2.5 notification', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { pm25: 60 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toContain('Critical PM2.5 level');
      expect(notifications[0].message).toContain('60');
    });

    it('should generate warning PM2.5 notification', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { pm25: 40 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toContain('High PM2.5 level');
    });

    it('should generate low humidity notification', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { humidity: 25 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toContain('Low humidity');
      expect(notifications[0].message).toContain('25');
    });

    it('should generate high humidity notification', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { humidity: 80 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toContain('High humidity');
      expect(notifications[0].message).toContain('80');
    });

    it('should generate multiple notifications for air quality', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { 
          co2: 1200,
          pm25: 60,
          humidity: 25
        }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications.length).toBeGreaterThanOrEqual(3);
      expect(notifications.some(n => n.message.includes('CO2'))).toBe(true);
      expect(notifications.some(n => n.message.includes('PM2.5'))).toBe(true);
      expect(notifications.some(n => n.message.includes('humidity'))).toBe(true);
    });
  });

  describe('Energy Analysis', () => {
    it('should generate critical energy notification', () => {
      const sensorData = {
        type: 'energy',
        name: 'EnergySensor1',
        payload: { energy: 1200 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toContain('Critical energy consumption');
      expect(notifications[0].message).toContain('1200');
    });

    it('should generate warning energy notification', () => {
      const sensorData = {
        type: 'energy',
        name: 'EnergySensor1',
        payload: { energy: 850 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toContain('High energy consumption');
    });

    it('should not generate notification for normal energy consumption', () => {
      const sensorData = {
        type: 'energy',
        name: 'EnergySensor1',
        payload: { energy: 500 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(0);
    });

    it('should format energy value correctly', () => {
      const sensorData = {
        type: 'energy',
        name: 'EnergySensor1',
        payload: { energy: 1234.567 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications[0].message).toContain('1234.57');
    });
  });

  describe('Motion Analysis', () => {
    it('should generate notification when motion is detected (motionDetected)', () => {
      const sensorData = {
        type: 'motion',
        name: 'MotionSensor1',
        payload: { motionDetected: true }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toContain('Motion detected');
      expect(notifications[0].message).toContain('MotionSensor1');
    });

    it('should generate notification when motion is detected (motion_detected)', () => {
      const sensorData = {
        type: 'motion',
        name: 'MotionSensor1',
        payload: { motion_detected: true }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toContain('Motion detected');
    });

    it('should not generate notification when motion is not detected', () => {
      const sensorData = {
        type: 'motion',
        name: 'MotionSensor1',
        payload: { motionDetected: false }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(0);
    });

    it('should handle motion detection with both field names', () => {
      const sensorData = {
        type: 'motion',
        name: 'MotionSensor1',
        payload: { motionDetected: true, motion_detected: false }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle string numbers in payload', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: { co2: '1200' }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
    });

    it('should handle missing payload values gracefully', () => {
      const sensorData = {
        type: 'air_quality',
        name: 'AirSensor1',
        payload: {}
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications).toHaveLength(0);
    });

    it('should include sensor name in notification message', () => {
      const sensorData = {
        type: 'energy',
        name: 'CustomSensorName',
        payload: { energy: 1200 }
      };
      const notifications = analyzeSensorData(sensorData);
      
      expect(notifications[0].message).toContain('CustomSensorName');
    });
  });
});

