using Microsoft.EntityFrameworkCore;
using GraphQLGateway.Data;
using GraphQLGateway.Queries;
using GraphQLGateway.Types;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add Entity Framework
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? Environment.GetEnvironmentVariable("DATABASE_URL") 
    ?? "Host=postgres;Port=5432;Database=microservices_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<SensorDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add GraphQL
builder.Services
    .AddGraphQLServer()
    .AddQueryType<SensorQueries>()
    .AddType<SensorReadingType>()
    .AddType<SensorMetricsType>()
    .AddType<SensorDataPointType>()
    .AddType<ProcessingStatsType>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

// Map GraphQL endpoint
app.MapGraphQL();

app.Run();
