import { useState, useEffect, useCallback } from 'react';
import { achievementService } from '../services/AchievementService';
import { Achievement } from '../types';

export function useAchievements(userId = 'usr-1') {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await achievementService.getUserAchievements(userId);
      setAchievements(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const recordProgress = async (code: string, value: number) => {
    try {
      await achievementService.recordProgress(userId, code, value);
      await fetchAchievements();
    } catch (err: any) {
      setError(err?.message || 'Failed to update achievement progress');
    }
  };

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  return {
    achievements,
    unlockedCount,
    totalCount,
    loading,
    error,
    refresh: fetchAchievements,
    recordProgress,
  };
}
