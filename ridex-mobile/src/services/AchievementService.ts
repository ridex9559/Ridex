import { repositories } from '../repositories';
import { Achievement } from '../types';

export class AchievementService {
  private achievementRepo = repositories.achievements;

  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementRepo.getAllAchievements();
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return this.achievementRepo.getUserAchievements(userId);
  }

  async recordProgress(userId: string, achievementCode: string, progressValue: number): Promise<void> {
    return this.achievementRepo.recordAchievementProgress(userId, achievementCode, progressValue);
  }
}

export const achievementService = new AchievementService();
export default achievementService;
