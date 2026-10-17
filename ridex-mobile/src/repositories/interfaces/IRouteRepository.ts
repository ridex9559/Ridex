import { Route } from '../../types';

export interface IRouteRepository {
  getRoutes(category?: string, search?: string, limit?: number): Promise<Route[]>;
  getRouteById(id: string): Promise<Route | null>;
  createRoute(route: Partial<Route>): Promise<Route>;
  updateRoute(id: string, route: Partial<Route>): Promise<Route>;
  getCuratedRoutes(): Promise<Route[]>;
}
