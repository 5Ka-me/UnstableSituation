using Microsoft.EntityFrameworkCore;
using GraphQLGateway.Data;
using GraphQLGateway.Models;
using GraphQLGateway.Types;
using System.Text.Json;
using HotChocolate;
using Npgsql;

namespace GraphQLGateway.Queries;

public class SensorQueries
{
    public async Task<List<SensorReadingType>> GetSensorReadings(
        [Service] SensorDbContext context)
    {
        try
        {
            var readings = await context.SensorReadings
                .OrderByDescending(r => r.Timestamp)
                .Take(50)
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
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetSensorReadings: {ex.Message}");
            throw;
        }
    }

    public async Task<SensorMetricsType> GetSensorMetrics([Service] SensorDbContext context)
    {
        try
        {
            var totalReadings = await context.SensorReadings.CountAsync();

            // Calculate average energy
            var energyReadings = await context.SensorReadings
                .Where(r => r.SensorType == "energy")
                .ToListAsync();

            var averageEnergy = 0.0;
            if (energyReadings.Any())
            {
                var energyValues = new List<double>();
                foreach (var reading in energyReadings)
                {
                    try
                    {
                        var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                        if (payload.ContainsKey("energy") && payload["energy"] is JsonElement energyElement && energyElement.TryGetDouble(out var energy))
                        {
                            energyValues.Add(energy);
                        }
                    }
                    catch
                    {
                        // Skip invalid readings
                    }
                }
                averageEnergy = energyValues.Any() ? energyValues.Average() : 0.0;
            }

            // Calculate average CO2
            var co2Readings = await context.SensorReadings
                .Where(r => r.SensorType == "air_quality")
                .ToListAsync();

            var averageCO2 = 0;
            if (co2Readings.Any())
            {
                var co2Values = new List<int>();
                foreach (var reading in co2Readings)
                {
                    try
                    {
                        var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                        if (payload.ContainsKey("co2") && payload["co2"] is JsonElement co2Element && co2Element.TryGetInt32(out var co2))
                        {
                            co2Values.Add(co2);
                        }
                    }
                    catch
                    {
                        // Skip invalid readings
                    }
                }
                averageCO2 = co2Values.Any() ? (int)co2Values.Average() : 0;
            }

            // Calculate average humidity
            var humidityReadings = await context.SensorReadings
                .Where(r => r.SensorType == "humidity")
                .ToListAsync();

            var averageHumidity = 0;
            if (humidityReadings.Any())
            {
                var humidityValues = new List<int>();
                foreach (var reading in humidityReadings)
                {
                    try
                    {
                        var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                        if (payload.ContainsKey("humidity") && payload["humidity"] is JsonElement humidityElement && humidityElement.TryGetInt32(out var humidity))
                        {
                            humidityValues.Add(humidity);
                        }
                    }
                    catch
                    {
                        // Skip invalid readings
                    }
                }
                averageHumidity = humidityValues.Any() ? (int)humidityValues.Average() : 0;
            }

            // Count motion detections
            var motionCount = await context.SensorReadings
                .Where(r => r.SensorType == "motion")
                .CountAsync();

            return new SensorMetricsType
            {
                TotalReadings = totalReadings,
                AverageEnergy = averageEnergy,
                AverageCO2 = averageCO2,
                AverageHumidity = averageHumidity,
                MotionDetectedCount = motionCount,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetSensorMetrics: {ex.Message}");
            throw;
        }
    }

    public async Task<List<SensorReadingType>> GetSensorReadingsByType(
        string sensorType, 
        int? limit,
        [Service] SensorDbContext context)
    {
        try
        {
            var query = context.SensorReadings
                .Where(r => r.SensorType == sensorType)
                .OrderByDescending(r => r.Timestamp);

            if (limit.HasValue)
            {
                query = (IOrderedQueryable<SensorReading>)query.Take(limit.Value);
            }

            var readings = await query.ToListAsync();

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
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetSensorReadingsByType: {ex.Message}");
            throw;
        }
    }

    public async Task<List<SensorReadingType>> GetSensorReadingsByLocation(
        string sensorName, 
        int? limit,
        [Service] SensorDbContext context)
    {
        try
        {
            var query = context.SensorReadings
                .Where(r => r.SensorName == sensorName)
                .OrderByDescending(r => r.Timestamp);

            if (limit.HasValue)
            {
                query = (IOrderedQueryable<SensorReading>)query.Take(limit.Value);
            }

            var readings = await query.ToListAsync();

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
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetSensorReadingsByLocation: {ex.Message}");
            throw;
        }
    }

    public async Task<List<SensorDataPointType>> GetAggregatedData(
        string? timeRange,
        [Service] SensorDbContext context)
    {
        try
        {
            // Определяем временной диапазон
            DateTime fromTime = timeRange switch
            {
                "1h" => DateTime.UtcNow.AddHours(-1),
                "6h" => DateTime.UtcNow.AddHours(-6),
                "12h" => DateTime.UtcNow.AddHours(-12),
                "7d" => DateTime.UtcNow.AddDays(-7),
                _ => DateTime.UtcNow.AddHours(-24) // по умолчанию 24h
            };

            var readings = await context.SensorReadings
                .Where(r => r.Timestamp >= fromTime)
                .OrderBy(r => r.Timestamp)
                .ToListAsync();

            var aggregatedData = new List<SensorDataPointType>();

            // Группируем по времени (например, по часам)
            var groupedReadings = readings
                .GroupBy(r => new DateTime(r.Timestamp.Year, r.Timestamp.Month, r.Timestamp.Day, r.Timestamp.Hour, 0, 0))
                .OrderBy(g => g.Key);

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
                        
                        if (reading.SensorType == "energy" && payload.ContainsKey("energy") && payload["energy"] is JsonElement energyElement && energyElement.TryGetDouble(out var energy))
                        {
                            energyValues.Add(energy);
                        }
                        else if (reading.SensorType == "air_quality" && payload.ContainsKey("co2") && payload["co2"] is JsonElement co2Element && co2Element.TryGetInt32(out var co2))
                        {
                            co2Values.Add(co2);
                        }
                        else if (reading.SensorType == "humidity" && payload.ContainsKey("humidity") && payload["humidity"] is JsonElement humidityElement && humidityElement.TryGetInt32(out var humidity))
                        {
                            humidityValues.Add(humidity);
                        }
                    }
                    catch
                    {
                        // Skip invalid readings
                    }
                }

                aggregatedData.Add(new SensorDataPointType
                {
                    Timestamp = group.Key,
                    Energy = energyValues.Any() ? energyValues.Average() : 0,
                    CO2 = co2Values.Any() ? (int)co2Values.Average() : 0,
                    Humidity = humidityValues.Any() ? (int)humidityValues.Average() : 0
                });
            }

            return aggregatedData;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAggregatedData: {ex.Message}");
            throw;
        }
    }

    public async Task<List<ProcessingStatsType>> GetProcessingStats([Service] SensorDbContext context)
    {
        try
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
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetProcessingStats: {ex.Message}");
            throw;
        }
    }

    public async Task<SensorReadingType?> GetSensorReadingById(
        Guid id,
        [Service] SensorDbContext context)
    {
        try
        {
            var reading = await context.SensorReadings
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reading == null)
                return null;

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
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetSensorReadingById: {ex.Message}");
            throw;
        }
    }
}