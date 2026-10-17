import { IAchievementRepository } from '../interfaces/IAchievementRepository';
import { Achievement } from '../../types';
import { mockAchievements } from '../../data/achievements';

export class MockAchievementRepository implements IAchievementRepository {
  private achievements: Achievement[] = [...mockAchievements];

  async getAllAchievements(): Promise<Achievement[]> {
    return [...this.achievements];
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return [...this.achievements];
  }

  async recordAchievementProgress(userId: string, achievementCode: string, progressValue: number): Promise<void> {
    const ach = this.achievements.find(
      (a) => a.id === achievementCode || a.title.toLowerCase().includes(achievementCode.toLowerCase())
    );
    if (ach) {
      ach.currentValue = progressValue;
      ach.progress = progressValue;
      const target = ach.targetValue || 100;
      ach.progressPercent = Math.min(100, Math.round((progressValue / target) * 100));
      if (progressValue >= target) {
        ach.isUnlocked = true;
        ach.unlockedAt = new Date().toISOString();
      }
    }
  }
}
