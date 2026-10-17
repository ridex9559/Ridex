/**
 * RIDEX — Multi-Waypoint Route & Geospatial Calculation Service
 * Computes multi-segment driving route coordinates, cumulative distances,
 * and estimated travel durations between Start -> Waypoint 1 -> Waypoint 2 -> Destination.
 * Uses public OpenStreetMap OSRM routing with smooth geodesic curvature fallback for 100% offline resilience.
 */

import { MapCoordinate } from './mapTypes';
import { LocationAnchor } from '../../types/groupRide';
import { RideCheckpoint } from '../../types/connectRide';
import { calculateDistanceMeters, isValidCoordinate, calculateRouteBounds } from '../../utils/geo/routeBounds';
import { logger } from '../../utils/logger';

export interface RouteSegment {
  fromName: string;
  toName: string;
  fromCoord: MapCoordinate;
  toCoord: MapCoordinate;
  distanceKm: number;
  durationMinutes: number;
  coordinates: MapCoordinate[];
}

export interface MultiStopRouteResult {
  coordinates: MapCoordinate[];
  distanceKm: number;
  durationMinutes: number;
  waypointsWithDistances: RideCheckpoint[];
  segments: RouteSegment[];
  isOnlineGeometry: boolean;
}

export class RouteCalculationService {
  private static instance: RouteCalculationService | null = null;

  public static getInstance(): RouteCalculationService {
    if (!RouteCalculationService.instance) {
      RouteCalculationService.instance = new RouteCalculationService();
    }
    return RouteCalculationService.instance;
  }

  /**
   * Calculates a complete multi-stop route connecting Start -> WP1 -> WP2 -> ... -> Destination.
   */
  public async calculateMultiStopRoute(
    start: LocationAnchor | null,
    waypoints: RideCheckpoint[],
    destination: LocationAnchor | null
  ): Promise<MultiStopRouteResult> {
    const stops: Array<{ name: string; coordinate: MapCoordinate; stopDurationMinutes: number; originalWp?: RideCheckpoint }> = [];

    if (start && isValidCoordinate(start.latitude, start.longitude)) {
      stops.push({
        name: start.name || 'Start',
        coordinate: { latitude: Number(start.latitude), longitude: Number(start.longitude) },
        stopDurationMinutes: 0,
      });
    }

    // Sort waypoints by sequence / orderIndex
    const sortedWaypoints = [...waypoints].sort((a, b) => (a.orderIndex ?? a.sequence ?? 0) - (b.orderIndex ?? b.sequence ?? 0));

    sortedWaypoints.forEach((wp) => {
      if (isValidCoordinate(wp.latitude, wp.longitude)) {
        stops.push({
          name: wp.name || 'Waypoint',
          coordinate: { latitude: Number(wp.latitude), longitude: Number(wp.longitude) },
          stopDurationMinutes: wp.estimatedStopMinutes || wp.stopDuration || 15,
          originalWp: wp,
        });
      }
    });

    if (destination && isValidCoordinate(destination.latitude, destination.longitude)) {
      stops.push({
        name: destination.name || 'Destination',
        coordinate: { latitude: Number(destination.latitude), longitude: Number(destination.longitude) },
        stopDurationMinutes: 0,
      });
    }

    if (stops.length < 2) {
      return {
        coordinates: stops.map((s) => s.coordinate),
        distanceKm: 0,
        durationMinutes: 0,
        waypointsWithDistances: sortedWaypoints,
        segments: [],
        isOnlineGeometry: false,
      };
    }

    // Attempt online OSRM multi-point route
    try {
      const osrmResult = await this.fetchOsrmRoute(stops.map((s) => s.coordinate));
      if (osrmResult && osrmResult.coordinates.length >= 2) {
        const totalDistanceKm = Math.round(osrmResult.distanceMeters / 1000) || 1;
        const totalStopMinutes = sortedWaypoints.reduce((acc, wp) => acc + (wp.estimatedStopMinutes || wp.stopDuration || 15), 0);
        const totalDurationMinutes = Math.round(osrmResult.durationSeconds / 60) + totalStopMinutes;

        // Calculate cumulative distances for waypoints
        const waypointsWithDistances = this.assignWaypointDistances(stops, sortedWaypoints);

        return {
          coordinates: osrmResult.coordinates,
          distanceKm: totalDistanceKm,
          durationMinutes: totalDurationMinutes,
          waypointsWithDistances,
          segments: osrmResult.segments,
          isOnlineGeometry: true,
        };
      }
    } catch (e) {
      logger.warn('[RouteCalculationService] OSRM multi-stop fetch failed, using fallback geometry:', e);
    }

    // Fallback: Geodesic multi-segment calculation with curved interpolation
    return this.calculateFallbackRoute(stops, sortedWaypoints);
  }

  /**
   * Fast synchronous fallback distance calculator for instant UI updates.
   */
  public calculateQuickDistanceKm(
    start: LocationAnchor | null,
    waypoints: RideCheckpoint[],
    destination: LocationAnchor | null
  ): number {
    const points: MapCoordinate[] = [];

    if (start && isValidCoordinate(start.latitude, start.longitude)) {
      points.push({ latitude: Number(start.latitude), longitude: Number(start.longitude) });
    }

    const sorted = [...waypoints].sort((a, b) => (a.orderIndex ?? a.sequence ?? 0) - (b.orderIndex ?? b.sequence ?? 0));
    sorted.forEach((wp) => {
      if (isValidCoordinate(wp.latitude, wp.longitude)) {
        points.push({ latitude: Number(wp.latitude), longitude: Number(wp.longitude) });
      }
    });

    if (destination && isValidCoordinate(destination.latitude, destination.longitude)) {
      points.push({ latitude: Number(destination.latitude), longitude: Number(destination.longitude) });
    }

    if (points.length < 2) return 0;

    let totalMeters = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalMeters += calculateDistanceMeters(points[i], points[i + 1]);
    }

    // Apply average road winding factor (1.25x haversine)
    return Math.max(1, Math.round((totalMeters * 1.25) / 1000));
  }

  /**
   * Fetches driving route from public OpenStreetMap OSRM API with 4s timeout.
   */
  private async fetchOsrmRoute(
    coords: MapCoordinate[]
  ): Promise<{ coordinates: MapCoordinate[]; distanceMeters: number; durationSeconds: number; segments: RouteSegment[] } | null> {
    const coordString = coords.map((c) => `${c.longitude},${c.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      if (!data || !data.routes || data.routes.length === 0) return null;

      const route = data.routes[0];
      const rawGeometry: [number, number][] = route.geometry.coordinates;

      const polylineCoords: MapCoordinate[] = rawGeometry.map(([lon, lat]) => ({
        latitude: lat,
        longitude: lon,
      }));

      // Extract legs/segments if available
      const segments: RouteSegment[] = [];
      if (route.legs && route.legs.length > 0) {
        for (let i = 0; i < route.legs.length && i < coords.length - 1; i++) {
          const leg = route.legs[i];
          segments.push({
            fromName: `Stop ${i + 1}`,
            toName: `Stop ${i + 2}`,
            fromCoord: coords[i],
            toCoord: coords[i + 1],
            distanceKm: Math.round((leg.distance || 0) / 1000),
            durationMinutes: Math.round((leg.duration || 0) / 60),
            coordinates: [coords[i], coords[i + 1]],
          });
        }
      }

      return {
        coordinates: polylineCoords,
        distanceMeters: route.distance || 0,
        durationSeconds: route.duration || 0,
        segments,
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  /**
   * Generates a curved geodesic fallback route connecting all points sequentially.
   */
  private calculateFallbackRoute(
    stops: Array<{ name: string; coordinate: MapCoordinate; stopDurationMinutes: number; originalWp?: RideCheckpoint }>,
    sortedWaypoints: RideCheckpoint[]
  ): MultiStopRouteResult {
    let totalMeters = 0;
    const allPolylineCoords: MapCoordinate[] = [];
    const segments: RouteSegment[] = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const p1 = stops[i].coordinate;
      const p2 = stops[i + 1].coordinate;

      const legMeters = calculateDistanceMeters(p1, p2) * 1.25; // 1.25x road factor
      totalMeters += legMeters;

      const legDistanceKm = Math.max(1, Math.round(legMeters / 1000));
      // Assume average riding speed ~50 km/h
      const legDurationMinutes = Math.max(1, Math.round((legDistanceKm / 50) * 60));

      // Generate intermediate curve points between p1 and p2 for realistic visual map rendering
      const legPoints = this.interpolateCurvedPoints(p1, p2, 8);
      if (i > 0) {
        // Skip first point to avoid duplicates
        allPolylineCoords.push(...legPoints.slice(1));
      } else {
        allPolylineCoords.push(...legPoints);
      }

      segments.push({
        fromName: stops[i].name,
        toName: stops[i + 1].name,
        fromCoord: p1,
        toCoord: p2,
        distanceKm: legDistanceKm,
        durationMinutes: legDurationMinutes,
        coordinates: legPoints,
      });
    }

    const totalDistanceKm = Math.max(1, Math.round(totalMeters / 1000));
    const totalStopMinutes = sortedWaypoints.reduce((acc, wp) => acc + (wp.estimatedStopMinutes || wp.stopDuration || 15), 0);
    // Average 50 km/h riding pace + stops
    const totalDurationMinutes = Math.round((totalDistanceKm / 50) * 60) + totalStopMinutes;

    const waypointsWithDistances = this.assignWaypointDistances(stops, sortedWaypoints);

    return {
      coordinates: allPolylineCoords,
      distanceKm: totalDistanceKm,
      durationMinutes: totalDurationMinutes,
      waypointsWithDistances,
      segments,
      isOnlineGeometry: false,
    };
  }

  /**
   * Calculates cumulative distance from start for each waypoint in sequence.
   */
  private assignWaypointDistances(
    stops: Array<{ name: string; coordinate: MapCoordinate; stopDurationMinutes: number; originalWp?: RideCheckpoint }>,
    sortedWaypoints: RideCheckpoint[]
  ): RideCheckpoint[] {
    let cumulativeDistKm = 0;

    return sortedWaypoints.map((wp, idx) => {
      // Find distance from previous stop
      const prevCoord = idx === 0 ? stops[0].coordinate : stops[idx].coordinate;
      const currCoord = { latitude: wp.latitude, longitude: wp.longitude };

      const segKm = Math.round((calculateDistanceMeters(prevCoord, currCoord) * 1.25) / 1000);
      cumulativeDistKm += segKm;

      return {
        ...wp,
        sequence: idx + 1,
        orderIndex: idx + 1,
        distanceFromStartKm: cumulativeDistKm,
      };
    });
  }

  /**
   * Generates smooth curved intermediate points between two coordinates.
   */
  private interpolateCurvedPoints(p1: MapCoordinate, p2: MapCoordinate, numPoints: number): MapCoordinate[] {
    const points: MapCoordinate[] = [];
    const midLat = (p1.latitude + p2.latitude) / 2;
    const midLng = (p1.longitude + p2.longitude) / 2;

    // Small perpendicular offset for road curvature feel
    const deltaLat = p2.latitude - p1.latitude;
    const deltaLng = p2.longitude - p1.longitude;
    const offsetLat = -deltaLng * 0.08;
    const offsetLng = deltaLat * 0.08;

    const controlPoint = {
      latitude: midLat + offsetLat,
      longitude: midLng + offsetLng,
    };

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Quadratic bezier curve: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
      const lat = Math.pow(1 - t, 2) * p1.latitude + 2 * (1 - t) * t * controlPoint.latitude + Math.pow(t, 2) * p2.latitude;
      const lng = Math.pow(1 - t, 2) * p1.longitude + 2 * (1 - t) * t * controlPoint.longitude + Math.pow(t, 2) * p2.longitude;
      points.push({ latitude: lat, longitude: lng });
    }

    return points;
  }
}

export const routeCalculationService = RouteCalculationService.getInstance();
