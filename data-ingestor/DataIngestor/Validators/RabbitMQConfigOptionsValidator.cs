using DataIngestor.Configuration;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace DataIngestor.Validators;

public class RabbitMQConfigOptionsValidator : IValidateOptions<RabbitMQConfig>
{
    private readonly RabbitMQConfigValidator _validator;

    public RabbitMQConfigOptionsValidator()
    {
        _validator = new RabbitMQConfigValidator();
    }

    public ValidateOptionsResult Validate(string? name, RabbitMQConfig options)
    {
        var result = _validator.Validate(options);
        if (result.IsValid)
        {
            return ValidateOptionsResult.Success;
        }

        var errors = result.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}");
        return ValidateOptionsResult.Fail(errors);
    }
}

