using DataIngestor.Configuration;
using FluentValidation;
using System.Net;

namespace DataIngestor.Validators;

public class ServerConfigValidator : AbstractValidator<ServerConfig>
{
    public ServerConfigValidator()
    {
        RuleFor(x => x.Port)
            .NotEmpty()
            .WithMessage("Port is required")
            .Must(port => int.TryParse(port, out var p) && p > 0 && p <= 65535)
            .WithMessage("Port must be a valid number between 1 and 65535");

        RuleFor(x => x.Host)
            .NotEmpty()
            .WithMessage("Host is required")
            .Must(host => IPAddress.TryParse(host, out _) || 
                         host == "localhost" || 
                         host == "0.0.0.0" || 
                         host == "127.0.0.1" ||
                         System.Text.RegularExpressions.Regex.IsMatch(host, @"^[a-zA-Z0-9\-\.]+$"))
            .WithMessage("Host must be a valid IP address or hostname");
    }
}

