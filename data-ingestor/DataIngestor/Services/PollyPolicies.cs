using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Retry;
using Polly.Timeout;

namespace DataIngestor.Services;

public static class PollyPolicies
{
    public static IAsyncPolicy<HttpResponseMessage> GetHttpRetryPolicy(int retryCount, ILogger logger)
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => !msg.IsSuccessStatusCode)
            .Or<TimeoutRejectedException>()
            .WaitAndRetryAsync(
                retryCount: retryCount,
                sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    logger.LogWarning(
                        "HTTP request failed. Retry {RetryCount}/{MaxRetries} after {Delay}s. Error: {Error}",
                        retryCount,
                        retryCount,
                        timespan.TotalSeconds,
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString() ?? "Unknown");
                });
    }

    public static IAsyncPolicy<HttpResponseMessage> GetHttpCircuitBreakerPolicy(
        int failureThreshold,
        TimeSpan duration,
        ILogger logger)
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => !msg.IsSuccessStatusCode)
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: failureThreshold,
                durationOfBreak: duration,
                onBreak: (result, duration) =>
                {
                    logger.LogError(
                        "Circuit breaker opened. Will remain open for {Duration}s. Reason: {Reason}",
                        duration.TotalSeconds,
                        result.Exception?.Message ?? result.Result?.StatusCode.ToString() ?? "Unknown");
                },
                onReset: () =>
                {
                    logger.LogInformation("Circuit breaker reset. Requests will flow normally.");
                },
                onHalfOpen: () =>
                {
                    logger.LogInformation("Circuit breaker half-open. Testing connection...");
                });
    }

    public static IAsyncPolicy<HttpResponseMessage> GetHttpTimeoutPolicy(TimeSpan timeout, ILogger logger)
    {
        return Policy.TimeoutAsync<HttpResponseMessage>(
            timeout,
            TimeoutStrategy.Pessimistic,
            onTimeoutAsync: (context, timespan, task) =>
            {
                logger.LogWarning("HTTP request timed out after {Timeout}s", timespan.TotalSeconds);
                return Task.CompletedTask;
            });
    }

    public static IAsyncPolicy<HttpResponseMessage> GetHttpPolicy(
        int retryCount,
        int circuitBreakerFailureThreshold,
        TimeSpan circuitBreakerDuration,
        TimeSpan timeout,
        ILogger logger)
    {
        return Policy.WrapAsync(
            GetHttpTimeoutPolicy(timeout, logger),
            GetHttpCircuitBreakerPolicy(circuitBreakerFailureThreshold, circuitBreakerDuration, logger),
            GetHttpRetryPolicy(retryCount, logger)
        );
    }

    public static IAsyncPolicy GetRabbitMQRetryPolicy(int retryCount, TimeSpan delay, ILogger logger)
    {
        return Policy
            .Handle<Exception>()
            .WaitAndRetryAsync(
                retryCount: retryCount,
                sleepDurationProvider: _ => delay,
                onRetry: (exception, timespan, retryCount, context) =>
                {
                    logger.LogWarning(
                        "RabbitMQ operation failed. Retry {RetryCount}/{MaxRetries} after {Delay}s. Error: {Error}",
                        retryCount,
                        retryCount,
                        timespan.TotalSeconds,
                        exception.Message);
                });
    }
}

