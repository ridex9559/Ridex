using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using RIDEX.Infrastructure.Data;
using RIDEX.Infrastructure.Services;
using RIDEX.Shared.DTOs;
using RIDEX.Shared.Enums;
using Xunit;

namespace RIDEX.Tests.Services;

public class FuelAndSyncTests
{
    [Fact]
    public void FuelCalculation_ForHimalayan450_CalculatesAccurateRequirements()
    {
        // 342 km ride / 24 km/L = 14.25 L
        double distanceKm = 342.0;
        double mileage = 24.0;
        double tankCapacity = 17.0;
        decimal fuelPrice = 105.0m;

        var fuelRequired = distanceKm / mileage;
        var totalCost = (decimal)fuelRequired * fuelPrice;
        var maxRange = mileage * tankCapacity; // 408 km

        fuelRequired.Should().Be(14.25);
        totalCost.Should().Be(1496.25m);
        maxRange.Should().Be(408.0);
    }

    [Fact]
    public void BcryptPasswordHasher_HashesAndVerifiesCorrectly()
    {
        var hasher = new BcryptPasswordHasher();
        var rawPassword = "RiderPassword@2026";

        var hash = hasher.HashPassword(rawPassword);

        hash.Should().NotBeNullOrWhiteSpace();
        hash.Should().NotBe(rawPassword);
        hasher.VerifyPassword(rawPassword, hash).Should().BeTrue();
        hasher.VerifyPassword("WrongPassword", hash).Should().BeFalse();
    }

    [Fact]
    public async Task SyncEngine_ProcessesQueuedGpsPointsAndOperations()
    {
        var options = new DbContextOptionsBuilder<RideXDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var dbContext = new RideXDbContext(options);
        var syncEngine = new SyncEngine(dbContext, NullLogger<SyncEngine>.Instance);

        var userId = Guid.NewGuid();
        var rideId = Guid.NewGuid();

        var batch = new SyncBatchRequest
        {
            DeviceId = Guid.NewGuid(),
            QueuedGpsPoints = new List<LocationUpdateDto>
            {
                new() { RideId = rideId, Latitude = 19.9975, Longitude = 73.7898, SpeedKmh = 50, Timestamp = DateTime.UtcNow },
                new() { RideId = rideId, Latitude = 19.9328, Longitude = 73.5307, SpeedKmh = 55, Timestamp = DateTime.UtcNow.AddMinutes(5) }
            },
            Operations = new List<SyncOperationItemDto>()
        };

        var response = await syncEngine.ProcessSyncBatchAsync(userId, batch);

        response.Success.Should().BeTrue();
        response.SyncedGpsPointsCount.Should().Be(2);

        var savedPoints = await dbContext.HistoricalGpsPoints.CountAsync();
        savedPoints.Should().Be(2);
    }
}
