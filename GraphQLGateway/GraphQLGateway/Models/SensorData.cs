using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraphQLGateway.Models;

public class SensorReading
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string SensorType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string SensorName { get; set; } = string.Empty;
    
    [Required]
    [Column(TypeName = "jsonb")]
    public string Payload { get; set; } = string.Empty;
    
    [Required]
    public DateTime Timestamp { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ProcessingStats
{
    [Key]
    public int Id { get; set; }
    
    public long ProcessedMessages { get; set; } = 0;
    
    public long FailedMessages { get; set; } = 0;
    
    public DateTime? LastProcessedAt { get; set; }
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal? ProcessingRatePerSecond { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
