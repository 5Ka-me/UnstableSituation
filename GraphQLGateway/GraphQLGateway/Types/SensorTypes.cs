using GraphQLGateway.Models;

namespace GraphQLGateway.Types;

public class SensorReadingType
{
    public Guid Id { get; set; }
    public string SensorType { get; set; } = string.Empty;
    public string SensorName { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProcessingStatsType
{
    public int Id { get; set; }
    public long ProcessedMessages { get; set; }
    public long FailedMessages { get; set; }
    public DateTime? LastProcessedAt { get; set; }
    public decimal? ProcessingRatePerSecond { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SensorMetricsType
{
    public int TotalReadings { get; set; }
    public double AverageEnergy { get; set; }
    public int AverageCO2 { get; set; }
    public int AverageHumidity { get; set; }
    public int MotionDetectedCount { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class SensorDataPointType
{
    public DateTime Timestamp { get; set; }
    public double Energy { get; set; }
    public int CO2 { get; set; }
    public int Humidity { get; set; }
}

