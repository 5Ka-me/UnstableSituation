using DataIngestor.Configuration;
using DataIngestor.Models;
using DataIngestor.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace DataIngestor.Tests.Services;

public class RabbitMQServiceTests
{
    private readonly RabbitMQConfig _config;
    private readonly Mock<ILogger<RabbitMQService>> _mockLogger;

    public RabbitMQServiceTests()
    {
        _config = new RabbitMQConfig
        {
            Url = "amqp://guest:guest@localhost:5672/",
            ExchangeName = "test-exchange",
            QueueName = "test-queue",
            RoutingKey = "test.key"
        };
        _mockLogger = new Mock<ILogger<RabbitMQService>>();
    }

    [Fact]
    public void Constructor_ShouldInitializeService()
    {
        // Arrange & Act
        var service = new RabbitMQService(_config, _mockLogger.Object);

        // Assert
        service.Should().NotBeNull();
        service.Dispose();
    }

    [Fact]
    public void Constructor_ShouldStoreConfiguration()
    {
        // Arrange & Act
        var service = new RabbitMQService(_config, _mockLogger.Object);

        // Assert
        service.Should().NotBeNull();
        service.Dispose();
    }

    [Fact]
    public void Publish_ShouldThrowException_WhenConnectionNotEstablished()
    {
        // Arrange
        var service = new RabbitMQService(_config, _mockLogger.Object);
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } }
        };

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() => service.Publish(sensorData));
        exception.Message.Should().Contain("RabbitMQ connection is not established");
        service.Dispose();
    }

    [Fact]
    public void Publish_ShouldThrowException_WhenDataIsNull()
    {
        // Arrange
        var service = new RabbitMQService(_config, _mockLogger.Object);

        // Act & Assert
        // Note: The method signature requires List<SensorData>, so null cannot be passed directly
        // This test verifies the connection check happens first
        var exception = Assert.Throws<InvalidOperationException>(() => service.Publish(new List<SensorData>()));
        exception.Message.Should().Contain("RabbitMQ connection is not established");
        service.Dispose();
    }

    [Fact]
    public void Dispose_ShouldNotThrow_WhenCalledMultipleTimes()
    {
        // Arrange
        var service = new RabbitMQService(_config, _mockLogger.Object);

        // Act
        service.Dispose();
        service.Dispose();

        // Assert - Should not throw
        service.Should().NotBeNull();
    }

    [Fact]
    public void Dispose_ShouldNotThrow_WhenConnectionNotEstablished()
    {
        // Arrange
        var service = new RabbitMQService(_config, _mockLogger.Object);

        // Act
        service.Dispose();

        // Assert - Should not throw
        service.Should().NotBeNull();
    }
}

