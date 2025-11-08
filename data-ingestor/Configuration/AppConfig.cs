namespace DataIngestor.Configuration;

public class ServerConfig
{
    public string Port { get; set; } = "8080";
    public string Host { get; set; } = "0.0.0.0";
}

public class ApiConfig
{
    public string BaseUrl { get; set; } = string.Empty;
    public string Timeout { get; set; } = "00:00:30"; // TimeSpan format
    public int RetryCount { get; set; } = 3;

    public TimeSpan GetTimeout()
    {
        if (TimeSpan.TryParse(Timeout, out var timeout))
            return timeout;
        
        // Fallback: try to parse "30s" format
        var match = System.Text.RegularExpressions.Regex.Match(Timeout, @"(\d+)([smh])", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var value = int.Parse(match.Groups[1].Value);
            var unit = match.Groups[2].Value.ToLower();
            return unit switch
            {
                "s" => TimeSpan.FromSeconds(value),
                "m" => TimeSpan.FromMinutes(value),
                "h" => TimeSpan.FromHours(value),
                _ => TimeSpan.FromSeconds(30)
            };
        }

        return TimeSpan.FromSeconds(30);
    }
}

public class RabbitMQConfig
{
    public string Url { get; set; } = string.Empty;
    public string ExchangeName { get; set; } = "meter-data-exchange";
    public string QueueName { get; set; } = "meter-data-queue";
    public string RoutingKey { get; set; } = "meter.data";
}

public class LoggingConfig
{
    public string Level { get; set; } = "Information";
}

