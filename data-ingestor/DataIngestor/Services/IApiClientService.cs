using DataIngestor.Models;

namespace DataIngestor.Services;

public interface IApiClientService : IDisposable
{
    Task<List<SensorData>> FetchDataAsync(CancellationToken cancellationToken = default);
}

