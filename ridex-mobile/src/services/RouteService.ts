import { repositories } from '../repositories';
import { Route } from '../types';

export class RouteService {
  private routeRepo = repositories.routes;

  async getRoutes(category?: string, search?: string, limit = 20): Promise<Route[]> {
    return this.routeRepo.getRoutes(category, search, limit);
  }

  async getRouteById(id: string): Promise<Route | null> {
    return this.routeRepo.getRouteById(id);
  }

  async createRoute(route: Partial<Route>): Promise<Route> {
    return this.routeRepo.createRoute(route);
  }

  async getCuratedRoutes(): Promise<Route[]> {
    return this.routeRepo.getCuratedRoutes();
  }
}

export const routeService = new RouteService();
export default routeService;
