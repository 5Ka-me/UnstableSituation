using DataIngestor.Configuration;
using FluentValidation;

namespace DataIngestor.Validators;

public class ApiConfigValidator : AbstractValidator<ApiConfig>
{
    public ApiConfigValidator()
    {
        RuleFor(x => x.BaseUrl)
            .NotEmpty()
            .WithMessage("API base URL is required")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("API base URL must be a valid absolute URI");

        RuleFor(x => x.Timeout)
            .NotEmpty()
            .WithMessage("Timeout is required")
            .Must(timeout => TimeSpan.TryParse(timeout, out var ts) && ts.TotalSeconds > 0)
            .WithMessage("Timeout must be a valid TimeSpan format (e.g., '00:00:30')");

        RuleFor(x => x.RetryCount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Retry count must be greater than or equal to 0")
            .LessThanOrEqualTo(10)
            .WithMessage("Retry count must not exceed 10");

        RuleFor(x => x.CircuitBreakerFailureThreshold)
            .GreaterThan(0)
            .WithMessage("Circuit breaker failure threshold must be greater than 0")
            .LessThanOrEqualTo(20)
            .WithMessage("Circuit breaker failure threshold must not exceed 20");

        RuleFor(x => x.CircuitBreakerDuration)
            .NotEmpty()
            .WithMessage("Circuit breaker duration is required")
            .Must(duration => TimeSpan.TryParse(duration, out var ts) && ts.TotalSeconds > 0)
            .WithMessage("Circuit breaker duration must be a valid TimeSpan format");
    }
}

