import { User } from '../../types';

export interface IUserRepository {
  getProfile(userId: string): Promise<User | null>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(userId: string, data: Partial<User>): Promise<User>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
}
