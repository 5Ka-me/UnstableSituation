using DataIngestor.Models;
using FluentAssertions;
using System.Text.Json;

namespace DataIngestor.Tests.Models;

public class SensorDataTests
{
    [Fact]
    public void SensorData_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var sensorData = new SensorData();

        // Assert
        sensorData.Type.Should().BeEmpty();
        sensorData.Name.Should().BeEmpty();
        sensorData.Payload.Should().NotBeNull();
        sensorData.Payload.Should().BeEmpty();
    }

    [Fact]
    public void SensorData_ShouldAllowSettingProperties()
    {
        // Arrange
        var sensorData = new SensorData
        {
            Type = "temperature",
            Name = "Sensor1",
            Payload = new Dictionary<string, object>
            {
                { "value", 25.5 },
                { "unit", "celsius" }
            }
        };

        // Assert
        sensorData.Type.Should().Be("temperature");
        sensorData.Name.Should().Be("Sensor1");
        sensorData.Payload.Should().HaveCount(2);
        sensorData.Payload["value"].Should().Be(25.5);
        sensorData.Payload["unit"].Should().Be("celsius");
    }

    [Fact]
    public void SensorData_ShouldSerializeWithJsonPropertyNames()
    {
        // Arrange
        var sensorData = new SensorData
        {
            Type = "temperature",
            Name = "Sensor1",
            Payload = new Dictionary<string, object> { { "value", 25.5 } }
        };

        // Act
        var json = JsonSerializer.Serialize(sensorData, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        // Assert
        json.Should().Contain("\"type\"");
        json.Should().Contain("\"name\"");
        json.Should().Contain("\"payload\"");
        json.Should().Contain("temperature");
        json.Should().Contain("Sensor1");
    }

    [Fact]
    public void SensorData_ShouldDeserializeFromJson()
    {
        // Arrange
        var json = """
        {
            "type": "humidity",
            "name": "Sensor2",
            "payload": {
                "value": 60.0,
                "unit": "percent"
            }
        }
        """;

        // Act
        var sensorData = JsonSerializer.Deserialize<SensorData>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        // Assert
        sensorData.Should().NotBeNull();
        sensorData!.Type.Should().Be("humidity");
        sensorData.Name.Should().Be("Sensor2");
        sensorData.Payload.Should().HaveCount(2);
        
        // JsonElement needs special handling
        var valueElement = (System.Text.Json.JsonElement)sensorData.Payload["value"];
        valueElement.GetDouble().Should().Be(60.0);
        sensorData.Payload["unit"].ToString().Should().Be("percent");
    }

    [Fact]
    public void SensorData_ShouldHandleEmptyPayload()
    {
        // Arrange
        var sensorData = new SensorData
        {
            Type = "pressure",
            Name = "Sensor3",
            Payload = new Dictionary<string, object>()
        };

        // Assert
        sensorData.Payload.Should().BeEmpty();
    }

    [Fact]
    public void SensorData_ShouldHandleComplexPayload()
    {
        // Arrange
        var sensorData = new SensorData
        {
            Type = "multi-sensor",
            Name = "Sensor4",
            Payload = new Dictionary<string, object>
            {
                { "temperature", 25.5 },
                { "humidity", 60.0 },
                { "pressure", 1013.25 },
                { "timestamp", DateTime.UtcNow.ToString("O") },
                { "status", "active" }
            }
        };

        // Assert
        sensorData.Payload.Should().HaveCount(5);
        sensorData.Payload.Should().ContainKey("temperature");
        sensorData.Payload.Should().ContainKey("humidity");
        sensorData.Payload.Should().ContainKey("pressure");
        sensorData.Payload.Should().ContainKey("timestamp");
        sensorData.Payload.Should().ContainKey("status");
    }

    [Fact]
    public void SensorData_ShouldBeSerializableInList()
    {
        // Arrange
        var sensorDataList = new List<SensorData>
        {
            new() { Type = "temperature", Name = "Sensor1", Payload = new Dictionary<string, object> { { "value", 25.5 } } },
            new() { Type = "humidity", Name = "Sensor2", Payload = new Dictionary<string, object> { { "value", 60.0 } } }
        };

        // Act
        var json = JsonSerializer.Serialize(sensorDataList, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var deserialized = JsonSerializer.Deserialize<List<SensorData>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        // Assert
        deserialized.Should().NotBeNull();
        deserialized.Should().HaveCount(2);
        deserialized![0].Type.Should().Be("temperature");
        deserialized[1].Type.Should().Be("humidity");
    }
}

