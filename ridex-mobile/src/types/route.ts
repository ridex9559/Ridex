/**
 * Route and Discovery Domain Models
 */

export type RouteCategory =
  | 'ALL'
  | 'TWISTIES'
  | 'MOUNTAIN_PASS'
  | 'COASTAL'
  | 'OFF_ROAD'
  | 'TRACK'
  | 'mountains'
  | 'coastal'
  | 'weekend'
  | 'long'
  | 'scenic';

export interface Waypoint {
  id?: string;
  name: string;
  distanceFromStartKm: number;
  latitude?: number;
  longitude?: number;
  description?: string;
}

export interface Route {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  distanceKm: number;
  estimatedDurationHours?: number;
  estimatedDurationSeconds?: number;
  rating: number;
  reviewsCount?: number;
  difficulty: 'EASY' | 'MODERATE' | 'ADVANCED' | 'EXPERT' | 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  elevationGainMeters: number;
  curvatureIndex?: number;
  startLocationName: string;
  endLocationName: string;
  heroImage?: string;
  description?: string;
  aboutText?: string;
  bestTimeToVisit?: string;
  waypoints?: Waypoint[];
  coordinates?: [number, number][];
}
