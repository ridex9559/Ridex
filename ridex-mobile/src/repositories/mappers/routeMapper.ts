import { Database } from '../../services/supabase/types';
import { Route } from '../../types';

type RouteRow = Database['public']['Tables']['routes']['Row'];
type RouteInsert = Database['public']['Tables']['routes']['Insert'];
type RouteUpdate = Database['public']['Tables']['routes']['Update'];

export class RouteMapper {
  static toDomain(row: RouteRow): Route {
    const distanceKm = Number(((Number(row.distance_meters) || 0) / 1000).toFixed(1)) || 0;
    const durationHours = row.estimated_duration_seconds
      ? Number((row.estimated_duration_seconds / 3600).toFixed(1))
      : 1;

    return {
      id: row.id,
      title: row.title,
      category: 'TWISTIES',
      distanceKm,
      estimatedDurationHours: durationHours,
      estimatedDurationSeconds: row.estimated_duration_seconds,
      rating: 4.9,
      reviewsCount: 150,
      difficulty: (row.difficulty.toUpperCase() as any) || 'MODERATE',
      elevationGainMeters: 1000,
      curvatureIndex: row.curvature_index ? Number(row.curvature_index) : 8.5,
      startLocationName: row.start_location_name,
      endLocationName: row.end_location_name,
      heroImage: row.cover_image_url ?? undefined,
      description: row.description ?? undefined,
    };
  }

  static toInsert(userId: string, route: Partial<Route>): RouteInsert {
    return {
      id: route.id,
      created_by: userId,
      title: route.title || 'Untitled Route',
      description: route.description || null,
      difficulty: (route.difficulty?.toLowerCase() as any) || 'moderate',
      distance_meters: (route.distanceKm || 0) * 1000,
      estimated_duration_seconds:
        route.estimatedDurationSeconds ||
        (route.estimatedDurationHours ? Math.round(route.estimatedDurationHours * 3600) : 3600),
      curvature_index: route.curvatureIndex || 8.0,
      start_latitude: 0,
      start_longitude: 0,
      end_latitude: 0,
      end_longitude: 0,
      start_location_name: route.startLocationName || '',
      end_location_name: route.endLocationName || '',
      cover_image_url: route.heroImage || null,
      visibility: 'public',
    };
  }

  static toUpdate(route: Partial<Route>): RouteUpdate {
    const update: RouteUpdate = {};
    if (route.title !== undefined) update.title = route.title;
    if (route.description !== undefined) update.description = route.description;
    if (route.difficulty !== undefined) update.difficulty = route.difficulty.toLowerCase() as any;
    if (route.distanceKm !== undefined) update.distance_meters = route.distanceKm * 1000;
    if (route.estimatedDurationSeconds !== undefined) update.estimated_duration_seconds = route.estimatedDurationSeconds;
    if (route.curvatureIndex !== undefined) update.curvature_index = route.curvatureIndex;
    if (route.startLocationName !== undefined) update.start_location_name = route.startLocationName;
    if (route.endLocationName !== undefined) update.end_location_name = route.endLocationName;
    if (route.heroImage !== undefined) update.cover_image_url = route.heroImage;
    return update;
  }
}
