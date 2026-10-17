import { IMotorcycleRepository } from '../interfaces/IMotorcycleRepository';
import { Motorcycle, CreateMotorcycleDto } from '../../types';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { MotorcycleMapper } from '../mappers/motorcycleMapper';

export class SupabaseMotorcycleRepository implements IMotorcycleRepository {
  async getMotorcycles(userId: string): Promise<Motorcycle[]> {
    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await (supabaseClient.from('motorcycles') as any)
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r) => MotorcycleMapper.toDomain(r));
  }

  async getMotorcycleById(id: string): Promise<Motorcycle | null> {
    const row = await executeQuery<any>(async () => {
      const { data, error } = await (supabaseClient.from('motorcycles') as any)
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    });

    if (!row) return null;
    return MotorcycleMapper.toDomain(row);
  }

  async createMotorcycle(userId: string, data: CreateMotorcycleDto): Promise<Motorcycle> {
    const insertPayload = MotorcycleMapper.toInsert(userId, data);
    const row = await executeQuery<any>(async () => {
      const { data: created, error } = await (supabaseClient.from('motorcycles') as any)
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return created;
    });

    return MotorcycleMapper.toDomain(row);
  }

  async updateMotorcycle(id: string, data: Partial<Motorcycle>): Promise<Motorcycle> {
    const updatePayload = MotorcycleMapper.toUpdate(data);
    const row = await executeQuery<any>(async () => {
      const { data: updated, error } = await (supabaseClient.from('motorcycles') as any)
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    });

    return MotorcycleMapper.toDomain(row);
  }

  async deleteMotorcycle(id: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await (supabaseClient.from('motorcycles') as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return null;
    });
  }

  async setPrimaryMotorcycle(userId: string, id: string): Promise<void> {
    await executeQuery(async () => {
      // First uncheck all
      const { error: err1 } = await (supabaseClient.from('motorcycles') as any)
        .update({ is_primary: false })
        .eq('user_id', userId);
      if (err1) throw err1;

      // Set target to primary
      const { error: err2 } = await (supabaseClient.from('motorcycles') as any)
        .update({ is_primary: true })
        .eq('id', id)
        .eq('user_id', userId);
      if (err2) throw err2;

      return null;
    });
  }
}
