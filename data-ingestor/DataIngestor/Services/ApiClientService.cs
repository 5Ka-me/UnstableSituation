using System.Diagnostics;
using System.Text.Json;
using DataIngestor.Configuration;
using DataIngestor.Models;
using Polly;

namespace DataIngestor.Services;

public class ApiClientService : IApiClientService
{
    private readonly HttpClient _httpClient;
    private readonly ApiConfig _apiConfig;
    private readonly ILogger<ApiClientService> _logger;
    private readonly IAsyncPolicy<HttpResponseMessage> _httpPolicy;
    private readonly bool _disposeHttpClient;

    public ApiClientService(
        ApiConfig apiConfig,
        ILogger<ApiClientService> logger,
        IAsyncPolicy<HttpResponseMessage>? httpPolicy = null)
        : this(apiConfig, logger, null, httpPolicy)
    {
    }

    public ApiClientService(
        ApiConfig apiConfig,
        ILogger<ApiClientService> logger,
        HttpClient? httpClient,
        IAsyncPolicy<HttpResponseMessage>? httpPolicy = null)
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
                Timeout = TimeSpan.FromMinutes(5) // Longer timeout, actual timeout handled by Polly
            };
            _disposeHttpClient = true;
        }
        
        if (!_httpClient.DefaultRequestHeaders.Contains("X-Api-Key"))
        {
            _httpClient.DefaultRequestHeaders.Add("X-Api-Key", "supersecret");
        }

        _httpPolicy = httpPolicy ?? PollyPolicies.GetHttpPolicy(
            _apiConfig.RetryCount,
            _apiConfig.CircuitBreakerFailureThreshold,
            _apiConfig.GetCircuitBreakerDuration(),
            _apiConfig.GetTimeout(),
            _logger);
    }

    public async Task<List<SensorData>> FetchDataAsync(CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var url = $"{_apiConfig.BaseUrl.TrimEnd('/')}/meters";
            
            _logger.LogDebug("Fetching data from {Url}", url);
            
            MetricsService.ApiRequestCounter.Add(1, new KeyValuePair<string, object?>("endpoint", "/meters"));
            
            var response = await _httpPolicy.ExecuteAsync(async () =>
                await _httpClient.GetAsync(url, cancellationToken));

            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var data = JsonSerializer.Deserialize<List<SensorData>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            var dataCount = data?.Count ?? 0;
            MetricsService.DataFetchedCounter.Add(dataCount);
            MetricsService.ApiRequestDuration.Record(stopwatch.Elapsed.TotalSeconds);

            _logger.LogDebug("Successfully fetched {Count} sensor data items", dataCount);
            return data ?? new List<SensorData>();
        }
        catch (Exception ex)
        {
            MetricsService.ApiErrorCounter.Add(1);
            MetricsService.ApiRequestDuration.Record(stopwatch.Elapsed.TotalSeconds);
            _logger.LogError(ex, "Failed to fetch data from API after retries");
            throw;
        }
        finally
        {
            stopwatch.Stop();
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

