using GraphQLGateway.Controllers;
using GraphQLGateway.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GraphQLGateway.Tests.Controllers;

public class DebugControllerTests : IDisposable
{
    private readonly SensorDbContext _context;
    private readonly DebugController _controller;

    public DebugControllerTests()
    {
        var options = new DbContextOptionsBuilder<SensorDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new SensorDbContext(options);
        _controller = new DebugController(_context);
    }

    [Fact]
    public void Health_ShouldReturnOkResult()
    {
        // Act
        var result = _controller.Health();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Health_ShouldReturnHealthyStatus()
    {
        // Act
        var result = _controller.Health() as OkObjectResult;
        var value = result?.Value as HealthResponse;

        // Assert
        value.Should().NotBeNull();
        value!.Status.Should().Be("healthy");
        value.Service.Should().Be("GraphQL Gateway Debug API");
    }

    [Fact]
    public void Health_ShouldReturnTimestamp()
    {
        // Arrange
        var beforeUtc = DateTime.UtcNow;

        // Act
        var result = _controller.Health() as OkObjectResult;
        var value = result?.Value as HealthResponse;
        var afterUtc = DateTime.UtcNow;

        // Assert
        value.Should().NotBeNull();
        value!.Timestamp.Should().BeAfter(beforeUtc.AddSeconds(-1));
        value.Timestamp.Should().BeBefore(afterUtc.AddSeconds(1));
    }

    [Fact]
    public void Test_ShouldReturnOkResult()
    {
        // Act
        var result = _controller.Test();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Test_ShouldReturnTestMessage()
    {
        // Act
        var result = _controller.Test() as OkObjectResult;
        var value = result?.Value as TestResponse;

        // Assert
        value.Should().NotBeNull();
        value!.Message.Should().Be("Debug API is working!");
    }

    [Fact]
    public void Test_ShouldReturnEnvironment()
    {
        // Act
        var result = _controller.Test() as OkObjectResult;
        var value = result?.Value as TestResponse;

        // Assert
        value.Should().NotBeNull();
        value!.Environment.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Database_ShouldReturnOkResult_WhenConnectionSuccessful()
    {
        // Act
        var result = await _controller.Database();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Database_ShouldReturnConnectedStatus()
    {
        // Act
        var result = await _controller.Database() as OkObjectResult;
        var value = result?.Value as DatabaseResponse;

        // Assert
        value.Should().NotBeNull();
        value!.Status.Should().Be("connected");
    }

    [Fact]
    public async Task Database_ShouldReturnSensorReadingsCount()
    {
        // Arrange
        _context.SensorReadings.Add(new GraphQLGateway.Models.SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.Database() as OkObjectResult;
        var value = result?.Value as DatabaseResponse;

        // Assert
        value.Should().NotBeNull();
        value!.SensorReadingsCount.Should().BeGreaterOrEqualTo(1);
    }

    [Fact]
    public async Task GetSensorReadings_ShouldReturnOkResult()
    {
        // Act
        var result = await _controller.GetSensorReadings();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetSensorReadings_ShouldReturnSensorReadings()
    {
        // Arrange
        _context.SensorReadings.Add(new GraphQLGateway.Models.SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetSensorReadings() as OkObjectResult;
        var value = result?.Value as SensorReadingsResponse;

        // Assert
        value.Should().NotBeNull();
        value!.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task GetSensorReadings_ShouldRespectLimit()
    {
        // Arrange
        for (int i = 0; i < 15; i++)
        {
            _context.SensorReadings.Add(new GraphQLGateway.Models.SensorReading
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
        var result = await _controller.GetSensorReadings(limit: 5) as OkObjectResult;
        var value = result?.Value as SensorReadingsResponse;

        // Assert
        value.Should().NotBeNull();
        value!.Count.Should().BeLessOrEqualTo(5);
    }

    [Fact]
    public async Task GetSensorReadings_ShouldOrderByTimestampDescending()
    {
        // Arrange
        var now = DateTime.UtcNow;
        _context.SensorReadings.Add(new GraphQLGateway.Models.SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor1",
            Payload = "{\"value\": 100}",
            Timestamp = now.AddMinutes(-10)
        });
        _context.SensorReadings.Add(new GraphQLGateway.Models.SensorReading
        {
            Id = Guid.NewGuid(),
            SensorType = "energy",
            SensorName = "Sensor2",
            Payload = "{\"value\": 200}",
            Timestamp = now
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetSensorReadings() as OkObjectResult;
        var value = result?.Value as SensorReadingsResponse;

        // Assert
        value.Should().NotBeNull();
        value!.Data.Should().NotBeEmpty();
        value.Data[0].Timestamp.Should().BeAfter(value.Data.Last().Timestamp);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(10)]
    [InlineData(50)]
    [InlineData(100)]
    public async Task GetSensorReadings_ShouldAcceptValidLimits(int limit)
    {
        // Act
        var result = await _controller.GetSensorReadings(limit);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}

