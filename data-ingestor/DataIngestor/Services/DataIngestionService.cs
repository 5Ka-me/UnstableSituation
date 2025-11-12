using DataIngestor.Models;
using DataIngestor.Services;

namespace DataIngestor.Services;

public class DataIngestionService : BackgroundService
{
    private readonly IApiClientService _apiClient;
    private readonly IRabbitMQService _rabbitMQService;
    private readonly ILogger<DataIngestionService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(5);

    public DataIngestionService(
        IApiClientService apiClient,
        IRabbitMQService rabbitMQService,
        ILogger<DataIngestionService> logger)
    {
        _apiClient = apiClient;
        _rabbitMQService = rabbitMQService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Data ingestion service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var data = await _apiClient.FetchDataAsync(stoppingToken);
                _rabbitMQService.Publish(data);
                
                var types = data.Select(d => d.Type).ToList();
                _logger.LogInformation(
                    "Successfully processed data. Count: {Count}, Types: {Types}",
                    data.Count,
                    string.Join(", ", types));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during data ingestion");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("Data ingestion service stopped");
    }
}

