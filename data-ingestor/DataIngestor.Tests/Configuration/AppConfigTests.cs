using DataIngestor.Configuration;
using FluentAssertions;

namespace DataIngestor.Tests.Configuration;

public class AppConfigTests
{
    [Fact]
    public void ServerConfig_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var config = new ServerConfig();

        // Assert
        config.Port.Should().Be("8080");
        config.Host.Should().Be("0.0.0.0");
    }

    [Fact]
    public void ServerConfig_ShouldAllowCustomValues()
    {
        // Arrange
        var config = new ServerConfig
        {
            Port = "9090",
            Host = "localhost"
        };

        // Assert
        config.Port.Should().Be("9090");
        config.Host.Should().Be("localhost");
    }

    [Fact]
    public void ApiConfig_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var config = new ApiConfig();

        // Assert
        config.BaseUrl.Should().BeEmpty();
        config.Timeout.Should().Be("00:00:30");
        config.RetryCount.Should().Be(3);
    }

    [Theory]
    [InlineData("00:00:30", 30)]
    [InlineData("00:01:00", 60)]
    [InlineData("00:05:00", 300)]
    [InlineData("01:00:00", 3600)]
    public void ApiConfig_GetTimeout_ShouldParseTimeSpanFormat(string timeoutString, int expectedSeconds)
    {
        // Arrange
        var config = new ApiConfig
        {
            Timeout = timeoutString
        };

        // Act
        var result = config.GetTimeout();

        // Assert
        result.TotalSeconds.Should().Be(expectedSeconds);
    }

    [Theory]
    [InlineData("30s", 30)]
    [InlineData("60s", 60)]
    [InlineData("5m", 300)]
    [InlineData("1h", 3600)]
    [InlineData("2h", 7200)]
    [InlineData("10m", 600)]
    public void ApiConfig_GetTimeout_ShouldParseShortFormat(string timeoutString, int expectedSeconds)
    {
        // Arrange
        var config = new ApiConfig
        {
            Timeout = timeoutString
        };

        // Act
        var result = config.GetTimeout();

        // Assert
        result.TotalSeconds.Should().Be(expectedSeconds);
    }

    [Theory]
    [InlineData("30S", 30)]
    [InlineData("5M", 300)]
    [InlineData("1H", 3600)]
    public void ApiConfig_GetTimeout_ShouldBeCaseInsensitive(string timeoutString, int expectedSeconds)
    {
        // Arrange
        var config = new ApiConfig
        {
            Timeout = timeoutString
        };

        // Act
        var result = config.GetTimeout();

        // Assert
        result.TotalSeconds.Should().Be(expectedSeconds);
    }

    [Fact]
    public void ApiConfig_GetTimeout_ShouldReturnDefaultForInvalidFormat()
    {
        // Arrange
        var config = new ApiConfig
        {
            Timeout = "invalid-format"
        };

        // Act
        var result = config.GetTimeout();

        // Assert
        result.TotalSeconds.Should().Be(30);
    }

    [Fact]
    public void ApiConfig_GetTimeout_ShouldReturnDefaultForEmptyString()
    {
        // Arrange
        var config = new ApiConfig
        {
            Timeout = string.Empty
        };

        // Act
        var result = config.GetTimeout();

        // Assert
        result.TotalSeconds.Should().Be(30);
    }

    [Fact]
    public void RabbitMQConfig_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var config = new RabbitMQConfig();

        // Assert
        config.Url.Should().BeEmpty();
        config.ExchangeName.Should().Be("meter-data-exchange");
        config.QueueName.Should().Be("meter-data-queue");
        config.RoutingKey.Should().Be("meter.data");
    }

    [Fact]
    public void RabbitMQConfig_ShouldAllowCustomValues()
    {
        // Arrange
        var config = new RabbitMQConfig
        {
            Url = "amqp://localhost:5672",
            ExchangeName = "custom-exchange",
            QueueName = "custom-queue",
            RoutingKey = "custom.key"
        };

        // Assert
        config.Url.Should().Be("amqp://localhost:5672");
        config.ExchangeName.Should().Be("custom-exchange");
        config.QueueName.Should().Be("custom-queue");
        config.RoutingKey.Should().Be("custom.key");
    }

    [Fact]
    public void LoggingConfig_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var config = new LoggingConfig();

        // Assert
        config.Level.Should().Be("Information");
    }

    [Fact]
    public void LoggingConfig_ShouldAllowCustomValues()
    {
        // Arrange
        var config = new LoggingConfig
        {
            Level = "Debug"
        };

        // Assert
        config.Level.Should().Be("Debug");
    }
}

