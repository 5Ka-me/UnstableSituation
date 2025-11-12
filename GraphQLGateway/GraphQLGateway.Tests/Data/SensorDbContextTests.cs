using GraphQLGateway.Data;
using GraphQLGateway.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace GraphQLGateway.Tests.Data;

public class SensorDbContextTests : IDisposable
{
    private readonly SensorDbContext _context;

    public SensorDbContextTests()
    {
        var options = new DbContextOptionsBuilder<SensorDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new SensorDbContext(options);
    }

    [Fact]
    public void SensorDbContext_ShouldHaveSensorReadingsDbSet()
    {
        // Assert
        _context.SensorReadings.Should().NotBeNull();
    }

    [Fact]
    public void SensorDbContext_ShouldHaveProcessingStatsDbSet()
    {
        // Assert
        _context.ProcessingStats.Should().NotBeNull();
    }

    [Fact]
    public async Task SensorReadings_ShouldAllowAddingEntities()
    {
        // Arrange
        var reading = new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = DateTime.UtcNow
        };

        // Act
        _context.SensorReadings.Add(reading);
        await _context.SaveChangesAsync();

        // Assert
        var count = await _context.SensorReadings.CountAsync();
        count.Should().Be(1);
    }

    [Fact]
    public async Task SensorReadings_ShouldAllowQueryingEntities()
    {
        // Arrange
        var reading = new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = DateTime.UtcNow
        };
        _context.SensorReadings.Add(reading);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.SensorReadings.FirstOrDefaultAsync(r => r.SensorType == "energy");

        // Assert
        result.Should().NotBeNull();
        result!.SensorType.Should().Be("energy");
    }

    [Fact]
    public async Task ProcessingStats_ShouldAllowAddingEntities()
    {
        // Arrange
        var stats = new ProcessingStats
        {
            ProcessedMessages = 100,
            FailedMessages = 5,
            CreatedAt = DateTime.UtcNow
        };

        // Act
        _context.ProcessingStats.Add(stats);
        await _context.SaveChangesAsync();

        // Assert
        var count = await _context.ProcessingStats.CountAsync();
        count.Should().Be(1);
    }

    [Fact]
    public async Task ProcessingStats_ShouldAllowQueryingEntities()
    {
        // Arrange
        var stats = new ProcessingStats
        {
            ProcessedMessages = 100,
            FailedMessages = 5,
            CreatedAt = DateTime.UtcNow
        };
        _context.ProcessingStats.Add(stats);
        await _context.SaveChangesAsync();

        // Act
        var result = await _context.ProcessingStats.FirstOrDefaultAsync();

        // Assert
        result.Should().NotBeNull();
        result!.ProcessedMessages.Should().Be(100);
    }

    [Fact]
    public async Task SensorReadings_ShouldSupportMultipleEntities()
    {
        // Arrange
        for (int i = 0; i < 5; i++)
        {
            _context.SensorReadings.Add(new SensorReading
            {
                Id = Guid.NewGuid(),
                SensorType = "energy",
                SensorName = $"Sensor{i}",
                Payload = "{\"value\": 100}",
                Timestamp = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var count = await _context.SensorReadings.CountAsync();

        // Assert
        count.Should().Be(5);
    }

    [Fact]
    public async Task SensorReadings_ShouldFilterBySensorType()
    {
        // Arrange
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = DateTime.UtcNow
        });
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "motion",
            SensorName = "Sensor2",
            Payload = "{\"motionDetected\": true}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var energyReadings = await _context.SensorReadings
            .Where(r => r.SensorType == "energy")
            .ToListAsync();

        // Assert
        energyReadings.Should().HaveCount(1);
        energyReadings[0].SensorType.Should().Be("energy");
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}

