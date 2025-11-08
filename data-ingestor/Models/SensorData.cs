namespace DataIngestor.Models;

public class SensorData
{
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, object> Payload { get; set; } = new();
}

