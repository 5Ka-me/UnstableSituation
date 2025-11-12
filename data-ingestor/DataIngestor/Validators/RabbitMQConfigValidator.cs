using DataIngestor.Configuration;
using FluentValidation;

namespace DataIngestor.Validators;

public class RabbitMQConfigValidator : AbstractValidator<RabbitMQConfig>
{
    public RabbitMQConfigValidator()
    {
        RuleFor(x => x.Url)
            .NotEmpty()
            .WithMessage("RabbitMQ URL is required")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var uri) && 
                        (uri.Scheme == "amqp" || uri.Scheme == "amqps"))
            .WithMessage("RabbitMQ URL must be a valid AMQP URI (amqp:// or amqps://)");

        RuleFor(x => x.ExchangeName)
            .NotEmpty()
            .WithMessage("Exchange name is required")
            .MaximumLength(255)
            .WithMessage("Exchange name must not exceed 255 characters")
            .Matches(@"^[a-zA-Z0-9\-_\.]+$")
            .WithMessage("Exchange name can only contain alphanumeric characters, hyphens, underscores, and dots");

        RuleFor(x => x.QueueName)
            .NotEmpty()
            .WithMessage("Queue name is required")
            .MaximumLength(255)
            .WithMessage("Queue name must not exceed 255 characters")
            .Matches(@"^[a-zA-Z0-9\-_\.]+$")
            .WithMessage("Queue name can only contain alphanumeric characters, hyphens, underscores, and dots");

        RuleFor(x => x.RoutingKey)
            .NotEmpty()
            .WithMessage("Routing key is required")
            .MaximumLength(255)
            .WithMessage("Routing key must not exceed 255 characters");

        RuleFor(x => x.RetryCount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Retry count must be greater than or equal to 0")
            .LessThanOrEqualTo(10)
            .WithMessage("Retry count must not exceed 10");

        RuleFor(x => x.RetryDelay)
            .NotEmpty()
            .WithMessage("Retry delay is required")
            .Must(delay => TimeSpan.TryParse(delay, out var ts) && ts.TotalSeconds > 0)
            .WithMessage("Retry delay must be a valid TimeSpan format");
    }
}

