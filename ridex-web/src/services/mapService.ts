/**
 * RIDEX Web — Zero-Cost Map & Routing Service
 * Connects to OpenStreetMap OSRM and Nominatim geocoding services.
 */

import { MapCoordinate, RouteManeuver } from '../types';

export interface RouteGeometryResult {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMinutes: number;
  maneuvers: RouteManeuver[];
}

const routeCache = new Map<string, RouteGeometryResult>();

export const mapService = {
  /**
   * Calculates driving route geometry and turn-by-turn distance through OSRM.
   */
  async calculateRoute(
    points: { latitude: number; longitude: number }[]
  ): Promise<RouteGeometryResult> {
    if (points.length < 2) {
      return { coordinates: [], distanceKm: 0, durationMinutes: 0, maneuvers: [] };
    }

    // Cache key for identical points
    const cacheKey = points.map((p) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`).join(';');
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)!;
    }

    // OSRM expects coordinates in lng,lat format
    const coordString = points
      .map((p) => `${p.longitude},${p.latitude}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM routing failed with status ${response.status}`);
      }

      const json = await response.json();
      if (!json.routes || json.routes.length === 0) {
        throw new Error('No route found between coordinates');
      }

      const primaryRoute = json.routes[0];
      const geojsonCoords: [number, number][] = primaryRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] // convert [lng, lat] to [lat, lng] for Leaflet
      );

      const distanceKm = Math.round((primaryRoute.distance / 1000) * 10) / 10;
      const durationMinutes = Math.round(primaryRoute.duration / 60);

      // Extract real turn-by-turn road maneuvers
      const maneuvers: RouteManeuver[] = [];
      if (primaryRoute.legs && Array.isArray(primaryRoute.legs)) {
        for (const leg of primaryRoute.legs) {
          if (leg.steps && Array.isArray(leg.steps)) {
            for (const step of leg.steps) {
              const stepName = step.name ? step.name.trim() : '';
              const mType = step.maneuver?.type || 'turn';
              const mMod = step.maneuver?.modifier || '';
              let instruction = '';

              if (mType === 'depart') {
                instruction = stepName ? `Depart towards ${stepName}` : 'Depart on route';
              } else if (mType === 'arrive') {
                instruction = stepName ? `Arrive at ${stepName}` : 'Arrive at checkpoint';
              } else if (mType === 'roundabout') {
                instruction = `Enter roundabout towards ${stepName || 'exit'}`.trim();
              } else if (mMod) {
                const modClean = mMod.replace('_', ' ');
                instruction = `Turn ${modClean} ${stepName ? `onto ${stepName}` : ''}`.trim();
              } else {
                instruction = `Continue ${stepName ? `onto ${stepName}` : 'straight'}`.trim();
              }

              const stepLoc = step.maneuver?.location;
              const location: [number, number] = stepLoc ? [stepLoc[1], stepLoc[0]] : [0, 0];

              maneuvers.push({
                instruction,
                type: mType,
                modifier: mMod,
                distanceMeters: Math.round(step.distance || 0),
                durationSeconds: Math.round(step.duration || 0),
                location,
              });
            }
          }
        }
      }

      const result: RouteGeometryResult = {
        coordinates: geojsonCoords,
        distanceKm,
        durationMinutes,
        maneuvers,
      };

      routeCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('[mapService] OSRM routing error, falling back to straight polyline:', error);

      // Fallback: direct segment coordinates
      const fallbackCoords: [number, number][] = points.map((p) => [p.latitude, p.longitude]);
      return {
        coordinates: fallbackCoords,
        distanceKm: 0,
        durationMinutes: 0,
        maneuvers: [],
      };
    }
  },

  /**
   * Geocodes an address or landmark via OpenStreetMap Nominatim.
   */
  async searchLocation(query: string): Promise<MapCoordinate[]> {
    if (!query || query.trim().length < 2) return [];

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=5&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) return [];

      const results = await response.json();
      return (results || []).map((item: any) => ({
        name: item.display_name.split(',')[0],
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
    } catch (err) {
      console.error('[mapService] Nominatim search error:', err);
      return [];
    }
  },
};
