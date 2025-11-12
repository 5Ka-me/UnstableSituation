using DataIngestor.Models;

namespace DataIngestor.Services;

public interface IRabbitMQService : IDisposable
{
    void Connect();
    void Publish(List<SensorData> data);
}

