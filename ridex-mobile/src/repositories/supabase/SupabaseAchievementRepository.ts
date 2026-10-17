import { IAchievementRepository } from '../interfaces/IAchievementRepository';
import { Achievement } from '../../types';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { AchievementMapper } from '../mappers/achievementMapper';

export class SupabaseAchievementRepository implements IAchievementRepository {
  async getAllAchievements(): Promise<Achievement[]> {
    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await (supabaseClient.from('achievements') as any)
        .select('*')
        .order('requirement_value', { ascending: true });
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r) => AchievementMapper.toDomain(r));
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const [achievements, userProgress] = await Promise.all([
      executeQuery<any[]>(async () => {
        const { data, error } = await (supabaseClient.from('achievements') as any)
          .select('*')
          .order('requirement_value', { ascending: true });
        if (error) throw error;
        return data || [];
      }),
      executeQuery<any[]>(async () => {
        const { data, error } = await (supabaseClient.from('user_achievements') as any)
          .select('*')
          .eq('user_id', userId);
        if (error) throw error;
        return data || [];
      }),
    ]);

    const progressMap = new Map((userProgress || []).map((p: any) => [p.achievement_id, p]));

    return (achievements || []).map((ach) => AchievementMapper.toDomain(ach, progressMap.get(ach.id)));
  }

  async recordAchievementProgress(userId: string, achievementCode: string, progressValue: number): Promise<void> {
    await executeQuery(async () => {
      const { data: ach, error: achErr } = await (supabaseClient.from('achievements') as any)
        .select('id, requirement_value')
        .or(`code.eq.${achievementCode},id.eq.${achievementCode}`)
        .single();
      if (achErr || !ach) return null;

      const isUnlocked = progressValue >= Number((ach as any).requirement_value);
      const unlockedAt = isUnlocked ? new Date().toISOString() : null;

      const { error } = await (supabaseClient.from('user_achievements') as any)
        .upsert(
          {
            user_id: userId,
            achievement_id: (ach as any).id,
            progress: progressValue,
            is_completed: isUnlocked,
            completed_at: unlockedAt,
          },
          { onConflict: 'user_id,achievement_id' }
        );
      if (error) throw error;
      return null;
    });
  }
}
