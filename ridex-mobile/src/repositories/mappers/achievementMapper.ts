import { Database } from '../../services/supabase/types';
import { Achievement } from '../../types';

type AchievementRow = Database['public']['Tables']['achievements']['Row'];
type UserAchievementRow = Database['public']['Tables']['user_achievements']['Row'];

export class AchievementMapper {
  static toDomain(achievement: AchievementRow, userProgress?: UserAchievementRow | null): Achievement {
    const isUnlocked = userProgress?.is_completed ?? false;
    const currentValue = userProgress?.progress ? Number(userProgress.progress) : 0;
    const targetValue = Number(achievement.requirement_value) || 100;
    const progressPercent = Math.min(100, Math.round((currentValue / targetValue) * 100));

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon || 'award',
      progressPercent,
      progress: progressPercent,
      currentValue,
      targetValue,
      maxProgress: targetValue,
      unit: achievement.unit ?? undefined,
      isUnlocked,
      unlockedAt: userProgress?.completed_at ?? undefined,
    };
  }
}
