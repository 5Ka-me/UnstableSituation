import { graphqlApiService } from '../graphqlApiService';
import apolloClient from '../apolloClient';

// Mock apolloClient
jest.mock('../apolloClient', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    cache: {
      modify: jest.fn(),
      writeQuery: jest.fn(),
      writeFragment: jest.fn(),
    },
  },
}));

describe('GraphQLApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testGraphQLConnection', () => {
    it('should return metrics on successful connection', async () => {
      const mockMetrics = {
        totalReadings: 100,
        averageEnergy: 150.5,
        averageCO2: 450,
        averageHumidity: 60,
        motionDetectedCount: 5,
        lastUpdated: new Date().toISOString(),
      };

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorMetrics: mockMetrics },
      });

      const result = await graphqlApiService.testGraphQLConnection();

      expect(result).toEqual(mockMetrics);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        fetchPolicy: 'network-only',
      });
    });

    it('should return null on connection failure', async () => {
      (apolloClient.query as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await graphqlApiService.testGraphQLConnection();

      expect(result).toBeNull();
    });
  });

  describe('getMetrics', () => {
    it('should fetch metrics with cache-first policy by default', async () => {
      const mockMetrics = {
        totalReadings: 100,
        averageEnergy: 150.5,
        averageCO2: 450,
        averageHumidity: 60,
        motionDetectedCount: 5,
        lastUpdated: new Date().toISOString(),
      };

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorMetrics: mockMetrics },
      });

      const result = await graphqlApiService.getMetrics();

      expect(result).toEqual(mockMetrics);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        fetchPolicy: 'cache-first',
      });
    });

    it('should use network-only policy when forceRefresh is true', async () => {
      const mockMetrics = {
        totalReadings: 100,
        averageEnergy: 150.5,
        averageCO2: 450,
        averageHumidity: 60,
        motionDetectedCount: 5,
        lastUpdated: new Date().toISOString(),
      };

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorMetrics: mockMetrics },
      });

      await graphqlApiService.getMetrics(true);

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        fetchPolicy: 'network-only',
      });
    });

    it('should throw error on fetch failure', async () => {
      const error = new Error('Fetch failed');
      (apolloClient.query as jest.Mock).mockRejectedValue(error);

      await expect(graphqlApiService.getMetrics()).rejects.toThrow('Fetch failed');
    });
  });

  describe('getSensorReadings', () => {
    it('should fetch sensor readings with default parameters', async () => {
      const mockReadings = [
        {
          id: '1',
          sensorType: 'energy',
          sensorName: 'Sensor1',
          payload: { energy: 100.5 },
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorReadings: mockReadings },
      });

      const result = await graphqlApiService.getSensorReadings();

      expect(result).toEqual(mockReadings);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { limit: 50, timeRange: undefined },
        fetchPolicy: 'cache-first',
      });
    });

    it('should use provided limit, offset, and timeRange', async () => {
      const mockReadings: any[] = [];
      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorReadings: mockReadings },
      });

      await graphqlApiService.getSensorReadings(20, 10, false, '5m');

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { limit: 20, timeRange: '5m' },
        fetchPolicy: 'cache-first',
      });
    });

    it('should use network-only policy when forceRefresh is true', async () => {
      const mockReadings: any[] = [];
      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorReadings: mockReadings },
      });

      await graphqlApiService.getSensorReadings(50, 0, true, '1h');

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { limit: 50, timeRange: '1h' },
        fetchPolicy: 'network-only',
      });
    });
  });

  describe('getSensorReadingsByType', () => {
    it('should fetch readings by sensor type', async () => {
      const mockReadings = [
        {
          id: '1',
          sensorType: 'energy',
          sensorName: 'Sensor1',
          payload: { energy: 100.5 },
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorReadingsByType: mockReadings },
      });

      const result = await graphqlApiService.getSensorReadingsByType('energy');

      expect(result).toEqual(mockReadings);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { sensorType: 'energy', limit: 50 },
        fetchPolicy: 'cache-first',
      });
    });
  });

  describe('getSensorReadingsByLocation', () => {
    it('should fetch readings by location with default parameters', async () => {
      const mockReadings = [
        {
          id: '1',
          sensorType: 'energy',
          sensorName: 'Office',
          payload: { energy: 100.5 },
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorReadingsByLocation: mockReadings },
      });

      const result = await graphqlApiService.getSensorReadingsByLocation('Office');

      expect(result).toEqual(mockReadings);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { sensorName: 'Office', limit: 50, timeRange: undefined },
        fetchPolicy: 'network-only',
      });
    });

    it('should use provided limit and timeRange', async () => {
      const mockReadings: any[] = [];
      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorReadingsByLocation: mockReadings },
      });

      await graphqlApiService.getSensorReadingsByLocation('Office', 100, '5m');

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { sensorName: 'Office', limit: 100, timeRange: '5m' },
        fetchPolicy: 'network-only',
      });
    });
  });

  describe('getAggregatedData', () => {
    it('should fetch aggregated data with default timeRange', async () => {
      const mockData = [
        {
          timestamp: new Date().toISOString(),
          energy: 100.5,
          CO2: 450,
          PM25: 25,
          humidity: 60,
          motionDetected: 0,
        },
      ];

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { aggregatedData: mockData },
      });

      const result = await graphqlApiService.getAggregatedData();

      expect(result).toEqual(mockData);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { timeRange: '24h' },
        fetchPolicy: 'cache-first',
      });
    });

    it('should use provided timeRange', async () => {
      const mockData: any[] = [];
      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { aggregatedData: mockData },
      });

      await graphqlApiService.getAggregatedData('1h');

      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { timeRange: '1h' },
        fetchPolicy: 'cache-first',
      });
    });
  });

  describe('getProcessingStats', () => {
    it('should fetch processing stats', async () => {
      const mockStats = {
        processedMessages: 1000,
        failedMessages: 10,
        lastProcessedAt: new Date().toISOString(),
        processingRatePerSecond: 50.5,
      };

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { processingStats: mockStats },
      });

      const result = await graphqlApiService.getProcessingStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('getSensorReadingById', () => {
    it('should fetch sensor reading by ID', async () => {
      const mockReading = {
        id: '123',
        sensorType: 'energy',
        sensorName: 'Sensor1',
        payload: { energy: 100.5 },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      (apolloClient.query as jest.Mock).mockResolvedValue({
        data: { sensorReadingById: mockReading },
      });

      const result = await graphqlApiService.getSensorReadingById('123');

      expect(result).toEqual(mockReading);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        variables: { id: '123' },
        fetchPolicy: 'cache-first',
      });
    });
  });

  describe('updateSensorReadingCache', () => {
    it('should update cache with new reading', () => {
      const newReading = {
        id: '123',
        sensorType: 'energy',
        sensorName: 'Sensor1',
        payload: { energy: 100.5 },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      (apolloClient.cache.writeFragment as jest.Mock).mockReturnValue({});

      graphqlApiService.updateSensorReadingCache(newReading);

      expect(apolloClient.cache.modify).toHaveBeenCalled();
    });
  });

  describe('updateMetricsCache', () => {
    it('should update metrics cache', () => {
      const newMetrics = {
        totalReadings: 100,
        averageEnergy: 150.5,
        averageCO2: 450,
        averageHumidity: 60,
        motionDetectedCount: 5,
        lastUpdated: new Date().toISOString(),
      };

      graphqlApiService.updateMetricsCache(newMetrics);

      expect(apolloClient.cache.writeQuery).toHaveBeenCalled();
    });
  });
});

