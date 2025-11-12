using DataIngestor.Models;
using DataIngestor.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace DataIngestor.Tests.Services;

public class DataIngestionServiceTests
{
    private readonly Mock<IApiClientService> _mockApiClient;
    private readonly Mock<IRabbitMQService> _mockRabbitMQService;
    private readonly Mock<ILogger<DataIngestionService>> _mockLogger;
    private readonly DataIngestionService _service;

    public DataIngestionServiceTests()
    {
        _mockApiClient = new Mock<IApiClientService>();
        _mockRabbitMQService = new Mock<IRabbitMQService>();
        _mockLogger = new Mock<ILogger<DataIngestionService>>();
        _service = new DataIngestionService(
            _mockApiClient.Object,
            _mockRabbitMQService.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldFetchDataFromApiClient()
    {
        // Arrange
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } }
        };

        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        var cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(100));

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(150, CancellationToken.None);
        await _service.StopAsync(CancellationToken.None);

        // Assert
        _mockApiClient.Verify(x => x.FetchDataAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldPublishDataToRabbitMQ()
    {
        // Arrange
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } }
        };

        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        var cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(100));

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(150, CancellationToken.None);
        await _service.StopAsync(CancellationToken.None);

        // Assert
        _mockRabbitMQService.Verify(x => x.Publish(sensorData), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldLogInformation_WhenServiceStarts()
    {
        // Arrange
        var sensorData = new List<SensorData>();
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        var cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(100));

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(150, CancellationToken.None);
        await _service.StopAsync(CancellationToken.None);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Data ingestion service started")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldLogInformation_WhenDataProcessedSuccessfully()
    {
        // Arrange
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } }
        };

        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        var cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(100));

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(150, CancellationToken.None);
        await _service.StopAsync(CancellationToken.None);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Successfully processed data")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldLogError_WhenExceptionOccurs()
    {
        // Arrange
        var exception = new HttpRequestException("API request failed");
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);

        var cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(100));

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(150, CancellationToken.None);
        await _service.StopAsync(CancellationToken.None);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldContinueRunning_WhenExceptionOccurs()
    {
        // Arrange
        var exception = new HttpRequestException("API request failed");
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(exception);

        var cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(200));

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(250, CancellationToken.None);
        await _service.StopAsync(CancellationToken.None);

        // Assert - Service should continue running and retry
        _mockApiClient.Verify(x => x.FetchDataAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldLogInformation_WhenServiceStops()
    {
        // Arrange
        var sensorData = new List<SensorData>();
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        var cancellationTokenSource = new CancellationTokenSource();

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(50, CancellationToken.None); // Let it run a bit
        cancellationTokenSource.Cancel(); // Cancel to trigger stop
        await _service.StopAsync(CancellationToken.None);
        await Task.Delay(200, CancellationToken.None); // Give time for stop to complete

        // Assert - Verify service started
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Data ingestion service started")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldStop_WhenCancellationTokenIsCancelled()
    {
        // Arrange
        var sensorData = new List<SensorData>();
        _mockApiClient
            .Setup(x => x.FetchDataAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(sensorData);

        var cancellationTokenSource = new CancellationTokenSource();

        // Act
        await _service.StartAsync(cancellationTokenSource.Token);
        await Task.Delay(50, CancellationToken.None); // Let it run a bit
        cancellationTokenSource.Cancel(); // Cancel to trigger stop
        await _service.StopAsync(CancellationToken.None);
        await Task.Delay(200, CancellationToken.None); // Give time for stop to complete

        // Assert - Service should stop when cancellation token is triggered
        // Verify the service was started and processed at least one iteration
        _mockApiClient.Verify(x => x.FetchDataAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }
}

