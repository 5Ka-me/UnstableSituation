using Microsoft.EntityFrameworkCore;
using GraphQLGateway.Data;
using GraphQLGateway.Models;
using GraphQLGateway.Types;
using System.Text.Json;

namespace GraphQLGateway.Queries;

public class SensorQueries
{
    public async Task<List<SensorReadingType>> GetSensorReadings(
        SensorDbContext context,
        int limit = 50,
        int offset = 0)
    {
        var readings = await context.SensorReadings
            .OrderByDescending(r => r.Timestamp)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return readings.Select(r => new SensorReadingType
        {
            Id = r.Id,
            SensorType = r.SensorType,
            SensorName = r.SensorName,
            Payload = r.Payload,
            Timestamp = r.Timestamp,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<SensorReadingType?> GetSensorReadingById(
        Guid id, 
        SensorDbContext context)
    {
        var reading = await context.SensorReadings.FindAsync(id);
        if (reading == null) return null;

        return new SensorReadingType
        {
            Id = reading.Id,
            SensorType = reading.SensorType,
            SensorName = reading.SensorName,
            Payload = reading.Payload,
            Timestamp = reading.Timestamp,
            CreatedAt = reading.CreatedAt
        };
    }

    public async Task<List<SensorReadingType>> GetSensorReadingsByType(
        string sensorType,
        SensorDbContext context,
        int limit = 50)
    {
        var readings = await context.SensorReadings
            .Where(r => r.SensorType == sensorType)
            .OrderByDescending(r => r.Timestamp)
            .Take(limit)
            .ToListAsync();

        return readings.Select(r => new SensorReadingType
        {
            Id = r.Id,
            SensorType = r.SensorType,
            SensorName = r.SensorName,
            Payload = r.Payload,
            Timestamp = r.Timestamp,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<List<SensorReadingType>> GetSensorReadingsByLocation(
        string sensorName,
        SensorDbContext context,
        int limit = 50)
    {
        var readings = await context.SensorReadings
            .Where(r => r.SensorName == sensorName)
            .OrderByDescending(r => r.Timestamp)
            .Take(limit)
            .ToListAsync();

        return readings.Select(r => new SensorReadingType
        {
            Id = r.Id,
            SensorType = r.SensorType,
            SensorName = r.SensorName,
            Payload = r.Payload,
            Timestamp = r.Timestamp,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<SensorMetricsType> GetSensorMetrics(SensorDbContext context)
    {
        var totalReadings = await context.SensorReadings.CountAsync();

        // Calculate average energy
        var energyReadings = await context.SensorReadings
            .Where(r => r.SensorType == "energy")
            .ToListAsync();

        var averageEnergy = 0.0;
        if (energyReadings.Any())
        {
            var totalEnergy = 0.0;
            var validEnergyCount = 0;
            
            foreach (var reading in energyReadings)
            {
                try
                {
                    var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                    if (payload.ContainsKey("energy") && payload["energy"] is JsonElement energyElement)
                    {
                        if (energyElement.TryGetDouble(out var energy))
                        {
                            totalEnergy += energy;
                            validEnergyCount++;
                        }
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }
            }
            
            averageEnergy = validEnergyCount > 0 ? totalEnergy / validEnergyCount : 0.0;
        }

        // Calculate average CO2
        var co2Readings = await context.SensorReadings
            .Where(r => r.SensorType == "air_quality")
            .ToListAsync();

        var averageCO2 = 0;
        if (co2Readings.Any())
        {
            var totalCO2 = 0;
            var validCO2Count = 0;
            
            foreach (var reading in co2Readings)
            {
                try
                {
                    var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                    if (payload.ContainsKey("co2") && payload["co2"] is JsonElement co2Element)
                    {
                        if (co2Element.TryGetInt32(out var co2))
                        {
                            totalCO2 += co2;
                            validCO2Count++;
                        }
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }
            }
            
            averageCO2 = validCO2Count > 0 ? totalCO2 / validCO2Count : 0;
        }

        // Calculate average humidity
        var humidityReadings = await context.SensorReadings
            .Where(r => r.SensorType == "air_quality")
            .ToListAsync();

        var averageHumidity = 0;
        if (humidityReadings.Any())
        {
            var totalHumidity = 0;
            var validHumidityCount = 0;
            
            foreach (var reading in humidityReadings)
            {
                try
                {
                    var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                    if (payload.ContainsKey("humidity") && payload["humidity"] is JsonElement humidityElement)
                    {
                        if (humidityElement.TryGetInt32(out var humidity))
                        {
                            totalHumidity += humidity;
                            validHumidityCount++;
                        }
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }
            }
            
            averageHumidity = validHumidityCount > 0 ? totalHumidity / validHumidityCount : 0;
        }

        // Count motion detected
        var motionDetectedCount = await context.SensorReadings
            .Where(r => r.SensorType == "motion")
            .ToListAsync();

        var motionCount = 0;
        foreach (var reading in motionDetectedCount)
        {
            try
            {
                var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                if (payload.ContainsKey("motionDetected") && payload["motionDetected"] is JsonElement motionElement)
                {
                    if (motionElement.GetBoolean())
                    {
                        motionCount++;
                    }
                }
            }
            catch
            {
                // Skip invalid JSON
            }
        }

        return new SensorMetricsType
        {
            TotalReadings = totalReadings,
            AverageEnergy = Math.Round(averageEnergy, 2),
            AverageCO2 = averageCO2,
            AverageHumidity = averageHumidity,
            MotionDetectedCount = motionCount,
            LastUpdated = DateTime.UtcNow
        };
    }

    public async Task<List<SensorDataPointType>> GetAggregatedData(
        SensorDbContext context,
        string timeRange = "24h")
    {
        var now = DateTime.UtcNow;
        var startTime = timeRange switch
        {
            "1h" => now.AddHours(-1),
            "24h" => now.AddHours(-24),
            "7d" => now.AddDays(-7),
            "30d" => now.AddDays(-30),
            _ => now.AddHours(-24)
        };

        var readings = await context.SensorReadings
            .Where(r => r.Timestamp >= startTime)
            .OrderBy(r => r.Timestamp)
            .ToListAsync();

        // Group readings by hour for aggregation
        var groupedReadings = readings
            .GroupBy(r => new DateTime(r.Timestamp.Year, r.Timestamp.Month, r.Timestamp.Day, r.Timestamp.Hour, 0, 0))
            .OrderBy(g => g.Key)
            .Take(20) // Limit to 20 data points
            .ToList();

        var dataPoints = new List<SensorDataPointType>();

        foreach (var group in groupedReadings)
        {
            var energyValues = new List<double>();
            var co2Values = new List<int>();
            var humidityValues = new List<int>();

            foreach (var reading in group)
            {
                try
                {
                    var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                    
                    if (reading.SensorType == "energy" && payload.ContainsKey("energy"))
                    {
                        if (payload["energy"] is JsonElement energyElement && energyElement.TryGetDouble(out var energy))
                        {
                            energyValues.Add(energy);
                        }
                    }
                    else if (reading.SensorType == "air_quality")
                    {
                        if (payload.ContainsKey("co2") && payload["co2"] is JsonElement co2Element && co2Element.TryGetInt32(out var co2))
                        {
                            co2Values.Add(co2);
                        }
                        if (payload.ContainsKey("humidity") && payload["humidity"] is JsonElement humidityElement && humidityElement.TryGetInt32(out var humidity))
                        {
                            humidityValues.Add(humidity);
                        }
                    }
                }
                catch
                {
                    // Skip invalid JSON
                }
            }

            dataPoints.Add(new SensorDataPointType
            {
                Timestamp = group.Key,
                Energy = energyValues.Any() ? energyValues.Average() : 0,
                CO2 = co2Values.Any() ? (int)co2Values.Average() : 0,
                Humidity = humidityValues.Any() ? (int)humidityValues.Average() : 0
            });
        }

        return dataPoints;
    }

    public async Task<List<ProcessingStatsType>> GetProcessingStats(SensorDbContext context)
    {
        var stats = await context.ProcessingStats
            .OrderByDescending(s => s.CreatedAt)
            .Take(10)
            .ToListAsync();

        return stats.Select(s => new ProcessingStatsType
        {
            Id = s.Id,
            ProcessedMessages = s.ProcessedMessages,
            FailedMessages = s.FailedMessages,
            LastProcessedAt = s.LastProcessedAt,
            ProcessingRatePerSecond = s.ProcessingRatePerSecond,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        }).ToList();
    }
}