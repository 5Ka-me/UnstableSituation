using System.Text;
using System.Text.Json;
using DataIngestor.Configuration;
using DataIngestor.Models;
using RabbitMQ.Client;

namespace DataIngestor.Services;

public class RabbitMQService : IDisposable
{
    private readonly RabbitMQConfig _config;
    private readonly ILogger<RabbitMQService> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public RabbitMQService(RabbitMQConfig config, ILogger<RabbitMQService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public void Connect()
    {
        try
        {
            // Use ConnectionFactory with URI - it handles amqp:// URLs correctly
            var factory = new ConnectionFactory
            {
                Uri = new Uri(_config.Url)
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.QueueDeclare(
                queue: _config.QueueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null);

            _logger.LogInformation("Connected to RabbitMQ successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to RabbitMQ");
            throw;
        }
    }

    public void Publish(List<SensorData> data)
    {
        if (_channel == null || _connection == null || !_connection.IsOpen)
        {
            throw new InvalidOperationException("RabbitMQ connection is not established");
        }

        try
        {
            var json = JsonSerializer.Serialize(data);
            var body = Encoding.UTF8.GetBytes(json);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";

            _channel.BasicPublish(
                exchange: "",
                routingKey: _config.QueueName,
                basicProperties: properties,
                body: body);

            var types = data.Select(d => d.Type).ToList();
            _logger.LogInformation(
                "Data published to queue. Count: {Count}, Types: {Types}",
                data.Count,
                string.Join(", ", types));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish message to queue");
            throw;
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

