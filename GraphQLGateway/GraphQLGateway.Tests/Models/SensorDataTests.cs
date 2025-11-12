using GraphQLGateway.Models;
using FluentAssertions;

namespace GraphQLGateway.Tests.Models;

public class SensorDataTests
{
    [Fact]
    public void SensorReading_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var reading = new SensorReading();

        // Assert
        reading.Id.Should().Be(Guid.Empty);
        reading.SensorType.Should().BeEmpty();
        reading.SensorName.Should().BeEmpty();
        reading.Payload.Should().BeEmpty();
        reading.Timestamp.Should().Be(default(DateTime));
    }

    [Fact]
    public void SensorReading_ShouldAllowSettingProperties()
    {
        // Arrange
        var id = Guid.NewGuid();
        var timestamp = DateTime.UtcNow;
        var createdAt = DateTime.UtcNow;

        // Act
        var reading = new SensorReading
        {
            Id = id,
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = timestamp,
            CreatedAt = createdAt
        };

        // Assert
        reading.Id.Should().Be(id);
        reading.SensorType.Should().Be("energy");
        reading.SensorName.Should().Be("Sensor1");
        reading.Payload.Should().Be("{\"value\": 100}");
        reading.Timestamp.Should().Be(timestamp);
        reading.CreatedAt.Should().Be(createdAt);
    }

    [Fact]
    public void ProcessingStats_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var stats = new ProcessingStats();

        // Assert
        stats.Id.Should().Be(0);
        stats.ProcessedMessages.Should().Be(0);
        stats.FailedMessages.Should().Be(0);
        stats.LastProcessedAt.Should().BeNull();
        stats.ProcessingRatePerSecond.Should().BeNull();
    }

    [Fact]
    public void ProcessingStats_ShouldAllowSettingProperties()
    {
        // Arrange
        var now = DateTime.UtcNow;

        // Act
        var stats = new ProcessingStats
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
        stats.Id.Should().Be(1);
        stats.ProcessedMessages.Should().Be(1000);
        stats.FailedMessages.Should().Be(10);
        stats.LastProcessedAt.Should().Be(now);
        stats.ProcessingRatePerSecond.Should().Be(50.5m);
        stats.CreatedAt.Should().Be(now);
        stats.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void ProcessingStats_ShouldAllowNullValues()
    {
        // Arrange & Act
        var stats = new ProcessingStats
        {
            Id = 1,
            ProcessedMessages = 100,
            FailedMessages = 5
        };

        // Assert
        stats.LastProcessedAt.Should().BeNull();
        stats.ProcessingRatePerSecond.Should().BeNull();
    }
}

