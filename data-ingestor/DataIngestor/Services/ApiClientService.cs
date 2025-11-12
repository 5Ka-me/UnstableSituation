using System.Text.Json;
using DataIngestor.Configuration;
using DataIngestor.Models;

namespace DataIngestor.Services;

public class ApiClientService : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly ApiConfig _apiConfig;
    private readonly ILogger<ApiClientService> _logger;

    public ApiClientService(ApiConfig apiConfig, ILogger<ApiClientService> logger)
    {
        _apiConfig = apiConfig;
        _logger = logger;
        _httpClient = new HttpClient
        {
            Timeout = _apiConfig.GetTimeout()
        };
        
        _httpClient.DefaultRequestHeaders.Add("X-Api-Key", "supersecret");
    }

    public async Task<List<SensorData>> FetchDataAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"{_apiConfig.BaseUrl.TrimEnd('/')}/meters";
            var response = await _httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var data = JsonSerializer.Deserialize<List<SensorData>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return data ?? new List<SensorData>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch data from API");
            throw;
        }
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}

