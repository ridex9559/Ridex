namespace RIDEX.Shared.Algorithms;

public static class GeoMath
{
    private const double EarthRadiusKm = 6371.0;
    private const double EarthRadiusMeters = 6371000.0;

    /// <summary>
    /// Calculates the great-circle distance between two coordinates in kilometers using the Haversine formula.
    /// </summary>
    public static double HaversineDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var rLat1 = ToRadians(lat1);
        var rLat2 = ToRadians(lat2);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(rLat1) * Math.Cos(rLat2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    /// <summary>
    /// Calculates the great-circle distance between two coordinates in meters.
    /// </summary>
    public static double HaversineDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        return HaversineDistanceKm(lat1, lon1, lat2, lon2) * 1000.0;
    }

    /// <summary>
    /// Calculates the initial bearing from point 1 to point 2 in degrees (0..360).
    /// </summary>
    public static double CalculateBearing(double lat1, double lon1, double lat2, double lon2)
    {
        var rLat1 = ToRadians(lat1);
        var rLat2 = ToRadians(lat2);
        var dLon = ToRadians(lon2 - lon1);

        var y = Math.Sin(dLon) * Math.Cos(rLat2);
        var x = Math.Cos(rLat1) * Math.Sin(rLat2) -
                Math.Sin(rLat1) * Math.Cos(rLat2) * Math.Cos(dLon);

        var bearing = Math.Atan2(y, x);
        var degrees = ToDegrees(bearing);
        return (degrees + 360.0) % 360.0;
    }

    /// <summary>
    /// Computes the centroid (average center) of a collection of coordinates.
    /// </summary>
    public static (double Latitude, double Longitude) CalculateCentroid(IEnumerable<(double Lat, double Lon)> points)
    {
        var list = points.ToList();
        if (!list.Any())
            return (0, 0);

        double totalLat = 0;
        double totalLon = 0;
        foreach (var (lat, lon) in list)
        {
            totalLat += lat;
            totalLon += lon;
        }

        return (totalLat / list.Count, totalLon / list.Count);
    }

    /// <summary>
    /// Checks if a rider's distance from the leader/group centroid exceeds the threshold.
    /// </summary>
    public static bool IsRiderSeparated(double riderLat, double riderLon, double groupLat, double groupLon, double thresholdKm)
    {
        var distance = HaversineDistanceKm(riderLat, riderLon, groupLat, groupLon);
        return distance > thresholdKm;
    }

    /// <summary>
    /// Perpendicular distance in meters from a point P to a line segment AB.
    /// </summary>
    public static double PerpendicularDistanceMeters(
        double pLat, double pLon,
        double aLat, double aLon,
        double bLat, double bLon)
    {
        if (Math.Abs(aLat - bLat) < 1e-9 && Math.Abs(aLon - bLon) < 1e-9)
        {
            return HaversineDistanceMeters(pLat, pLon, aLat, aLon);
        }

        // Convert to local Cartesian approximation in meters
        var xA = 0.0;
        var yA = 0.0;
        var xB = HaversineDistanceMeters(aLat, aLon, aLat, bLon) * (bLon >= aLon ? 1 : -1);
        var yB = HaversineDistanceMeters(aLat, aLon, bLat, aLon) * (bLat >= aLat ? 1 : -1);

        var xP = HaversineDistanceMeters(aLat, aLon, aLat, pLon) * (pLon >= aLon ? 1 : -1);
        var yP = HaversineDistanceMeters(aLat, aLon, pLat, aLon) * (pLat >= aLat ? 1 : -1);

        var dx = xB - xA;
        var dy = yB - yA;
        var lengthSquared = dx * dx + dy * dy;

        if (lengthSquared < 1e-6)
            return Math.Sqrt(xP * xP + yP * yP);

        var t = Math.Max(0, Math.Min(1, ((xP - xA) * dx + (yP - yA) * dy) / lengthSquared));
        var projX = xA + t * dx;
        var projY = yA + t * dy;

        var distProjX = xP - projX;
        var distProjY = yP - projY;

        return Math.Sqrt(distProjX * distProjX + distProjY * distProjY);
    }

    public static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
    public static double ToDegrees(double radians) => radians * 180.0 / Math.PI;
}
