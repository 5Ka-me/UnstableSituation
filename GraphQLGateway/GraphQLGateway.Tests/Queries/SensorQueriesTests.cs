using GraphQLGateway.Queries;
using GraphQLGateway.Data;
using GraphQLGateway.Models;
using GraphQLGateway.Types;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GraphQLGateway.Tests.Queries;

public class SensorQueriesTests : IDisposable
{
    private readonly SensorDbContext _context;
    private readonly SensorQueries _queries;

    public SensorQueriesTests()
    {
        var options = new DbContextOptionsBuilder<SensorDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new SensorDbContext(options);
        _queries = new SensorQueries();
    }

    [Fact]
    public async Task GetSensorReadings_ShouldReturnList()
    {
        // Act
        var result = await _queries.GetSensorReadings(_context);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType<List<SensorReadingType>>();
    }

    [Fact]
    public async Task GetSensorReadings_ShouldReturnSensorReadings()
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
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorReadings(_context);

        // Assert
        result.Should().NotBeEmpty();
        result[0].SensorType.Should().Be("energy");
    }

    [Fact]
    public async Task GetSensorReadings_ShouldLimitTo50()
    {
        // Arrange
        for (int i = 0; i < 60; i++)
        {
            _context.SensorReadings.Add(new SensorReading
            {
                Id = Guid.NewGuid(),
                SensorType = "energy",
                SensorName = $"Sensor{i}",
                Payload = "{\"value\": 100}",
                Timestamp = DateTime.UtcNow.AddSeconds(-i)
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorReadings(_context);

        // Assert
        result.Should().HaveCountLessOrEqualTo(50);
    }

    [Fact]
    public async Task GetSensorMetrics_ShouldReturnMetrics()
    {
        // Arrange
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"energy\": 100.5}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorMetrics(_context);

        // Assert
        result.Should().NotBeNull();
        result.TotalReadings.Should().BeGreaterOrEqualTo(1);
    }

    [Fact]
    public async Task GetSensorMetrics_ShouldCalculateAverageEnergy()
    {
        // Arrange
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"energy\": 100.0}",
            Timestamp = DateTime.UtcNow
        });
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor2",
            Payload = "{\"energy\": 200.0}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorMetrics(_context);

        // Assert
        result.Should().NotBeNull();
        result.AverageEnergy.Should().Be(150.0);
    }

    [Fact]
    public async Task GetSensorMetrics_ShouldCalculateAverageCO2()
    {
        // Arrange
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "air_quality",
            SensorName = "Sensor1",
            Payload = "{\"co2\": 400}",
            Timestamp = DateTime.UtcNow
        });
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "air_quality",
            SensorName = "Sensor2",
            Payload = "{\"co2\": 600}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorMetrics(_context);

        // Assert
        result.Should().NotBeNull();
        result.AverageCO2.Should().Be(500);
    }

    [Fact]
    public async Task GetSensorReadingsByType_ShouldFilterByType()
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
        var result = await _queries.GetSensorReadingsByType("energy", null, _context);

        // Assert
        result.Should().NotBeEmpty();
        result.All(r => r.SensorType == "energy").Should().BeTrue();
    }

    [Fact]
    public async Task GetSensorReadingsByType_ShouldRespectLimit()
    {
        // Arrange
        for (int i = 0; i < 10; i++)
        {
            _context.SensorReadings.Add(new SensorReading
            {
                Id = Guid.NewGuid(),
                SensorType = "energy",
                SensorName = $"Sensor{i}",
                Payload = "{\"value\": 100}",
                Timestamp = DateTime.UtcNow.AddSeconds(-i)
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorReadingsByType("energy", 5, _context);

        // Assert
        result.Should().HaveCountLessOrEqualTo(5);
    }

    [Fact]
    public async Task GetSensorReadingsByLocation_ShouldFilterByLocation()
    {
        // Arrange
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Location1",
            Payload = "{\"value\": 100}",
            Timestamp = DateTime.UtcNow
        });
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Location2",
            Payload = "{\"value\": 200}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorReadingsByLocation("Location1", null, _context);

        // Assert
        result.Should().NotBeEmpty();
        result.All(r => r.SensorName == "Location1").Should().BeTrue();
    }

    [Fact]
    public async Task GetSensorReadingById_ShouldReturnReading_WhenExists()
    {
        // Arrange
        var id = Guid.NewGuid();
        _context.SensorReadings.Add(new SensorReading
        {
            Id = id,
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetSensorReadingById(id, _context);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(id);
    }

    [Fact]
    public async Task GetSensorReadingById_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _queries.GetSensorReadingById(Guid.NewGuid(), _context);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetProcessingStats_ShouldReturnStats()
    {
        // Arrange
        _context.ProcessingStats.Add(new ProcessingStats
        {
            ProcessedMessages = 100,
            FailedMessages = 5,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetProcessingStats(_context);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetAggregatedData_ShouldReturnData()
    {
        // Arrange
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"energy\": 100.0}",
            Timestamp = DateTime.UtcNow.AddHours(-1)
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetAggregatedData("1h", _context);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType<List<SensorDataPointType>>();
    }

    [Theory]
    [InlineData("1h")]
    [InlineData("6h")]
    [InlineData("12h")]
    [InlineData("7d")]
    [InlineData(null)]
    public async Task GetAggregatedData_ShouldHandleTimeRanges(string? timeRange)
    {
        // Arrange
        _context.SensorReadings.Add(new SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"energy\": 100.0}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _queries.GetAggregatedData(timeRange, _context);

        // Assert
        result.Should().NotBeNull();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}

