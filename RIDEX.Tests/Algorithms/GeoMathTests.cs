using FluentAssertions;
using RIDEX.Shared.Algorithms;
using Xunit;

namespace RIDEX.Tests.Algorithms;

public class GeoMathTests
{
    [Fact]
    public void HaversineDistanceKm_BetweenNashikAndPune_ReturnsCorrectGeographicDistance()
    {
        // Nashik (19.9975, 73.7898) to Pune (18.5204, 73.8567)
        var distanceKm = GeoMath.HaversineDistanceKm(19.9975, 73.7898, 18.5204, 73.8567);

        // Great circle distance is ~164.5 km
        distanceKm.Should().BeInRange(160.0, 170.0);
    }

    [Fact]
    public void IsRiderSeparated_WhenBeyondThreshold_ReturnsTrue()
    {
        // Leader at Bhandardara (19.5447, 73.7663)
        // Sweeper 3.5 km away (19.5130, 73.7663)
        var isSeparated = GeoMath.IsRiderSeparated(19.5130, 73.7663, 19.5447, 73.7663, thresholdKm: 2.0);

        isSeparated.Should().BeTrue();
    }

    [Fact]
    public void IsRiderSeparated_WhenWithinThreshold_ReturnsFalse()
    {
        // 500 meters separation
        var isSeparated = GeoMath.IsRiderSeparated(19.5400, 73.7663, 19.5447, 73.7663, thresholdKm: 2.0);

        isSeparated.Should().BeFalse();
    }

    [Fact]
    public void JoinCodeGenerator_GeneratesValidFormat()
    {
        var code = JoinCodeGenerator.Generate("RX", 5);

        code.Should().StartWith("RX-");
        code.Length.Should().Be(8);
        JoinCodeGenerator.IsValidFormat(code).Should().BeTrue();
    }
}
