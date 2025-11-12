using DataIngestor.Models;
using FluentValidation;

namespace DataIngestor.Validators;

public class SensorDataValidator : AbstractValidator<SensorData>
{
    public SensorDataValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty()
            .WithMessage("Sensor type is required")
            .Must(type => new[] { "energy", "air_quality", "motion" }.Contains(type.ToLower()))
            .WithMessage("Sensor type must be one of: energy, air_quality, motion");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Sensor name is required")
            .MaximumLength(100)
            .WithMessage("Sensor name must not exceed 100 characters");

        RuleFor(x => x.Payload)
            .NotNull()
            .WithMessage("Payload is required")
            .Must(payload => payload != null && payload.Count > 0)
            .WithMessage("Payload must contain at least one field");
    }
}

