using FluentAssertions;
using RIDEX.Shared.Algorithms;
using Xunit;

namespace RIDEX.Tests.Algorithms;

public class DouglasPeuckerTests
{
    [Fact]
    public void Simplify_WithCollinearPoints_ReducesToStartAndEndPoints()
    {
        // 10 collinear points along a straight road
        var points = new List<CoordinatePoint>();
        for (int i = 0; i < 10; i++)
        {
            points.Add(new CoordinatePoint(19.0 + (i * 0.01), 73.0 + (i * 0.01)));
        }

        var simplified = DouglasPeuckerReducer.Simplify(points, epsilonMeters: 20.0);

        // Collinear straight line should simplify down to start and end point
        simplified.Should().HaveCount(2);
        simplified[0].Latitude.Should().Be(points[0].Latitude);
        simplified[1].Latitude.Should().Be(points[^1].Latitude);
    }

    [Fact]
    public void Simplify_WithSharpHairpinTurn_PreservesApexPoint()
    {
        // Straight line, sharp apex hairpin bend, then straight line
        var points = new List<CoordinatePoint>
        {
            new(19.00, 73.00),
            new(19.01, 73.00),
            new(19.02, 73.00),
            new(19.03, 73.05), // Sharp mountain hairpin apex point ~5 km away from straight line
            new(19.04, 73.00),
            new(19.05, 73.00)
        };

        var simplified = DouglasPeuckerReducer.Simplify(points, epsilonMeters: 50.0);

        simplified.Should().Contain(p => p.Latitude == 19.03 && p.Longitude == 73.05);
        simplified.Count.Should().BeLessThan(points.Count);
    }
}
