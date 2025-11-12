using System.Text.Json;
using DataIngestor.Configuration;
using DataIngestor.Models;

namespace DataIngestor.Services;

public class ApiClientService : IApiClientService
{
    private readonly HttpClient _httpClient;
    private readonly ApiConfig _apiConfig;
    private readonly ILogger<ApiClientService> _logger;
    private readonly bool _disposeHttpClient;

    public ApiClientService(ApiConfig apiConfig, ILogger<ApiClientService> logger)
        : this(apiConfig, logger, null)
    {
    }

    public ApiClientService(ApiConfig apiConfig, ILogger<ApiClientService> logger, HttpClient? httpClient)
    {
        _apiConfig = apiConfig;
        _logger = logger;
        
        if (httpClient != null)
        {
            _httpClient = httpClient;
            _disposeHttpClient = false;
        }
        else
        {
            _httpClient = new HttpClient
            {
                Timeout = _apiConfig.GetTimeout()
            };
            _disposeHttpClient = true;
        }
        
        if (!_httpClient.DefaultRequestHeaders.Contains("X-Api-Key"))
        {
            _httpClient.DefaultRequestHeaders.Add("X-Api-Key", "supersecret");
        }
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
        if (_disposeHttpClient)
        {
            _httpClient?.Dispose();
        }
    }
}

