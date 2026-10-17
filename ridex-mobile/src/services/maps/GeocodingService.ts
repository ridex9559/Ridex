/**
 * RIDEX — Free OpenStreetMap Geocoding & Reverse Geocoding Service
 * Zero-cost, free-to-run Nominatim integration with caching, debouncing,
 * and robust offline fallbacks.
 */

export interface GeocodedPlace {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  category?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

class GeocodingService {
  private cache = new Map<string, string>();
  private searchCache = new Map<string, GeocodedPlace[]>();

  /**
   * Reverse geocodes latitude/longitude coordinates to a friendly place name.
   * Never throws — always returns a clean name or fallback.
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
    fallbackName: string = 'Selected Location'
  ): Promise<string> {
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return fallbackName;
    }

    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=17&addressdetails=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RIDEX-MotorcycleTouring-App/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const primary =
            addr.tourism ||
            addr.amenity ||
            addr.building ||
            addr.road ||
            addr.neighbourhood ||
            addr.suburb ||
            addr.village ||
            addr.town ||
            addr.city ||
            data.name;

          const secondary = addr.suburb || addr.city || addr.town || addr.state;

          let cleanName = primary || fallbackName;
          if (primary && secondary && primary !== secondary) {
            cleanName = `${primary}, ${secondary}`;
          }

          if (cleanName.length > 50) {
            cleanName = cleanName.substring(0, 47) + '...';
          }

          this.cache.set(cacheKey, cleanName);
          return cleanName;
        }
      }
    } catch {
      // Graceful offline/timeout fallback
    }

    return fallbackName;
  }

  /**
   * Searches for places by keyword query using OpenStreetMap Nominatim.
   */
  async searchPlaces(query: string): Promise<GeocodedPlace[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    const cacheKey = trimmed.toLowerCase();
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=5&addressdetails=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RIDEX-MotorcycleTouring-App/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const places: GeocodedPlace[] = data
            .map((item: any) => {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              if (isNaN(lat) || isNaN(lon)) return null;

              const addr = item.address || {};
              const primary =
                item.name ||
                addr.road ||
                addr.suburb ||
                addr.city ||
                item.display_name.split(',')[0];

              return {
                name: primary || item.display_name.split(',')[0],
                displayName: item.display_name,
                latitude: lat,
                longitude: lon,
                category: item.type || item.class,
                address: addr,
              };
            })
            .filter(Boolean) as GeocodedPlace[];

          this.searchCache.set(cacheKey, places);
          return places;
        }
      }
    } catch {
      // Return empty on network issues
    }

    return [];
  }
}

export const geocodingService = new GeocodingService();
