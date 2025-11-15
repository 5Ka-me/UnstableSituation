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
        int? limit,
        string? timeRange,
        [Service] SensorDbContext context)
    {
        try
        {
            var query = context.SensorReadings.AsQueryable();

            // Фильтруем по времени, если указан timeRange
            if (!string.IsNullOrEmpty(timeRange))
            {
                DateTime fromTime = timeRange switch
                {
                    "30s" => DateTime.UtcNow.AddSeconds(-30),
                    "1m" => DateTime.UtcNow.AddMinutes(-1),
                    "5m" => DateTime.UtcNow.AddMinutes(-5),
                    "15m" => DateTime.UtcNow.AddMinutes(-15),
                    "30m" => DateTime.UtcNow.AddMinutes(-30),
                    "1h" => DateTime.UtcNow.AddHours(-1),
                    "6h" => DateTime.UtcNow.AddHours(-6),
                    "24h" => DateTime.UtcNow.AddHours(-24),
                    "7d" => DateTime.UtcNow.AddDays(-7),
                    "30d" => DateTime.UtcNow.AddDays(-30),
                    _ => DateTime.UtcNow.AddHours(-24)
                };
                query = query.Where(r => r.Timestamp >= fromTime);
            }

            var readings = await query
                .OrderByDescending(r => r.Timestamp)
                .Take(limit ?? 50)
                .ToListAsync();

            return readings.Select(r => new SensorReadingType
            {
                Id = r.Id,
                SensorType = r.SensorType,
                SensorName = r.SensorName,
                Payload = JsonSerializer.Deserialize<JsonElement>(r.Payload),
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
                    }
                }
                averageEnergy = energyValues.Any() ? energyValues.Average() : 0.0;
            }

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
                    }
                }
                averageCO2 = co2Values.Any() ? (int)co2Values.Average() : 0;
            }
            var humidityReadings = await context.SensorReadings
                .Where(r => r.SensorType == "air_quality")
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
                    }
                }
                averageHumidity = humidityValues.Any() ? (int)humidityValues.Average() : 0;
            }

            var motionReadings = await context.SensorReadings
                .Where(r => r.SensorType == "motion")
                .ToListAsync();

            var motionCount = 0;
            foreach (var reading in motionReadings)
            {
                try
                {
                    var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                    if (payload.ContainsKey("motionDetected") && payload["motionDetected"] is JsonElement motionElement && motionElement.GetBoolean())
                    {
                        motionCount++;
                    }
                    else if (payload.ContainsKey("motion_detected") && payload["motion_detected"] is JsonElement motionElement2 && motionElement2.GetBoolean())
                    {
                        motionCount++;
                    }
                }
                catch
                {
                    // Skip invalid readings
                }
            }

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
                Payload = JsonSerializer.Deserialize<JsonElement>(r.Payload),
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
        string? timeRange,
        [Service] SensorDbContext context)
    {
        try
        {
            var query = context.SensorReadings
                .Where(r => r.SensorName == sensorName);

            // Фильтруем по времени, если указан timeRange
            if (!string.IsNullOrEmpty(timeRange))
            {
                DateTime fromTime = timeRange switch
                {
                    "30s" => DateTime.UtcNow.AddSeconds(-30),
                    "1m" => DateTime.UtcNow.AddMinutes(-1),
                    "5m" => DateTime.UtcNow.AddMinutes(-5),
                    "15m" => DateTime.UtcNow.AddMinutes(-15),
                    "30m" => DateTime.UtcNow.AddMinutes(-30),
                    "1h" => DateTime.UtcNow.AddHours(-1),
                    "6h" => DateTime.UtcNow.AddHours(-6),
                    "24h" => DateTime.UtcNow.AddHours(-24),
                    "7d" => DateTime.UtcNow.AddDays(-7),
                    "30d" => DateTime.UtcNow.AddDays(-30),
                    _ => DateTime.UtcNow.AddHours(-24)
                };
                query = query.Where(r => r.Timestamp >= fromTime);
            }

            query = query.OrderByDescending(r => r.Timestamp);

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
                Payload = JsonSerializer.Deserialize<JsonElement>(r.Payload),
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
            DateTime fromTime = timeRange switch
            {
                "30s" => DateTime.UtcNow.AddSeconds(-30),
                "1m" => DateTime.UtcNow.AddMinutes(-1),
                "5m" => DateTime.UtcNow.AddMinutes(-5),
                "15m" => DateTime.UtcNow.AddMinutes(-15),
                "30m" => DateTime.UtcNow.AddMinutes(-30),
                "1h" => DateTime.UtcNow.AddHours(-1),
                "6h" => DateTime.UtcNow.AddHours(-6),
                "24h" => DateTime.UtcNow.AddHours(-24),
                "7d" => DateTime.UtcNow.AddDays(-7),
                "30d" => DateTime.UtcNow.AddDays(-30),
                _ => DateTime.UtcNow.AddHours(-24)
            };

            var readings = await context.SensorReadings
                .Where(r => r.Timestamp >= fromTime)
                .OrderBy(r => r.Timestamp)
                .ToListAsync();

            var aggregatedData = new List<SensorDataPointType>();

            // Определяем размер интервала для группировки
            TimeSpan interval = timeRange switch
            {
                "30s" => TimeSpan.FromSeconds(1),      // По секунде для 30 секунд
                "1m" => TimeSpan.FromSeconds(1),       // По секунде для 1 минуты
                "5m" => TimeSpan.FromSeconds(5),       // По 5 секунд для 5 минут
                "15m" => TimeSpan.FromMinutes(1),      // По минуте для 15 минут
                "30m" => TimeSpan.FromMinutes(1),      // По минуте для 30 минут
                "1h" => TimeSpan.FromMinutes(1),      // По минуте для 1 часа
                "6h" => TimeSpan.FromMinutes(5),      // По 5 минут для 6 часов
                "24h" => TimeSpan.FromMinutes(15),     // По 15 минут для 24 часов
                "7d" => TimeSpan.FromHours(1),        // По часу для 7 дней
                "30d" => TimeSpan.FromHours(6),       // По 6 часов для 30 дней
                _ => TimeSpan.FromMinutes(15)
            };

            // Группируем readings по интервалам
            var groupedReadings = readings
                .GroupBy(r =>
                {
                    var timestamp = r.Timestamp;
                    var ticks = timestamp.Ticks / interval.Ticks;
                    return new DateTime(ticks * interval.Ticks, DateTimeKind.Utc);
                })
                .OrderBy(g => g.Key);

            // Создаем точки данных только для интервалов, где есть данные
            foreach (var group in groupedReadings)
            {
                var energyValues = new List<double>();
                var co2Values = new List<int>();
                var pm25Values = new List<int>();
                var humidityValues = new List<int>();
                var motionDetectedCount = 0;

                foreach (var reading in group)
                {
                    try
                    {
                        var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(reading.Payload);
                        
                        if (reading.SensorType == "energy" && payload.ContainsKey("energy") && payload["energy"] is JsonElement energyElement && energyElement.TryGetDouble(out var energy))
                        {
                            energyValues.Add(energy);
                        }
                        else if (reading.SensorType == "air_quality")
                        {
                            if (payload.ContainsKey("co2") && payload["co2"] is JsonElement co2Element && co2Element.TryGetInt32(out var co2))
                            {
                                co2Values.Add(co2);
                            }
                            if (payload.ContainsKey("pm25") && payload["pm25"] is JsonElement pm25Element && pm25Element.TryGetInt32(out var pm25))
                            {
                                pm25Values.Add(pm25);
                            }
                            if (payload.ContainsKey("humidity") && payload["humidity"] is JsonElement humidityElement && humidityElement.TryGetInt32(out var humidity))
                            {
                                humidityValues.Add(humidity);
                            }
                        }
                        else if (reading.SensorType == "motion")
                        {
                            if (payload.ContainsKey("motionDetected") && payload["motionDetected"] is JsonElement motionElement && motionElement.GetBoolean())
                            {
                                motionDetectedCount++;
                            }
                            else if (payload.ContainsKey("motion_detected") && payload["motion_detected"] is JsonElement motionElement2 && motionElement2.GetBoolean())
                            {
                                motionDetectedCount++;
                            }
                        }
                    }
                    catch
                    {
                    }
                }

                aggregatedData.Add(new SensorDataPointType
                {
                    Timestamp = group.Key,
                    Energy = energyValues.Any() ? energyValues.Average() : 0,
                    CO2 = co2Values.Any() ? (int)co2Values.Average() : 0,
                    PM25 = pm25Values.Any() ? (int)pm25Values.Average() : 0,
                    Humidity = humidityValues.Any() ? (int)humidityValues.Average() : 0,
                    MotionDetected = motionDetectedCount
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
                Payload = JsonSerializer.Deserialize<JsonElement>(reading.Payload),
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