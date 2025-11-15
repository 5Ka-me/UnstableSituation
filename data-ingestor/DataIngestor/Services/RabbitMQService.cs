using System.Diagnostics;
using System.Text;
using System.Text.Json;
using DataIngestor.Configuration;
using DataIngestor.Models;
using Polly;
using RabbitMQ.Client;

namespace DataIngestor.Services;

public class RabbitMQService : IRabbitMQService
{
    private readonly RabbitMQConfig _config;
    private readonly ILogger<RabbitMQService> _logger;
    private readonly IAsyncPolicy _retryPolicy;
    private IConnection? _connection;
    private IModel? _channel;

    public RabbitMQService(RabbitMQConfig config, ILogger<RabbitMQService> logger)
    {
        _config = config;
        _logger = logger;
        _retryPolicy = PollyPolicies.GetRabbitMQRetryPolicy(
            _config.RetryCount,
            _config.GetRetryDelay(),
            _logger);
    }

    public void Connect()
    {
        try
        {
            _retryPolicy.ExecuteAsync(async () =>
            {
                await Task.Run(() =>
                {
                    var factory = new ConnectionFactory
                    {
                        Uri = new Uri(_config.Url)
                    };

                    _connection = factory.CreateConnection();
                    _channel = _connection.CreateModel();

                    _channel.ConfirmSelect();

                    _channel.ExchangeDeclare(
                        exchange: _config.ExchangeName,
                        type: ExchangeType.Topic,
                        durable: true,
                        autoDelete: false,
                        arguments: null);

                    var queueDeclareResult = _channel.QueueDeclare(
                        queue: _config.QueueName,
                        durable: true,
                        exclusive: false,
                        autoDelete: false,
                        arguments: null);

                    _channel.QueueBind(
                        queue: _config.QueueName,
                        exchange: _config.ExchangeName,
                        routingKey: _config.RoutingKey,
                        arguments: null);

                    _logger.LogInformation(
                        "Connected to RabbitMQ successfully. Exchange: {Exchange}, Queue: {Queue} (Messages: {MessageCount}, Consumers: {ConsumerCount}), RoutingKey: {RoutingKey}", 
                        _config.ExchangeName, 
                        _config.QueueName,
                        queueDeclareResult.MessageCount,
                        queueDeclareResult.ConsumerCount,
                        _config.RoutingKey);
                });
                return Task.CompletedTask;
            }).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to RabbitMQ after retries");
            throw;
        }
    }

    public void Publish(List<SensorData> data)
    {
        if (_channel == null || _connection == null || !_connection.IsOpen)
        {
            throw new InvalidOperationException("RabbitMQ connection is not established");
        }

        var stopwatch = Stopwatch.StartNew();
        try
        {
            _retryPolicy.ExecuteAsync(async () =>
            {
                await Task.Run(() =>
                {
                    var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        WriteIndented = false
                    });
                    var body = Encoding.UTF8.GetBytes(json);

                    var properties = _channel!.CreateBasicProperties();
                    properties.Persistent = true;
                    properties.ContentType = "application/json";

                    _channel.BasicPublish(
                        exchange: _config.ExchangeName,
                        routingKey: _config.RoutingKey,
                        basicProperties: properties,
                        body: body);

                    if (!_channel.WaitForConfirms(TimeSpan.FromSeconds(5)))
                    {
                        _logger.LogWarning("Publisher confirmation timeout for message");
                    }

                    MetricsService.RabbitMQPublishCounter.Add(1);
                    MetricsService.DataPublishedCounter.Add(data.Count);
                    MetricsService.RabbitMQPublishDuration.Record(stopwatch.Elapsed.TotalSeconds);

                    var types = data.Select(d => d.Type).ToList();
                    _logger.LogInformation(
                        "Data published to exchange '{Exchange}' with routing key '{RoutingKey}'. Count: {Count}, Types: {Types}",
                        _config.ExchangeName,
                        _config.RoutingKey,
                        data.Count,
                        string.Join(", ", types));
                });
                return Task.CompletedTask;
            }).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            MetricsService.RabbitMQErrorCounter.Add(1);
            MetricsService.RabbitMQPublishDuration.Record(stopwatch.Elapsed.TotalSeconds);
            _logger.LogError(ex, "Failed to publish message to queue after retries");
            throw;
        }
        finally
        {
            stopwatch.Stop();
        }
    }

    public void Dispose()
    {
        _channel?.Close();
        _channel?.Dispose();
        _connection?.Close();
        _connection?.Dispose();
    }
}

