import { IGroupRepository } from '../interfaces/IGroupRepository';
import { RiderGroup } from '../../types';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { GroupMapper } from '../mappers/groupMapper';

export class SupabaseGroupRepository implements IGroupRepository {
  async getGroups(search?: string): Promise<RiderGroup[]> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const currentUserId = user?.id;

    const rows = await executeQuery<any[]>(async () => {
      let query = supabaseClient
        .from('groups')
        .select('*, group_members(user_id)')
        .order('members_count', { ascending: false });

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,region.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r: any) => {
      const isJoined = currentUserId
        ? (r.group_members || []).some((m: any) => m.user_id === currentUserId)
        : false;
      return GroupMapper.toDomain(r, isJoined);
    });
  }

  async getGroupById(id: string): Promise<RiderGroup | null> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const currentUserId = user?.id;

    const row = await executeQuery<any>(async () => {
      const { data, error } = await supabaseClient
        .from('groups')
        .select('*, group_members(user_id)')
        .eq('id', id)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    });

    if (!row) return null;
    const isJoined = currentUserId
      ? ((row as any).group_members || []).some((m: any) => m.user_id === currentUserId)
      : false;
    return GroupMapper.toDomain(row, isJoined);
  }

  async getUserGroups(userId: string): Promise<RiderGroup[]> {
    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await supabaseClient
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    });

    return (rows || [])
      .filter((r: any) => r.groups)
      .map((r: any) => GroupMapper.toDomain(r.groups, true));
  }

  async joinGroup(groupId: string, userId: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await supabaseClient
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId, role: 'member' } as any);
      if (error && error.code !== '23505') throw error;
      return null;
    });
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await supabaseClient
        .from('group_members')
        .delete()
        .match({ group_id: groupId, user_id: userId } as any);
      if (error) throw error;
      return null;
    });
  }
}
