using System.Text.Json.Serialization;

namespace DataIngestor.Models;

public class SensorData
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("payload")]
    public Dictionary<string, object> Payload { get; set; } = new();
}

