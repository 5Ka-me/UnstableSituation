using DataIngestor.Configuration;
using DataIngestor.Services;
using DataIngestor.Validators;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.Options;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using Serilog;
using Serilog.Events;
using System.Diagnostics.Metrics;

var builder = WebApplication.CreateBuilder(args);

var logLevel = builder.Configuration.GetValue<string>("Logging:Level") ?? "Information";
var serilogLevel = Enum.TryParse<LogEventLevel>(logLevel, true, out var level)
    ? level
    : LogEventLevel.Information;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Is(serilogLevel)
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// OpenTelemetry configuration
var serviceName = "data-ingestor";
var serviceVersion = "1.0.0";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName: serviceName, serviceVersion: serviceVersion))
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddMeter("DataIngestor.Metrics")
            .AddPrometheusExporter();
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<SensorDataValidator>();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

// Configure and validate options
builder.Services.AddOptions<ServerConfig>()
    .Bind(builder.Configuration.GetSection("Server"))
    .ValidateOnStart();

builder.Services.AddOptions<ApiConfig>()
    .Bind(builder.Configuration.GetSection("Api"))
    .ValidateOnStart();

builder.Services.AddOptions<RabbitMQConfig>()
    .Bind(builder.Configuration.GetSection("RabbitMQ"))
    .ValidateOnStart();

builder.Services.AddOptions<LoggingConfig>()
    .Bind(builder.Configuration.GetSection("Logging"));

// Validate configuration on startup
builder.Services.AddSingleton<IValidateOptions<ServerConfig>, ServerConfigOptionsValidator>();
builder.Services.AddSingleton<IValidateOptions<ApiConfig>, ApiConfigOptionsValidator>();
builder.Services.AddSingleton<IValidateOptions<RabbitMQConfig>, RabbitMQConfigOptionsValidator>();

builder.Services.AddSingleton<IApiClientService>(sp =>
{
    var apiConfig = sp.GetRequiredService<IOptions<ApiConfig>>().Value;
    var logger = sp.GetRequiredService<ILogger<ApiClientService>>();
    
    var httpPolicy = PollyPolicies.GetHttpPolicy(
        apiConfig.RetryCount,
        apiConfig.CircuitBreakerFailureThreshold,
        apiConfig.GetCircuitBreakerDuration(),
        apiConfig.GetTimeout(),
        logger);
    
    return new ApiClientService(apiConfig, logger, httpPolicy);
});

builder.Services.AddSingleton<IRabbitMQService>(sp =>
{
    var rabbitMQConfig = sp.GetRequiredService<IOptions<RabbitMQConfig>>().Value;
    var logger = sp.GetRequiredService<ILogger<RabbitMQService>>();
    
    var service = new RabbitMQService(rabbitMQConfig, logger);
    service.Connect();
    return service;
});

builder.Services.AddHostedService<DataIngestionService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
}
app.UseSwagger();
app.UseSwaggerUI();

// Prometheus metrics endpoint
app.MapPrometheusScrapingEndpoint();

app.UseAuthorization();
app.MapControllers();

var serverConfig = app.Services.GetRequiredService<IOptions<ServerConfig>>().Value;
var serverAddress = $"{serverConfig.Host}:{serverConfig.Port}";
app.Urls.Add($"http://{serverAddress}");

Log.Information("Starting HTTP server on {Address}", serverAddress);

try
{
    app.Run();
}
finally
{
    Log.CloseAndFlush();
}
