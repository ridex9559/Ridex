import { IRouteRepository } from '../interfaces/IRouteRepository';
import { Route } from '../../types';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { RouteMapper } from '../mappers/routeMapper';

export class SupabaseRouteRepository implements IRouteRepository {
  async getRoutes(category?: string, search?: string, limit = 20): Promise<Route[]> {
    const rows = await executeQuery<any[]>(async () => {
      let query = (supabaseClient.from('routes') as any)
        .select('*')
        .eq('is_public', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (category && category.toUpperCase() !== 'ALL') {
        query = query.eq('category', category.toUpperCase());
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`title.ilike.%${q}%,start_location_name.ilike.%${q}%,end_location_name.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r) => RouteMapper.toDomain(r));
  }

  async getRouteById(id: string): Promise<Route | null> {
    const row = await executeQuery<any>(async () => {
      const { data, error } = await (supabaseClient.from('routes') as any)
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    });

    if (!row) return null;
    return RouteMapper.toDomain(row);
  }

  async createRoute(route: Partial<Route>): Promise<Route> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';
    const insertPayload = RouteMapper.toInsert(userId, route);

    const row = await executeQuery<any>(async () => {
      const { data: created, error } = await (supabaseClient.from('routes') as any)
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return created;
    });

    return RouteMapper.toDomain(row);
  }

  async updateRoute(id: string, route: Partial<Route>): Promise<Route> {
    const updatePayload = RouteMapper.toUpdate(route);
    const row = await executeQuery<any>(async () => {
      const { data: updated, error } = await (supabaseClient.from('routes') as any)
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    });

    return RouteMapper.toDomain(row);
  }

  async getCuratedRoutes(): Promise<Route[]> {
    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await (supabaseClient.from('routes') as any)
        .select('*')
        .eq('is_curated', true)
        .order('rating', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r) => RouteMapper.toDomain(r));
  }
}
