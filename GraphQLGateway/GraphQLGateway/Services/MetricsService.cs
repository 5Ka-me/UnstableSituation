using System.Diagnostics.Metrics;

namespace GraphQLGateway.Services;

public static class MetricsService
{
    private static readonly Meter Meter = new("GraphQLGateway.Metrics");
    
    // Counters
    public static readonly Counter<long> GraphQLQueryCounter = Meter.CreateCounter<long>(
        "graphqlgateway_queries_total",
        "count",
        "Total number of GraphQL queries");
    
    public static readonly Counter<long> GraphQLErrorCounter = Meter.CreateCounter<long>(
        "graphqlgateway_errors_total",
        "count",
        "Total number of GraphQL errors");
    
    public static readonly Counter<long> SignalRNotificationCounter = Meter.CreateCounter<long>(
        "graphqlgateway_signalr_notifications_total",
        "count",
        "Total number of SignalR notifications sent");
    
    public static readonly Counter<long> DatabaseQueryCounter = Meter.CreateCounter<long>(
        "graphqlgateway_database_queries_total",
        "count",
        "Total number of database queries");
    
    // Histograms
    public static readonly Histogram<double> GraphQLQueryDuration = Meter.CreateHistogram<double>(
        "graphqlgateway_query_duration_seconds",
        "seconds",
        "Duration of GraphQL queries in seconds");
    
    public static readonly Histogram<double> DatabaseQueryDuration = Meter.CreateHistogram<double>(
        "graphqlgateway_database_query_duration_seconds",
        "seconds",
        "Duration of database queries in seconds");
}

