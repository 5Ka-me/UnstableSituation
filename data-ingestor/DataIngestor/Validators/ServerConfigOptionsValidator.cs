using DataIngestor.Configuration;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace DataIngestor.Validators;

public class ServerConfigOptionsValidator : IValidateOptions<ServerConfig>
{
    private readonly ServerConfigValidator _validator;

    public ServerConfigOptionsValidator()
    {
        _validator = new ServerConfigValidator();
    }

    public ValidateOptionsResult Validate(string? name, ServerConfig options)
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

