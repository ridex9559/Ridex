import { useState, useEffect, useCallback } from 'react';
import { routeService } from '../services/RouteService';
import { Route } from '../types';

export function useRoutes(category?: string, search?: string) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeService.getRoutes(category, search);
      setRoutes(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const getRouteById = async (id: string): Promise<Route | null> => {
    return routeService.getRouteById(id);
  };

  return {
    routes,
    loading,
    error,
    refresh: fetchRoutes,
    getRouteById,
  };
}
