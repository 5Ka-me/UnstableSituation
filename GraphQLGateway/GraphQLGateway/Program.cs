using Microsoft.EntityFrameworkCore;
using GraphQLGateway.Data;
using GraphQLGateway.Queries;
using GraphQLGateway.Types;
using GraphQLGateway.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://frontend:80")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add Entity Framework
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

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

// Add SignalR
builder.Services.AddSignalR();

// Add Swagger/OpenAPI
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "GraphQL Gateway API",
        Version = "v1",
        Description = "API for sensor data management and debugging",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "GraphQL Gateway Team"
        }
    });
    
    // Include XML comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = System.IO.Path.Combine(System.AppContext.BaseDirectory, xmlFile);
    if (System.IO.File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GraphQL Gateway API v1");
        c.RoutePrefix = "swagger"; // Swagger UI will be available at /swagger
    });
    app.UseHttpsRedirection();
}

// Use CORS
app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

// Map GraphQL endpoint
app.MapGraphQL();

// Map SignalR hub
app.MapHub<NotificationsHub>("/notificationsHub");

app.Run();
