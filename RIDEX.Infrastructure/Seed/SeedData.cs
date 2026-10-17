using Microsoft.EntityFrameworkCore;
using RIDEX.Core.Entities;
using RIDEX.Core.Interfaces;
using RIDEX.Infrastructure.Data;
using RIDEX.Shared.Enums;

namespace RIDEX.Infrastructure.Seed;

public static class SeedData
{
    public static async Task InitializeAsync(RideXDbContext context, IPasswordHasher hasher)
    {
        // Ensure database tables exist
        await context.Database.EnsureCreatedAsync();

        if (await context.Users.AnyAsync())
        {
            return; // Already seeded
        }

        // 1. Seed Users
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var admin = new User
        {
            Id = adminId,
            Email = "admin@ridex.local",
            FullName = "RIDEX Administrator",
            PasswordHash = hasher.HashPassword("Admin@123"),
            Role = UserRole.Admin,
            PhoneNumber = "+919876543210",
            City = "Mumbai",
            RidingExperience = "Master Tourer (15+ Years)",
            CreatedAt = DateTime.UtcNow
        };

        var leaderId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var leader = new User
        {
            Id = leaderId,
            Email = "rider@ridex.local",
            FullName = "Aryan Deshmukh",
            PasswordHash = hasher.HashPassword("Rider@123"),
            Role = UserRole.User,
            PhoneNumber = "+919822011223",
            City = "Nashik",
            RidingExperience = "Adventure Touring (6 Years)",
            CreatedAt = DateTime.UtcNow
        };

        var rider2Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var rider2 = new User
        {
            Id = rider2Id,
            Email = "vikram@ridex.local",
            FullName = "Vikram Patil",
            PasswordHash = hasher.HashPassword("Rider@123"),
            Role = UserRole.User,
            PhoneNumber = "+919822044556",
            City = "Pune",
            RidingExperience = "High Altitude Tourer (4 Years)",
            CreatedAt = DateTime.UtcNow
        };

        var rider3Id = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var rider3 = new User
        {
            Id = rider3Id,
            Email = "neha@ridex.local",
            FullName = "Neha Sharma",
            PasswordHash = hasher.HashPassword("Rider@123"),
            Role = UserRole.User,
            PhoneNumber = "+919822077889",
            City = "Mumbai",
            RidingExperience = "Weekend Scrambler (3 Years)",
            CreatedAt = DateTime.UtcNow
        };

        var rider4Id = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var rider4 = new User
        {
            Id = rider4Id,
            Email = "rohan@ridex.local",
            FullName = "Rohan Mehta",
            PasswordHash = hasher.HashPassword("Rider@123"),
            Role = UserRole.User,
            PhoneNumber = "+919822099001",
            City = "Thane",
            RidingExperience = "Cruiser Tourer (5 Years)",
            CreatedAt = DateTime.UtcNow
        };

        await context.Users.AddRangeAsync(admin, leader, rider2, rider3, rider4);

        // 2. Seed Motorcycles
        var bike1Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var bike1 = new Motorcycle
        {
            Id = bike1Id,
            UserId = leaderId,
            Brand = "Royal Enfield",
            Model = "Himalayan 450",
            Year = 2024,
            RegistrationNumber = "MH-15-GH-4500",
            FuelTankCapacityLiters = 17.0,
            AverageMileageKmpl = 24.5,
            CurrentOdometerKm = 18450.0,
            InsuranceExpiry = DateTime.UtcNow.AddMonths(8),
            PucExpiry = DateTime.UtcNow.AddMonths(4),
            IsPrimary = true
        };

        var bike2 = new Motorcycle
        {
            Id = Guid.NewGuid(),
            UserId = rider2Id,
            Brand = "KTM",
            Model = "390 Adventure",
            Year = 2023,
            RegistrationNumber = "MH-12-KT-3900",
            FuelTankCapacityLiters = 14.5,
            AverageMileageKmpl = 26.0,
            CurrentOdometerKm = 14200.0,
            IsPrimary = true
        };

        var bike3 = new Motorcycle
        {
            Id = Guid.NewGuid(),
            UserId = rider3Id,
            Brand = "BMW",
            Model = "G310 GS",
            Year = 2023,
            RegistrationNumber = "MH-02-BM-3100",
            FuelTankCapacityLiters = 11.5,
            AverageMileageKmpl = 28.0,
            CurrentOdometerKm = 9800.0,
            IsPrimary = true
        };

        await context.Motorcycles.AddRangeAsync(bike1, bike2, bike3);

        // 3. Seed Maintenance Reminders & Records
        var reminder1 = new ServiceReminder
        {
            Id = Guid.NewGuid(),
            MotorcycleId = bike1Id,
            ServiceType = ServiceType.EngineOil,
            Title = "Engine Oil & Filter Replacement",
            DueOdometerKm = 18730.0, // Due in 280 km
            DueDate = DateTime.UtcNow.AddDays(14)
        };

        var reminder2 = new ServiceReminder
        {
            Id = Guid.NewGuid(),
            MotorcycleId = bike1Id,
            ServiceType = ServiceType.ChainLubrication,
            Title = "Chain Clean & Lubrication",
            DueOdometerKm = 18500.0, // Due in 50 km
            DueDate = DateTime.UtcNow.AddDays(2)
        };

        var serviceRecord = new ServiceRecord
        {
            Id = Guid.NewGuid(),
            MotorcycleId = bike1Id,
            ServiceType = ServiceType.GeneralService,
            Title = "15,000 km Major Service",
            Description = "Replaced spark plug, coolant flush, brake bleeding and general tightening.",
            OdometerKm = 15000.0,
            Cost = 4250.0m,
            WorkshopName = "Royal Enfield Service Hub, Nashik",
            ServiceDate = DateTime.UtcNow.AddMonths(-2)
        };

        await context.ServiceReminders.AddRangeAsync(reminder1, reminder2);
        await context.ServiceRecords.AddAsync(serviceRecord);

        // 4. Seed Emergency Contacts
        var ec1 = new EmergencyContact
        {
            Id = Guid.NewGuid(),
            UserId = leaderId,
            Name = "Sunita Deshmukh",
            PhoneNumber = "+919822000111",
            Relationship = "Mother",
            IsPrimary = true
        };

        var ec2 = new EmergencyContact
        {
            Id = Guid.NewGuid(),
            UserId = leaderId,
            Name = "Dr. Sameer Kulkarni",
            PhoneNumber = "+919822000222",
            Relationship = "Family Doctor",
            IsPrimary = false
        };

        await context.EmergencyContacts.AddRangeAsync(ec1, ec2);

        // 5. Seed Route & Group Ride
        var rideId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var routeId = Guid.Parse("88888888-8888-8888-8888-888888888888");

        var route = new Route
        {
            Id = routeId,
            RideId = rideId,
            OriginName = "Nashik (Gangapur Road)",
            OriginLatitude = 19.9975,
            OriginLongitude = 73.7898,
            DestinationName = "Pune (Shivaji Nagar)",
            DestinationLatitude = 18.5204,
            DestinationLongitude = 73.8567,
            TotalDistanceKm = 342.0,
            EstimatedDurationMinutes = 440.0,
            Preference = RoutePreference.Scenic,
            PolylineGeometry = "{\"type\":\"LineString\",\"coordinates\":[[73.7898,19.9975],[73.5307,19.9328],[73.7663,19.5447],[73.7740,19.3400],[73.8567,18.5204]]}"
        };

        var wp1 = new Waypoint { Id = Guid.NewGuid(), RouteId = routeId, Name = "Trimbakeshwar", Latitude = 19.9328, Longitude = 73.5307, Order = 1 };
        var wp2 = new Waypoint { Id = Guid.NewGuid(), RouteId = routeId, Name = "Bhandardara Lake", Latitude = 19.5447, Longitude = 73.7663, Order = 2, IsFuelStop = true };
        var wp3 = new Waypoint { Id = Guid.NewGuid(), RouteId = routeId, Name = "Malshej Ghat Waterfall", Latitude = 19.3400, Longitude = 73.7740, Order = 3 };

        route.Waypoints.Add(wp1);
        route.Waypoints.Add(wp2);
        route.Waypoints.Add(wp3);

        var ride = new Ride
        {
            Id = rideId,
            Title = "Monsoon Western Ghats Expedition",
            Description = "Scenic ride from Nashik to Pune exploring Trimbakeshwar, Bhandardara Arthur Lake and Malshej Ghat waterfalls.",
            JoinCode = "RX-8F29K",
            Status = RideStatus.Upcoming,
            ScheduledStartTime = DateTime.UtcNow.AddDays(1).Date.AddHours(6), // Tomorrow 06:00 AM
            MaxRiders = 10,
            SeparationThresholdKm = 2.5,
            OwnerId = leaderId,
            ActiveMotorcycleId = bike1Id,
            Route = route
        };

        var member1 = new RideMember { Id = Guid.NewGuid(), RideId = rideId, UserId = leaderId, MotorcycleId = bike1Id, Role = RideRole.Owner, OnlineStatus = RiderOnlineStatus.Online };
        var member2 = new RideMember { Id = Guid.NewGuid(), RideId = rideId, UserId = rider2Id, Role = RideRole.CoLeader, OnlineStatus = RiderOnlineStatus.Online };
        var member3 = new RideMember { Id = Guid.NewGuid(), RideId = rideId, UserId = rider3Id, Role = RideRole.Member, OnlineStatus = RiderOnlineStatus.Online };
        var member4 = new RideMember { Id = Guid.NewGuid(), RideId = rideId, UserId = rider4Id, Role = RideRole.Member, OnlineStatus = RiderOnlineStatus.Online };

        ride.Members.Add(member1);
        ride.Members.Add(member2);
        ride.Members.Add(member3);
        ride.Members.Add(member4);

        await context.Rides.AddAsync(ride);

        // 6. Seed Demo Group Expenses (illustrating ₹15,000 total across 4 members with smart debt settlement)
        var exp1 = new Expense
        {
            Id = Guid.NewGuid(),
            RideId = rideId,
            PaidByUserId = leaderId,
            Title = "Ghat View Mountain Resort (Bhandardara)",
            Amount = 8000.0m,
            Category = ExpenseCategory.Hotel,
            IncurredAt = DateTime.UtcNow.AddDays(-1)
        };
        exp1.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp1.Id, UserId = leaderId, ShareAmount = 2000.0m, HasSettled = true });
        exp1.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp1.Id, UserId = rider2Id, ShareAmount = 2000.0m, HasSettled = false });
        exp1.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp1.Id, UserId = rider3Id, ShareAmount = 2000.0m, HasSettled = false });
        exp1.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp1.Id, UserId = rider4Id, ShareAmount = 2000.0m, HasSettled = false });

        var exp2 = new Expense
        {
            Id = Guid.NewGuid(),
            RideId = rideId,
            PaidByUserId = rider2Id,
            Title = "Highway Dhaba Feast & Breakfast",
            Amount = 3200.0m,
            Category = ExpenseCategory.Food,
            IncurredAt = DateTime.UtcNow.AddDays(-1).AddHours(3)
        };
        exp2.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp2.Id, UserId = leaderId, ShareAmount = 800.0m, HasSettled = false });
        exp2.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp2.Id, UserId = rider2Id, ShareAmount = 800.0m, HasSettled = true });
        exp2.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp2.Id, UserId = rider3Id, ShareAmount = 800.0m, HasSettled = false });
        exp2.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp2.Id, UserId = rider4Id, ShareAmount = 800.0m, HasSettled = false });

        var exp3 = new Expense
        {
            Id = Guid.NewGuid(),
            RideId = rideId,
            PaidByUserId = rider3Id,
            Title = "Samruddhi Expressway & Ghat Tolls",
            Amount = 800.0m,
            Category = ExpenseCategory.Toll,
            IncurredAt = DateTime.UtcNow.AddDays(-1).AddHours(5)
        };
        exp3.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp3.Id, UserId = leaderId, ShareAmount = 200.0m, HasSettled = false });
        exp3.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp3.Id, UserId = rider2Id, ShareAmount = 200.0m, HasSettled = false });
        exp3.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp3.Id, UserId = rider3Id, ShareAmount = 200.0m, HasSettled = true });
        exp3.Participants.Add(new ExpenseParticipant { Id = Guid.NewGuid(), ExpenseId = exp3.Id, UserId = rider4Id, ShareAmount = 200.0m, HasSettled = false });

        await context.Expenses.AddRangeAsync(exp1, exp2, exp3);

        // 7. Seed Demo Fuel Log
        var fuelLog1 = new FuelLog
        {
            Id = Guid.NewGuid(),
            UserId = leaderId,
            MotorcycleId = bike1Id,
            RideId = rideId,
            Liters = 14.25,
            PricePerLiter = 105.5m,
            TotalCost = 1503.38m,
            OdometerKm = 18450.0,
            FuelStationName = "Indian Oil Swagat, Igatpuri Highway",
            CalculatedMileageKmpl = 24.2,
            LoggedAt = DateTime.UtcNow.AddDays(-2)
        };
        await context.FuelLogs.AddAsync(fuelLog1);

        await context.SaveChangesAsync();
    }
}
