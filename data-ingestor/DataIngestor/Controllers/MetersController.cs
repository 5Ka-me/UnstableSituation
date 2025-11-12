using DataIngestor.Models;
using DataIngestor.Services;
using Microsoft.AspNetCore.Mvc;

namespace DataIngestor.Controllers;

[ApiController]
[Route("[controller]")]
public class MetersController : ControllerBase
{
    private readonly IApiClientService _apiClient;
    private readonly IRabbitMQService _rabbitMQService;
    private readonly ILogger<MetersController> _logger;

    public MetersController(
        IApiClientService apiClient,
        IRabbitMQService rabbitMQService,
        ILogger<MetersController> logger)
    {
        _apiClient = apiClient;
        _rabbitMQService = rabbitMQService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Ingest(CancellationToken cancellationToken)
    {
        try
        {
            var data = await _apiClient.FetchDataAsync(cancellationToken);
            _rabbitMQService.Publish(data);

            return Ok(new
            {
                message = "Data ingested successfully",
                data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to ingest data");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

