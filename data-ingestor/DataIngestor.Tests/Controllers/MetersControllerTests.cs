using DataIngestor.Controllers;
using DataIngestor.Models;
using DataIngestor.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace DataIngestor.Tests.Controllers;

public class MetersControllerTests
{
    private readonly Mock<IApiClientService> _mockApiClient;
    private readonly Mock<IRabbitMQService> _mockRabbitMQService;
    private readonly Mock<ILogger<MetersController>> _mockLogger;
    private readonly MetersController _controller;

    public MetersControllerTests()
    {
        _mockApiClient = new Mock<IApiClientService>();
        _mockRabbitMQService = new Mock<IRabbitMQService>();
        _mockLogger = new Mock<ILogger<MetersController>>();
        _controller = new MetersController(
            _mockApiClient.Object,
            _mockRabbitMQService.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task Ingest_ShouldReturnOkResult_WhenDataIngestionSucceeds()
    {
        // Arrange
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } }
        };

        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        // Act
        var result = await _controller.Ingest(CancellationToken.None);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _mockRabbitMQService.Verify(x => x.Publish(sensorData), Times.Once);
    }

    [Fact]
    public async Task Ingest_ShouldReturnSuccessMessage_WhenDataIngestionSucceeds()
    {
        // Arrange
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } }
        };

        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        // Act
        var result = await _controller.Ingest(CancellationToken.None) as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var message = value?.GetType().GetProperty("message")?.GetValue(value)?.ToString();
        message.Should().Be("Data ingested successfully");
    }

    [Fact]
    public async Task Ingest_ShouldReturnData_WhenDataIngestionSucceeds()
    {
        // Arrange
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } }
        };

        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        // Act
        var result = await _controller.Ingest(CancellationToken.None) as OkObjectResult;
        var value = result?.Value;
        var data = value?.GetType().GetProperty("data")?.GetValue(value) as List<SensorData>;

        // Assert
        data.Should().NotBeNull();
        data.Should().BeEquivalentTo(sensorData);
    }

    [Fact]
    public async Task Ingest_ShouldReturnInternalServerError_WhenApiClientThrowsException()
    {
        // Arrange
        var exception = new HttpRequestException("API request failed");
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);

        // Act
        var result = await _controller.Ingest(CancellationToken.None);

        // Assert
        result.Should().BeOfType<ObjectResult>();
        var objectResult = result as ObjectResult;
        objectResult?.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task Ingest_ShouldLogError_WhenExceptionOccurs()
    {
        // Arrange
        var exception = new HttpRequestException("API request failed");
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);

        // Act
        await _controller.Ingest(CancellationToken.None);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public async Task Ingest_ShouldReturnErrorInResponse_WhenExceptionOccurs()
    {
        // Arrange
        var exception = new HttpRequestException("API request failed");
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);

        // Act
        var result = await _controller.Ingest(CancellationToken.None) as ObjectResult;
        var value = result?.Value;
        var error = value?.GetType().GetProperty("error")?.GetValue(value)?.ToString();

        // Assert
        error.Should().Be("API request failed");
    }

    [Fact]
    public async Task Ingest_ShouldNotPublishToRabbitMQ_WhenApiClientThrowsException()
    {
        // Arrange
        var exception = new HttpRequestException("API request failed");
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);

        // Act
        await _controller.Ingest(CancellationToken.None);

        // Assert
        _mockRabbitMQService.Verify(x => x.Publish(It.IsAny<List<SensorData>>()), Times.Never);
    }

    [Fact]
    public async Task Ingest_ShouldPassCancellationTokenToApiClient()
    {
        // Arrange
        var cancellationToken = new CancellationToken();
        var sensorData = new List<SensorData>();

        _mockApiClient
            .Setup(x => x.FetchDataAsync(cancellationToken))
            .ReturnsAsync(sensorData);

        // Act
        await _controller.Ingest(cancellationToken);

        // Assert
        _mockApiClient.Verify(x => x.FetchDataAsync(cancellationToken), Times.Once);
    }
}

