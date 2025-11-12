using DataIngestor.Configuration;
using DataIngestor.Services;
using Serilog;
using Serilog.Events;

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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<ServerConfig>(builder.Configuration.GetSection("Server"));
builder.Services.Configure<ApiConfig>(builder.Configuration.GetSection("Api"));
builder.Services.Configure<RabbitMQConfig>(builder.Configuration.GetSection("RabbitMQ"));
builder.Services.Configure<LoggingConfig>(builder.Configuration.GetSection("Logging"));

builder.Services.AddSingleton<IApiClientService>(sp =>
{
    var apiConfig = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ApiConfig>>().Value;
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
    var rabbitMQConfig = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<RabbitMQConfig>>().Value;
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

app.UseAuthorization();
app.MapControllers();

var serverConfig = app.Configuration.GetSection("Server").Get<ServerConfig>() ?? new ServerConfig();
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
