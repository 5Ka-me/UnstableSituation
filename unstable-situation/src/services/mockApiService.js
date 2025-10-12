// Simplified Mock API service for sensor data
class MockApiService {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://graphql-gateway:8080'  // Docker internal network
      : 'http://localhost:5000';       // Local development
    this.mockData = [
      {
        "type": "energy",
        "name": "Office",
        "payload": { "energy": 770.79 }
      },
      {
        "type": "energy",
        "name": "Corridor",
        "payload": { "energy": 170.38 }
      },
      {
        "type": "air_quality",
        "name": "Living Room",
        "payload": { "co2": 864, "pm25": 7, "humidity": 72 }
      },
      {
        "type": "air_quality",
        "name": "Office",
        "payload": { "co2": 512, "pm25": 29, "humidity": 46 }
      },
      {
        "type": "air_quality",
        "name": "Corridor",
        "payload": { "co2": 662, "pm25": 14, "humidity": 54 }
      },
      {
        "type": "motion",
        "name": "Kitchen",
        "payload": { "motionDetected": true }
      },
      {
        "type": "motion",
        "name": "Bedroom",
        "payload": { "motionDetected": false }
      },
      {
        "type": "air_quality",
        "name": "Kitchen",
        "payload": { "co2": 756, "pm25": 26, "humidity": 20 }
      },
      {
        "type": "energy",
        "name": "Living Room",
        "payload": { "energy": 156.16 }
      },
      {
        "type": "motion",
        "name": "Living Room",
        "payload": { "motionDetected": false }
      },
      {
        "type": "energy",
        "name": "Garage",
        "payload": { "energy": 145.35 }
      },
      {
        "type": "motion",
        "name": "Garage",
        "payload": { "motionDetected": false }
      },
      {
        "type": "energy",
        "name": "Kitchen",
        "payload": { "energy": 181.32 }
      },
      {
        "type": "air_quality",
        "name": "Garage",
        "payload": { "co2": 424, "pm25": 36, "humidity": 30 }
      },
      {
        "type": "air_quality",
        "name": "Bedroom",
        "payload": { "co2": 515, "pm25": 19, "humidity": 53 }
      },
      {
        "type": "energy",
        "name": "Bedroom",
        "payload": { "energy": 498.27 }
      },
      {
        "type": "motion",
        "name": "Corridor",
        "payload": { "motionDetected": false }
      },
      {
        "type": "motion",
        "name": "Office",
        "payload": { "motionDetected": true }
      }
    ];
  }

  // Mock GraphQL query for sensor readings
  async getSensorReadings(limit = 50, offset = 0) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const readings = this.mockData.map((data, index) => ({
      id: `reading-${index}`,
      sensorType: data.type,
      sensorName: data.name,
      payload: data.payload,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }));

    return readings.slice(offset, offset + limit);
  }

  // Mock GraphQL query for metrics
  async getMetrics() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const readingsByType = {};
    const readingsByLocation = {};
    let totalEnergy = 0;
    let energyCount = 0;
    let totalCO2 = 0;
    let co2Count = 0;
    let totalHumidity = 0;
    let humidityCount = 0;
    let motionDetectedCount = 0;

    this.mockData.forEach(data => {
      readingsByType[data.type] = (readingsByType[data.type] || 0) + 1;
      readingsByLocation[data.name] = (readingsByLocation[data.name] || 0) + 1;

      if (data.type === 'energy' && data.payload.energy) {
        totalEnergy += data.payload.energy;
        energyCount++;
      }
      if (data.type === 'air_quality' && data.payload.co2) {
        totalCO2 += data.payload.co2;
        co2Count++;
      }
      if (data.type === 'air_quality' && data.payload.humidity) {
        totalHumidity += data.payload.humidity;
        humidityCount++;
      }
      if (data.type === 'motion' && data.payload.motionDetected) {
        motionDetectedCount++;
      }
    });

    return {
      totalReadings: this.mockData.length,
      readingsByType,
      readingsByLocation,
      averageEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
      averageCO2: co2Count > 0 ? totalCO2 / co2Count : 0,
      averageHumidity: humidityCount > 0 ? totalHumidity / humidityCount : 0,
      motionDetectedCount,
      lastUpdated: new Date().toISOString()
    };
  }

  // Mock GraphQL query for aggregated data
  async getAggregatedData(timeRange = '24h') {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Generate mock time series data
    const now = new Date();
    const dataPoints = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      dataPoints.push({
        timestamp: timestamp.toISOString(),
        energy: Math.random() * 1000 + 100,
        co2: Math.random() * 500 + 400,
        humidity: Math.random() * 50 + 30,
        motionDetected: Math.random() > 0.7
      });
    }
    
    return dataPoints;
  }
}

export const mockApiService = new MockApiService();