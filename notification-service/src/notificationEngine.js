const THRESHOLDS = {
  CO2_WARNING: 800,
  CO2_CRITICAL: 1000,
  PM25_WARNING: 35,
  PM25_CRITICAL: 50,
  ENERGY_WARNING: 800,
  ENERGY_CRITICAL: 1000,
  HUMIDITY_LOW: 30,
  HUMIDITY_HIGH: 70,
};

export function analyzeSensorData(sensorData) {
  const notifications = [];

  if (!sensorData || !sensorData.type || !sensorData.payload) {
    return notifications;
  }

  const { type, name, payload } = sensorData;

  try {
    switch (type) {
      case 'air_quality':
        notifications.push(...analyzeAirQuality(name, payload));
        break;
      case 'energy':
        notifications.push(...analyzeEnergy(name, payload));
        break;
      case 'motion':
        notifications.push(...analyzeMotion(name, payload));
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Error analyzing sensor data for ${type}:`, error);
  }

  return notifications;
}

function analyzeAirQuality(sensorName, payload) {
  const notifications = [];

  if (payload.co2 !== undefined) {
    const co2 = Number(payload.co2);
    if (co2 >= THRESHOLDS.CO2_CRITICAL) {
      notifications.push({
        message: `Critical CO2 level detected in ${sensorName}: ${co2} ppm (Critical threshold: ${THRESHOLDS.CO2_CRITICAL} ppm)`,
        type: 'error'
      });
    } else if (co2 >= THRESHOLDS.CO2_WARNING) {
      notifications.push({
        message: `High CO2 level detected in ${sensorName}: ${co2} ppm (Warning threshold: ${THRESHOLDS.CO2_WARNING} ppm)`,
        type: 'warning'
      });
    }
  }

  if (payload.pm25 !== undefined) {
    const pm25 = Number(payload.pm25);
    if (pm25 >= THRESHOLDS.PM25_CRITICAL) {
      notifications.push({
        message: `Critical PM2.5 level detected in ${sensorName}: ${pm25} µg/m³ (Critical threshold: ${THRESHOLDS.PM25_CRITICAL} µg/m³)`,
        type: 'error'
      });
    } else if (pm25 >= THRESHOLDS.PM25_WARNING) {
      notifications.push({
        message: `High PM2.5 level detected in ${sensorName}: ${pm25} µg/m³ (Warning threshold: ${THRESHOLDS.PM25_WARNING} µg/m³)`,
        type: 'warning'
      });
    }
  }

  if (payload.humidity !== undefined) {
    const humidity = Number(payload.humidity);
    if (humidity < THRESHOLDS.HUMIDITY_LOW) {
      notifications.push({
        message: `Low humidity detected in ${sensorName}: ${humidity}% (Below ${THRESHOLDS.HUMIDITY_LOW}%)`,
        type: 'warning'
      });
    } else if (humidity > THRESHOLDS.HUMIDITY_HIGH) {
      notifications.push({
        message: `High humidity detected in ${sensorName}: ${humidity}% (Above ${THRESHOLDS.HUMIDITY_HIGH}%)`,
        type: 'warning'
      });
    }
  }

  return notifications;
}

function analyzeEnergy(sensorName, payload) {
  const notifications = [];

  if (payload.energy !== undefined) {
    const energy = Number(payload.energy);
    if (energy >= THRESHOLDS.ENERGY_CRITICAL) {
      notifications.push({
        message: `Critical energy consumption detected in ${sensorName}: ${energy.toFixed(2)} kWh (Critical threshold: ${THRESHOLDS.ENERGY_CRITICAL} kWh)`,
        type: 'error'
      });
    } else if (energy >= THRESHOLDS.ENERGY_WARNING) {
      notifications.push({
        message: `High energy consumption detected in ${sensorName}: ${energy.toFixed(2)} kWh (Warning threshold: ${THRESHOLDS.ENERGY_WARNING} kWh)`,
        type: 'warning'
      });
    }
  }

  return notifications;
}

function analyzeMotion(sensorName, payload) {
  const notifications = [];

  const motionDetected = payload.motionDetected === true || payload.motion_detected === true;
  
  if (motionDetected) {
    notifications.push({
      message: `Motion detected in ${sensorName}`,
      type: 'info'
    });
  }

  return notifications;
}

