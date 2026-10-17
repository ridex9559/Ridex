import { IRouteRepository } from '../interfaces/IRouteRepository';
import { Route } from '../../types';
import { mockRoutes } from '../../data/routes';

export class MockRouteRepository implements IRouteRepository {
  private routes: Route[] = [...mockRoutes];

  async getRoutes(category?: string, search?: string, limit = 20): Promise<Route[]> {
    let filtered = [...this.routes];

    if (category && category.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((r) => r.category.toUpperCase() === category.toUpperCase());
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle?.toLowerCase().includes(q) ||
          r.startLocationName.toLowerCase().includes(q) ||
          r.endLocationName.toLowerCase().includes(q)
      );
    }

    return filtered.slice(0, limit);
  }

  async getRouteById(id: string): Promise<Route | null> {
    return this.routes.find((r) => r.id === id) || null;
  }

  async createRoute(route: Partial<Route>): Promise<Route> {
    const newRoute: Route = {
      id: route.id || `route-${Date.now()}`,
      title: route.title || 'Untitled Route',
      subtitle: route.subtitle,
      category: route.category || 'TWISTIES',
      distanceKm: route.distanceKm || 0,
      estimatedDurationHours: route.estimatedDurationHours || 1,
      estimatedDurationSeconds: route.estimatedDurationSeconds || 3600,
      rating: route.rating || 5.0,
      reviewsCount: route.reviewsCount || 0,
      difficulty: route.difficulty || 'MODERATE',
      elevationGainMeters: route.elevationGainMeters || 0,
      curvatureIndex: route.curvatureIndex || 50,
      startLocationName: route.startLocationName || 'Origin',
      endLocationName: route.endLocationName || 'Destination',
      heroImage: route.heroImage,
      description: route.description,
      aboutText: route.aboutText,
      bestTimeToVisit: route.bestTimeToVisit,
      waypoints: route.waypoints,
      coordinates: route.coordinates,
    };

    this.routes.unshift(newRoute);
    return newRoute;
  }

  async updateRoute(id: string, route: Partial<Route>): Promise<Route> {
    const idx = this.routes.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Route not found: ${id}`);
    }
    const updated = { ...this.routes[idx], ...route };
    this.routes[idx] = updated;
    return updated;
  }

  async getCuratedRoutes(): Promise<Route[]> {
    return this.routes.slice(0, 10);
  }
}
