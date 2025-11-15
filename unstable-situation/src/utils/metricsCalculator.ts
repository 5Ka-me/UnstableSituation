import { SensorReading, SensorMetrics, AggregatedDataPoint, TimeRange } from '../types';

/**
 * Вычисляет метрики из массива показаний сенсоров
 */
export function calculateMetricsFromReadings(readings: SensorReading[]): SensorMetrics {
  let totalEnergy = 0;
  let energyCount = 0;
  let totalCO2 = 0;
  let co2Count = 0;
  let totalHumidity = 0;
  let humidityCount = 0;
  let motionDetectedCount = 0;

  readings.forEach(reading => {
    const payload = reading.payload;

    if (reading.sensorType === 'energy' && payload?.energy != null) {
      const energy = typeof payload.energy === 'number' ? payload.energy : parseFloat(payload.energy);
      if (!isNaN(energy)) {
        totalEnergy += energy;
        energyCount++;
      }
    }

    if (reading.sensorType === 'air_quality') {
      if (payload?.co2 != null) {
        const co2 = typeof payload.co2 === 'number' ? payload.co2 : parseInt(payload.co2);
        if (!isNaN(co2)) {
          totalCO2 += co2;
          co2Count++;
        }
      }
      if (payload?.humidity != null) {
        const humidity = typeof payload.humidity === 'number' ? payload.humidity : parseInt(payload.humidity);
        if (!isNaN(humidity)) {
          totalHumidity += humidity;
          humidityCount++;
        }
      }
    }

    if (reading.sensorType === 'motion') {
      // Проверяем оба варианта названия поля
      if (payload?.motion_detected === true || payload?.motionDetected === true) {
        motionDetectedCount++;
      }
    }
  });

  return {
    totalReadings: readings.length,
    averageEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
    averageCO2: co2Count > 0 ? totalCO2 / co2Count : 0,
    averageHumidity: humidityCount > 0 ? totalHumidity / humidityCount : 0,
    motionDetectedCount,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Агрегирует данные из показаний сенсоров по временным интервалам
 */
export function aggregateReadingsByTime(
  readings: SensorReading[], 
  timeRange: TimeRange = '5m'
): AggregatedDataPoint[] {
  if (readings.length === 0) return [];

  // Определяем размер интервала и временной диапазон
  const getIntervalMs = (range: TimeRange): number => {
    switch (range) {
      case '30s': return 1 * 1000;        // По секунде для 30 секунд
      case '1m': return 1 * 1000;          // По секунде для 1 минуты
      case '5m': return 5 * 1000;         // По 5 секунд для 5 минут
      case '15m': return 60 * 1000;       // По минуте для 15 минут
      case '30m': return 60 * 1000;       // По минуте для 30 минут
      case '1h': return 60 * 1000;        // По минуте для 1 часа
      case '6h': return 5 * 60 * 1000;    // По 5 минут для 6 часов
      case '24h': return 15 * 60 * 1000;  // По 15 минут для 24 часов
      case '7d': return 60 * 60 * 1000;   // По часу для 7 дней
      case '30d': return 6 * 60 * 60 * 1000; // По 6 часов для 30 дней
      default: return 5 * 60 * 1000;
    }
  };

  const getRangeMs = (range: TimeRange): number => {
    switch (range) {
      case '30s': return 30 * 1000;
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      case '30m': return 30 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 5 * 60 * 1000;
    }
  };

  const intervalMs = getIntervalMs(timeRange);
  
  // Группируем чтения по временным интервалам
  const grouped = new Map<number, SensorReading[]>();
  
  readings.forEach(reading => {
    const timestamp = new Date(reading.timestamp).getTime();
    const intervalKey = Math.floor(timestamp / intervalMs) * intervalMs;
    
    if (!grouped.has(intervalKey)) {
      grouped.set(intervalKey, []);
    }
    grouped.get(intervalKey)!.push(reading);
  });

  // Создаем точки данных только для интервалов, где есть данные
  const aggregated: AggregatedDataPoint[] = [];
  
  // Сортируем интервалы по времени
  const sortedIntervals = Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  
  sortedIntervals.forEach(([intervalKey, groupReadings]) => {
    let totalEnergy = 0;
    let energyCount = 0;
    let totalCO2 = 0;
    let co2Count = 0;
    let totalPM25 = 0;
    let pm25Count = 0;
    let totalHumidity = 0;
    let humidityCount = 0;
    let motionDetected = 0;
    
    groupReadings.forEach(reading => {
        const payload = reading.payload;

        if (reading.sensorType === 'energy' && payload?.energy != null) {
          const energy = typeof payload.energy === 'number' ? payload.energy : parseFloat(payload.energy);
          if (!isNaN(energy)) {
            totalEnergy += energy;
            energyCount++;
          }
        }

        if (reading.sensorType === 'air_quality') {
          if (payload?.co2 != null) {
            const co2 = typeof payload.co2 === 'number' ? payload.co2 : parseInt(payload.co2);
            if (!isNaN(co2)) {
              totalCO2 += co2;
              co2Count++;
            }
          }
          if (payload?.pm25 != null) {
            const pm25 = typeof payload.pm25 === 'number' ? payload.pm25 : parseInt(payload.pm25);
            if (!isNaN(pm25)) {
              totalPM25 += pm25;
              pm25Count++;
            }
          }
          if (payload?.humidity != null) {
            const humidity = typeof payload.humidity === 'number' ? payload.humidity : parseInt(payload.humidity);
            if (!isNaN(humidity)) {
              totalHumidity += humidity;
              humidityCount++;
            }
          }
        }

        if (reading.sensorType === 'motion') {
          // Проверяем оба варианта названия поля
          if (payload?.motion_detected === true || payload?.motionDetected === true) {
            motionDetected++;
          }
        }
      });

    aggregated.push({
      timestamp: new Date(intervalKey).toISOString(),
      energy: energyCount > 0 ? totalEnergy / energyCount : 0,
      co2: co2Count > 0 ? totalCO2 / co2Count : 0,
      pm25: pm25Count > 0 ? totalPM25 / pm25Count : 0,
      humidity: humidityCount > 0 ? totalHumidity / humidityCount : 0,
      motionDetected
    });
  });

  return aggregated;
}

