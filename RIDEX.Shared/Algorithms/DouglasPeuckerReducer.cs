namespace RIDEX.Shared.Algorithms;

public class CoordinatePoint
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
    public DateTime? Timestamp { get; set; }
    public double? SpeedKmh { get; set; }

    public CoordinatePoint() { }

    public CoordinatePoint(double latitude, double longitude, double? altitude = null, DateTime? timestamp = null, double? speedKmh = null)
    {
        Latitude = latitude;
        Longitude = longitude;
        Altitude = altitude;
        Timestamp = timestamp;
        SpeedKmh = speedKmh;
    }
}

/// <summary>
/// Douglas-Peucker algorithm implementation for reducing GPS track points
/// while preserving curve fidelity and major track milestones.
/// </summary>
public static class DouglasPeuckerReducer
{
    /// <summary>
    /// Reduces the list of GPS coordinates using the Douglas-Peucker algorithm with a tolerance in meters.
    /// </summary>
    /// <param name="points">Raw GPS coordinate points.</param>
    /// <param name="epsilonMeters">Distance tolerance in meters (e.g. 5-20 meters for motorcycle touring).</param>
    /// <returns>Simplified list of coordinates.</returns>
    public static List<CoordinatePoint> Simplify(IReadOnlyList<CoordinatePoint> points, double epsilonMeters = 10.0)
    {
        if (points == null || points.Count < 3)
            return points?.ToList() ?? new List<CoordinatePoint>();

        var bitArray = new bool[points.Count];
        bitArray[0] = true;
        bitArray[points.Count - 1] = true;

        SimplifyRecursive(points, 0, points.Count - 1, epsilonMeters, bitArray);

        var result = new List<CoordinatePoint>();
        for (int i = 0; i < points.Count; i++)
        {
            if (bitArray[i])
            {
                result.Add(points[i]);
            }
        }

        return result;
    }

    private static void SimplifyRecursive(
        IReadOnlyList<CoordinatePoint> points,
        int firstIndex,
        int lastIndex,
        double epsilonMeters,
        bool[] bitArray)
    {
        if (lastIndex <= firstIndex + 1)
            return;

        double maxDistance = 0.0;
        int maxIndex = 0;

        var firstPoint = points[firstIndex];
        var lastPoint = points[lastIndex];

        for (int i = firstIndex + 1; i < lastIndex; i++)
        {
            var p = points[i];
            var distance = GeoMath.PerpendicularDistanceMeters(
                p.Latitude, p.Longitude,
                firstPoint.Latitude, firstPoint.Longitude,
                lastPoint.Latitude, lastPoint.Longitude);

            if (distance > maxDistance)
            {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        if (maxDistance > epsilonMeters)
        {
            bitArray[maxIndex] = true;
            SimplifyRecursive(points, firstIndex, maxIndex, epsilonMeters, bitArray);
            SimplifyRecursive(points, maxIndex, lastIndex, epsilonMeters, bitArray);
        }
    }
}
