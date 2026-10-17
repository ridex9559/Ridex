import { repositories } from '../repositories';
import { User } from '../types';

export class UserService {
  private userRepo = repositories.users;

  async getProfile(userId: string): Promise<User | null> {
    return this.userRepo.getProfile(userId);
  }

  async getCurrentUser(): Promise<User | null> {
    return this.userRepo.getCurrentUser();
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return this.userRepo.updateProfile(userId, data);
  }

  async getFollowers(userId: string): Promise<User[]> {
    return this.userRepo.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<User[]> {
    return this.userRepo.getFollowing(userId);
  }

  async toggleFollow(currentUserId: string, targetUserId: string, isCurrentlyFollowing: boolean): Promise<void> {
    if (isCurrentlyFollowing) {
      await this.userRepo.unfollowUser(currentUserId, targetUserId);
    } else {
      await this.userRepo.followUser(currentUserId, targetUserId);
    }
  }
}

export const userService = new UserService();
export default userService;
