using GraphQLGateway.Types;
using FluentAssertions;
using System.Text.Json;

namespace GraphQLGateway.Tests.Types;

public class SensorTypesTests
{
    [Fact]
    public void SensorReadingType_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var type = new SensorReadingType();

        // Assert
        type.Id.Should().Be(Guid.Empty);
        type.SensorType.Should().BeEmpty();
        type.SensorName.Should().BeEmpty();
        type.Timestamp.Should().Be(default(DateTime));
        type.CreatedAt.Should().Be(default(DateTime));
    }

    [Fact]
    public void SensorReadingType_ShouldAllowSettingProperties()
    {
        // Arrange
        var id = Guid.NewGuid();
        var timestamp = DateTime.UtcNow;
        var payload = JsonSerializer.Deserialize<JsonElement>("{\"value\": 100}");

        // Act
        var type = new SensorReadingType
        {
            Id = id,
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = payload,
            Timestamp = timestamp,
            CreatedAt = timestamp
        };

        // Assert
        type.Id.Should().Be(id);
        type.SensorType.Should().Be("energy");
        type.SensorName.Should().Be("Sensor1");
        type.Timestamp.Should().Be(timestamp);
        type.CreatedAt.Should().Be(timestamp);
    }

    [Fact]
    public void ProcessingStatsType_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var type = new ProcessingStatsType();

        // Assert
        type.Id.Should().Be(0);
        type.ProcessedMessages.Should().Be(0);
        type.FailedMessages.Should().Be(0);
        type.LastProcessedAt.Should().BeNull();
        type.ProcessingRatePerSecond.Should().BeNull();
    }

    [Fact]
    public void ProcessingStatsType_ShouldAllowSettingProperties()
    {
        // Arrange
        var now = DateTime.UtcNow;

        // Act
        var type = new ProcessingStatsType
        {
            Id = 1,
            ProcessedMessages = 1000,
            FailedMessages = 10,
            LastProcessedAt = now,
            ProcessingRatePerSecond = 50.5m,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Assert
        type.Id.Should().Be(1);
        type.ProcessedMessages.Should().Be(1000);
        type.FailedMessages.Should().Be(10);
        type.LastProcessedAt.Should().Be(now);
        type.ProcessingRatePerSecond.Should().Be(50.5m);
    }

    [Fact]
    public void SensorMetricsType_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var type = new SensorMetricsType();

        // Assert
        type.TotalReadings.Should().Be(0);
        type.AverageEnergy.Should().Be(0.0);
        type.AverageCO2.Should().Be(0);
        type.AverageHumidity.Should().Be(0);
        type.MotionDetectedCount.Should().Be(0);
    }

    [Fact]
    public void SensorMetricsType_ShouldAllowSettingProperties()
    {
        // Arrange
        var now = DateTime.UtcNow;

        // Act
        var type = new SensorMetricsType
        {
            TotalReadings = 100,
            AverageEnergy = 150.5,
            AverageCO2 = 450,
            AverageHumidity = 60,
            MotionDetectedCount = 5,
            LastUpdated = now
        };

        // Assert
        type.TotalReadings.Should().Be(100);
        type.AverageEnergy.Should().Be(150.5);
        type.AverageCO2.Should().Be(450);
        type.AverageHumidity.Should().Be(60);
        type.MotionDetectedCount.Should().Be(5);
        type.LastUpdated.Should().Be(now);
    }

    [Fact]
    public void SensorDataPointType_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var type = new SensorDataPointType();

        // Assert
        type.Timestamp.Should().Be(default(DateTime));
        type.Energy.Should().Be(0.0);
        type.CO2.Should().Be(0);
        type.PM25.Should().Be(0);
        type.Humidity.Should().Be(0);
        type.MotionDetected.Should().Be(0);
    }

    [Fact]
    public void SensorDataPointType_ShouldAllowSettingProperties()
    {
        // Arrange
        var timestamp = DateTime.UtcNow;

        // Act
        var type = new SensorDataPointType
        {
            Timestamp = timestamp,
            Energy = 100.5,
            CO2 = 450,
            PM25 = 25,
            Humidity = 60,
            MotionDetected = 3
        };

        // Assert
        type.Timestamp.Should().Be(timestamp);
        type.Energy.Should().Be(100.5);
        type.CO2.Should().Be(450);
        type.PM25.Should().Be(25);
        type.Humidity.Should().Be(60);
        type.MotionDetected.Should().Be(3);
    }
}

