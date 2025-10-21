using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraphQLGateway.Data;
using System.ComponentModel.DataAnnotations;

namespace GraphQLGateway.Controllers;

/// <summary>
/// Debug controller providing health checks, database connectivity tests, and sensor data access for development and monitoring purposes.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DebugController : ControllerBase
{
    private readonly SensorDbContext _context;

    public DebugController(SensorDbContext context)
    {
        _context = context;
    }
    /// <summary>
    /// Health check endpoint to verify service status
    /// </summary>
    /// <returns>Service health status with timestamp</returns>
    /// <response code="200">Service is healthy</response>
    [HttpGet("health")]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        return Ok(new HealthResponse
        {
            Status = "healthy",
            Timestamp = DateTime.UtcNow,
            Service = "GraphQL Gateway Debug API"
        });
    }

    /// <summary>
    /// Test endpoint to verify API functionality
    /// </summary>
    /// <returns>Test response with environment information</returns>
    /// <response code="200">API is working correctly</response>
    [HttpGet("test")]
    [ProducesResponseType(typeof(TestResponse), StatusCodes.Status200OK)]
    public IActionResult Test()
    {
        return Ok(new TestResponse
        {
            Message = "Debug API is working!",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
        });
    }

    /// <summary>
    /// Database connectivity test endpoint
    /// </summary>
    /// <returns>Database connection status and sensor readings count</returns>
    /// <response code="200">Database connection successful</response>
    /// <response code="400">Database connection failed</response>
    [HttpGet("database")]
    [ProducesResponseType(typeof(DatabaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Database()
    {
        try
        {
            // Test database connectivity using Entity Framework
            var count = await _context.SensorReadings.CountAsync();

            return Ok(new DatabaseResponse
            {
                Status = "connected",
                SensorReadingsCount = count,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse
            {
                Status = "error",
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Retrieve sensor readings from the database
    /// </summary>
    /// <param name="limit">Maximum number of readings to return (default: 10, max: 100)</param>
    /// <returns>List of sensor readings with metadata</returns>
    /// <response code="200">Sensor readings retrieved successfully</response>
    /// <response code="400">Error retrieving sensor readings</response>
    [HttpGet("sensor-readings")]
    [ProducesResponseType(typeof(SensorReadingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSensorReadings([FromQuery] [Range(1, 100)] int limit = 10)
    {
        try
        {
            // Use Entity Framework instead of raw SQL
            var readings = await _context.SensorReadings
                .OrderByDescending(r => r.Timestamp)
                .Take(limit)
                .Select(r => new SensorReadingDto
                {
                    Id = r.Id,
                    SensorType = r.SensorType,
                    SensorName = r.SensorName,
                    Payload = r.Payload,
                    Timestamp = r.Timestamp
                })
                .ToListAsync();

            return Ok(new SensorReadingsResponse
            {
                Count = readings.Count,
                Data = readings,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse
            {
                Status = "error",
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}

#region Response Models

/// <summary>
/// Health check response model
/// </summary>
public class HealthResponse
{
    /// <summary>
    /// Service health status
    /// </summary>
    public string Status { get; set; } = string.Empty;
    
    /// <summary>
    /// Response timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
    
    /// <summary>
    /// Service name
    /// </summary>
    public string Service { get; set; } = string.Empty;
}

/// <summary>
/// Test response model
/// </summary>
public class TestResponse
{
    /// <summary>
    /// Test message
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Response timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
    
    /// <summary>
    /// Current environment
    /// </summary>
    public string Environment { get; set; } = string.Empty;
}

/// <summary>
/// Database connectivity response model
/// </summary>
public class DatabaseResponse
{
    /// <summary>
    /// Database connection status
    /// </summary>
    public string Status { get; set; } = string.Empty;
    
    /// <summary>
    /// Total number of sensor readings in database
    /// </summary>
    public long SensorReadingsCount { get; set; }
    
    /// <summary>
    /// Response timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Sensor readings response model
/// </summary>
public class SensorReadingsResponse
{
    /// <summary>
    /// Number of readings returned
    /// </summary>
    public int Count { get; set; }
    
    /// <summary>
    /// List of sensor readings
    /// </summary>
    public List<SensorReadingDto> Data { get; set; } = new();
    
    /// <summary>
    /// Response timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Individual sensor reading data transfer object
/// </summary>
public class SensorReadingDto
{
    /// <summary>
    /// Unique identifier for the sensor reading
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Type of sensor (energy, air_quality, humidity, motion)
    /// </summary>
    public string SensorType { get; set; } = string.Empty;
    
    /// <summary>
    /// Name or location identifier of the sensor
    /// </summary>
    public string SensorName { get; set; } = string.Empty;
    
    /// <summary>
    /// JSON payload containing sensor-specific data
    /// </summary>
    public string Payload { get; set; } = string.Empty;
    
    /// <summary>
    /// Timestamp when the sensor reading was taken
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Error response model
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// Error status
    /// </summary>
    public string Status { get; set; } = string.Empty;
    
    /// <summary>
    /// Error message
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// Response timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
}

#endregion
