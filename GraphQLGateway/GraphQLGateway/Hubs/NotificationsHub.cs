using Microsoft.AspNetCore.SignalR;
using GraphQLGateway.Models;
using System.Text.Json;

namespace GraphQLGateway.Hubs;

public class NotificationsHub : Hub
{
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task SendSensorUpdate(SensorReading reading)
    {
        await Clients.All.SendAsync("SensorDataUpdate", new
        {
            id = reading.Id,
            sensorType = reading.SensorType,
            sensorName = reading.SensorName,
            payload = JsonSerializer.Deserialize<object>(reading.Payload),
            timestamp = reading.Timestamp,
            createdAt = reading.CreatedAt
        });
    }

    public async Task SendMetricsUpdate(object metrics)
    {
        await Clients.All.SendAsync("MetricsUpdate", metrics);
    }

    public async Task SendNotification(string message, string type = "info")
    {
        var notification = new
        {
            id = Guid.NewGuid().ToString(),
            message,
            type,
            timestamp = DateTime.UtcNow,
            read = false
        };

        await Clients.All.SendAsync("Notification", notification);
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("ConnectionStatus", "Connected");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Clients.Caller.SendAsync("ConnectionStatus", "Disconnected");
        await base.OnDisconnectedAsync(exception);
    }
}
