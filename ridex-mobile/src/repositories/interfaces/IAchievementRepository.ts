import { Achievement } from '../../types';

export interface IAchievementRepository {
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  recordAchievementProgress(userId: string, achievementCode: string, progressValue: number): Promise<void>;
}
