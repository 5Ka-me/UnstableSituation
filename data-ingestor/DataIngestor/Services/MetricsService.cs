using System.Diagnostics.Metrics;

namespace DataIngestor.Services;

public static class MetricsService
{
    private static readonly Meter Meter = new("DataIngestor.Metrics");
    
    // Counters
    public static readonly Counter<long> DataFetchedCounter = Meter.CreateCounter<long>(
        "dataingestor_data_fetched_total",
        "count",
        "Total number of data fetches from external API");
    
    public static readonly Counter<long> DataPublishedCounter = Meter.CreateCounter<long>(
        "dataingestor_data_published_total",
        "count",
        "Total number of data items published to RabbitMQ");
    
    public static readonly Counter<long> ApiRequestCounter = Meter.CreateCounter<long>(
        "dataingestor_api_requests_total",
        "count",
        "Total number of API requests");
    
    public static readonly Counter<long> ApiErrorCounter = Meter.CreateCounter<long>(
        "dataingestor_api_errors_total",
        "count",
        "Total number of API errors");
    
    public static readonly Counter<long> RabbitMQPublishCounter = Meter.CreateCounter<long>(
        "dataingestor_rabbitmq_publish_total",
        "count",
        "Total number of messages published to RabbitMQ");
    
    public static readonly Counter<long> RabbitMQErrorCounter = Meter.CreateCounter<long>(
        "dataingestor_rabbitmq_errors_total",
        "count",
        "Total number of RabbitMQ errors");
    
    // Gauges
    public static readonly ObservableGauge<long> DataIngestionInterval = Meter.CreateObservableGauge<long>(
        "dataingestor_ingestion_interval_seconds",
        () => 5,
        "seconds",
        "Data ingestion interval in seconds");
    
    // Histograms
    public static readonly Histogram<double> ApiRequestDuration = Meter.CreateHistogram<double>(
        "dataingestor_api_request_duration_seconds",
        "seconds",
        "Duration of API requests in seconds");
    
    public static readonly Histogram<double> RabbitMQPublishDuration = Meter.CreateHistogram<double>(
        "dataingestor_rabbitmq_publish_duration_seconds",
        "seconds",
        "Duration of RabbitMQ publish operations in seconds");
}

