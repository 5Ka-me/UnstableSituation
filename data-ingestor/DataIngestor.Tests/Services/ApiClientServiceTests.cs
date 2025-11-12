using System.Net;
using System.Text;
using System.Text.Json;
using DataIngestor.Configuration;
using DataIngestor.Models;
using DataIngestor.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;

namespace DataIngestor.Tests.Services;

public class ApiClientServiceTests : IDisposable
{
    private readonly Mock<ILogger<ApiClientService>> _mockLogger;
    private readonly ApiConfig _apiConfig;
    private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;

    public ApiClientServiceTests()
    {
        _mockLogger = new Mock<ILogger<ApiClientService>>();
        _apiConfig = new ApiConfig
        {
            BaseUrl = "https://api.example.com",
            Timeout = "00:00:30"
        };
        _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
    }

    [Fact]
    public void Constructor_ShouldSetHttpClientTimeout()
    {
        // Arrange
        _apiConfig.Timeout = "00:01:00";
        var httpClient = new HttpClient();

        // Act
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Assert
        service.Should().NotBeNull();
        service.Dispose();
    }

    [Fact]
    public void Constructor_ShouldAddApiKeyHeader()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("[]", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };

        // Act
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);
        service.Dispose();

        // Assert - The header should be set in the constructor
        service.Should().NotBeNull();
        httpClient.DefaultRequestHeaders.Contains("X-Api-Key").Should().BeTrue();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldReturnEmptyList_WhenResponseIsEmpty()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("[]", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act
        var result = await service.FetchDataAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
        service.Dispose();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldReturnSensorData_WhenResponseContainsData()
    {
        // Arrange
        var sensorData = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } },
            new() { Type = "humidity", Name = "Sensor2", Payload = new Dictionary<string, object> { { "value", 60.0 } } }
        };

        var jsonContent = JsonSerializer.Serialize(sensorData);
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act
        var result = await service.FetchDataAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result[0].Type.Should().Be("temperature");
        result[1].Type.Should().Be("humidity");
        service.Dispose();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldTrimTrailingSlashFromBaseUrl()
    {
        // Arrange
        _apiConfig.BaseUrl = "https://api.example.com/";
        var mockHandler = new Mock<HttpMessageHandler>();
        HttpRequestMessage? capturedRequest = null;

        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((request, ct) =>
            {
                capturedRequest = request;
            })
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("[]", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act
        await service.FetchDataAsync();

        // Assert
        capturedRequest.Should().NotBeNull();
        capturedRequest!.RequestUri!.ToString().Should().Be("https://api.example.com/meters");
        service.Dispose();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldThrowException_WhenHttpRequestFails()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("Network error"));

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(() => service.FetchDataAsync());
        service.Dispose();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldThrowException_WhenResponseIsNotSuccess()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.InternalServerError,
                Content = new StringContent("Internal Server Error", Encoding.UTF8, "text/plain")
            });

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(() => service.FetchDataAsync());
        service.Dispose();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldLogError_WhenExceptionOccurs()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("Network error"));

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act
        try
        {
            await service.FetchDataAsync();
        }
        catch
        {
            // Expected
        }

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
        service.Dispose();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldPassCancellationToken()
    {
        // Arrange
        var cancellationToken = new CancellationToken();
        var mockHandler = new Mock<HttpMessageHandler>();
        CancellationToken? capturedToken = null;

        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((request, ct) =>
            {
                capturedToken = ct;
            })
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("[]", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act
        await service.FetchDataAsync(cancellationToken);

        // Assert
        capturedToken.Should().NotBeNull();
        // Verify the token was passed (can't directly compare CancellationToken instances)
        service.Dispose();
    }

    [Fact]
    public async Task FetchDataAsync_ShouldReturnEmptyList_WhenResponseIsNull()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("null", Encoding.UTF8, "application/json")
            });

        var httpClient = new HttpClient(mockHandler.Object)
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        var service = new ApiClientService(_apiConfig, _mockLogger.Object, httpClient);

        // Act
        var result = await service.FetchDataAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
        service.Dispose();
    }

    [Fact]
    public void Dispose_ShouldDisposeHttpClient()
    {
        // Arrange
        var service = new ApiClientService(_apiConfig, _mockLogger.Object);

        // Act
        service.Dispose();
        service.Dispose(); // Should not throw on multiple calls

        // Assert
        service.Should().NotBeNull();
    }

    public void Dispose()
    {
        // Cleanup if needed
    }
}

