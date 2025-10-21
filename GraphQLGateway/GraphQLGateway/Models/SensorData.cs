using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraphQLGateway.Models;

public class SensorReading
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    [Column("sensor_type")]
    public string SensorType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    [Column("sensor_name")]
    public string SensorName { get; set; } = string.Empty;
    
    [Required]
    [Column("payload", TypeName = "jsonb")]
    public string Payload { get; set; } = string.Empty;
    
    [Required]
    [Column("timestamp")]
    public DateTime Timestamp { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ProcessingStats
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
    
    [Column("processed_messages")]
    public long ProcessedMessages { get; set; } = 0;
    
    [Column("failed_messages")]
    public long FailedMessages { get; set; } = 0;
    
    [Column("last_processed_at")]
    public DateTime? LastProcessedAt { get; set; }
    
    [Column("processing_rate_per_second", TypeName = "decimal(10,2)")]
    public decimal? ProcessingRatePerSecond { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

