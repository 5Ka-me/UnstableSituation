using DataIngestor.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;

namespace DataIngestor.Tests.Controllers;

public class HealthControllerTests
{
    [Fact]
    public void Get_ShouldReturnOkResult()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.Get();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Get_ShouldReturnHealthyStatus()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var response = value?.GetType().GetProperty("status")?.GetValue(value)?.ToString();
        response.Should().Be("healthy");
    }

    [Fact]
    public void Get_ShouldReturnTimestamp()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.Get() as OkObjectResult;
        var value = result?.Value;
        var timestamp = value?.GetType().GetProperty("timestamp")?.GetValue(value);

        // Assert
        timestamp.Should().NotBeNull();
        timestamp.Should().BeOfType<DateTime>();
    }

    [Fact]
    public void Get_ShouldReturnServiceName()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.Get() as OkObjectResult;
        var value = result?.Value;
        var service = value?.GetType().GetProperty("service")?.GetValue(value)?.ToString();

        // Assert
        service.Should().Be("data-ingestor");
    }

    [Fact]
    public void Get_ShouldReturnUtcTimestamp()
    {
        // Arrange
        var controller = new HealthController();
        var beforeUtc = DateTime.UtcNow;

        // Act
        var result = controller.Get() as OkObjectResult;
        var value = result?.Value;
        var timestamp = (DateTime)(value?.GetType().GetProperty("timestamp")?.GetValue(value) ?? DateTime.MinValue);
        var afterUtc = DateTime.UtcNow;

        // Assert
        timestamp.Should().BeAfter(beforeUtc.AddSeconds(-1));
        timestamp.Should().BeBefore(afterUtc.AddSeconds(1));
        timestamp.Kind.Should().Be(DateTimeKind.Utc);
    }
}

