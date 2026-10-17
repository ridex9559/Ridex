import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../../types';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { UserMapper } from '../mappers/userMapper';

export class SupabaseUserRepository implements IUserRepository {
  async getProfile(userId: string): Promise<User | null> {
    const profile = await executeQuery<any>(async () => {
      const { data, error } = await (supabaseClient.from('profiles') as any)
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    });

    if (!profile) return null;
    return UserMapper.toDomain(profile);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    return this.getProfile(user.id);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const updatePayload = UserMapper.toUpdate(data);
    const updated = await executeQuery<any>(async () => {
      const { data: row, error } = await (supabaseClient.from('profiles') as any)
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return row;
    });

    return UserMapper.toDomain(updated);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await (supabaseClient.from('follows') as any)
        .select('follower_id, profiles!follows_follower_id_fkey(*)')
        .eq('following_id', userId);
      if (error) throw error;
      return data || [];
    });

    return (rows || [])
      .filter((r: any) => r.profiles)
      .map((r: any) => UserMapper.toDomain(r.profiles));
  }

  async getFollowing(userId: string): Promise<User[]> {
    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await (supabaseClient.from('follows') as any)
        .select('following_id, profiles!follows_following_id_fkey(*)')
        .eq('follower_id', userId);
      if (error) throw error;
      return data || [];
    });

    return (rows || [])
      .filter((r: any) => r.profiles)
      .map((r: any) => UserMapper.toDomain(r.profiles));
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await (supabaseClient.from('follows') as any)
        .insert({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
      return null;
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await (supabaseClient.from('follows') as any)
        .delete()
        .match({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
      return null;
    });
  }
}
