using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;

namespace RIDEX.Infrastructure.Data;

public class RideXDbContext : DbContext
{
    public RideXDbContext(DbContextOptions<RideXDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Motorcycle> Motorcycles => Set<Motorcycle>();
    public DbSet<Ride> Rides => Set<Ride>();
    public DbSet<RideMember> RideMembers => Set<RideMember>();
    public DbSet<Route> Routes => Set<Route>();
    public DbSet<Waypoint> Waypoints => Set<Waypoint>();
    public DbSet<HistoricalGpsPoint> HistoricalGpsPoints => Set<HistoricalGpsPoint>();
    public DbSet<FuelLog> FuelLogs => Set<FuelLog>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ExpenseParticipant> ExpenseParticipants => Set<ExpenseParticipant>();
    public DbSet<ServiceRecord> ServiceRecords => Set<ServiceRecord>();
    public DbSet<ServiceReminder> ServiceReminders => Set<ServiceReminder>();
    public DbSet<EmergencyContact> EmergencyContacts => Set<EmergencyContact>();
    public DbSet<EmergencyAlert> EmergencyAlerts => Set<EmergencyAlert>();
    public DbSet<RouteCache> RouteCaches => Set<RouteCache>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
        });

        // Motorcycle Configuration
        modelBuilder.Entity<Motorcycle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Motorcycles)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Ride Configuration
        modelBuilder.Entity<Ride>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.JoinCode).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.OwnerId);
            entity.Property(e => e.JoinCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(100);

            entity.HasOne(e => e.Owner)
                  .WithMany(u => u.OwnedRides)
                  .HasForeignKey(e => e.OwnerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ActiveMotorcycle)
                  .WithMany()
                  .HasForeignKey(e => e.ActiveMotorcycleId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Route)
                  .WithOne(r => r.Ride)
                  .HasForeignKey<Route>(r => r.RideId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // RideMember Configuration
        modelBuilder.Entity<RideMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RideId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Ride)
                  .WithMany(r => r.Members)
                  .HasForeignKey(e => e.RideId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.RideMemberships)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Waypoint Configuration
        modelBuilder.Entity<Waypoint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RouteId, e.Order });
            entity.HasOne(e => e.Route)
                  .WithMany(r => r.Waypoints)
                  .HasForeignKey(e => e.RouteId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Historical GPS Point Configuration (Optimized index for time-series extraction & Douglas-Peucker)
        modelBuilder.Entity<HistoricalGpsPoint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RideId, e.Timestamp });
            entity.HasIndex(e => new { e.UserId, e.Timestamp });
            entity.HasOne(e => e.Ride)
                  .WithMany(r => r.HistoricalGpsPoints)
                  .HasForeignKey(e => e.RideId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Expense Configuration
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RideId);
            entity.HasOne(e => e.Ride)
                  .WithMany(r => r.Expenses)
                  .HasForeignKey(e => e.RideId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.PaidByUser)
                  .WithMany()
                  .HasForeignKey(e => e.PaidByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Expense Participant Configuration
        modelBuilder.Entity<ExpenseParticipant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ExpenseId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Expense)
                  .WithMany(x => x.Participants)
                  .HasForeignKey(e => e.ExpenseId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Fuel Log Configuration
        modelBuilder.Entity<FuelLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.RideId);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.FuelLogs)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Motorcycle)
                  .WithMany(m => m.FuelLogs)
                  .HasForeignKey(e => e.MotorcycleId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Service Record & Reminder Configuration
        modelBuilder.Entity<ServiceRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MotorcycleId);
            entity.HasOne(e => e.Motorcycle)
                  .WithMany(m => m.ServiceRecords)
                  .HasForeignKey(e => e.MotorcycleId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServiceReminder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MotorcycleId);
            entity.HasOne(e => e.Motorcycle)
                  .WithMany(m => m.ServiceReminders)
                  .HasForeignKey(e => e.MotorcycleId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Route Cache
        modelBuilder.Entity<RouteCache>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CacheKey).IsUnique();
        });
    }
}
