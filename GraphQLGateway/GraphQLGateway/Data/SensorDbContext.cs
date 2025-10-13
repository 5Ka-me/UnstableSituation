using Microsoft.EntityFrameworkCore;
using GraphQLGateway.Models;

namespace GraphQLGateway.Data;

public class SensorDbContext : DbContext
{
    public SensorDbContext(DbContextOptions<SensorDbContext> options) : base(options)
    {
    }

    public DbSet<SensorReading> SensorReadings { get; set; }
    public DbSet<ProcessingStats> ProcessingStats { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure SensorReading entity
        modelBuilder.Entity<SensorReading>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.SensorType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.SensorName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Payload).HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.Timestamp).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");

            // Create indexes
            entity.HasIndex(e => e.SensorType).HasDatabaseName("idx_sensor_readings_type");
            entity.HasIndex(e => e.SensorName).HasDatabaseName("idx_sensor_readings_name");
            entity.HasIndex(e => e.Timestamp).HasDatabaseName("idx_sensor_readings_timestamp");
            entity.HasIndex(e => e.CreatedAt).HasDatabaseName("idx_sensor_readings_created_at");
            entity.HasIndex(e => new { e.SensorType, e.SensorName }).HasDatabaseName("idx_sensor_readings_type_name");
            entity.HasIndex(e => e.Payload).HasDatabaseName("idx_sensor_readings_payload").HasMethod("gin");
        });

        // Configure ProcessingStats entity
        modelBuilder.Entity<ProcessingStats>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProcessedMessages).HasDefaultValue(0);
            entity.Property(e => e.FailedMessages).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
        });
    }
}
