using DataIngestor.Configuration;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace DataIngestor.Validators;

public class ApiConfigOptionsValidator : IValidateOptions<ApiConfig>
{
    private readonly ApiConfigValidator _validator;

    public ApiConfigOptionsValidator()
    {
        _validator = new ApiConfigValidator();
    }

    public ValidateOptionsResult Validate(string? name, ApiConfig options)
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

