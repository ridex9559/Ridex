import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../../types';
import { mockCurrentUser, mockUserStats, mockCommunityUsers } from '../../data/users';

export class MockUserRepository implements IUserRepository {
  private currentUser: User = {
    ...mockCurrentUser,
    statistics: { ...mockUserStats },
  };

  private users: Map<string, User> = new Map([
    [mockCurrentUser.id, { ...mockCurrentUser, statistics: { ...mockUserStats } }],
    ...mockCommunityUsers.map((u): [string, User] => [u.id, { ...u }]),
  ]);

  private following: Set<string> = new Set(mockCommunityUsers.map((u) => u.id));

  async getProfile(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const existing = this.users.get(userId) || this.currentUser;
    const updated: User = {
      ...existing,
      ...data,
      statistics: data.statistics ? { ...existing.statistics, ...data.statistics } : existing.statistics,
    };
    this.users.set(userId, updated);
    if (this.currentUser.id === userId) {
      this.currentUser = updated;
    }
    return updated;
  }

  async getFollowers(userId: string): Promise<User[]> {
    return mockCommunityUsers;
  }

  async getFollowing(userId: string): Promise<User[]> {
    return Array.from(this.following)
      .map((id) => this.users.get(id))
      .filter((u): u is User => !!u);
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    this.following.add(followingId);
    if (this.currentUser.statistics) {
      this.currentUser.statistics.followingCount = this.following.size;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    this.following.delete(followingId);
    if (this.currentUser.statistics) {
      this.currentUser.statistics.followingCount = this.following.size;
    }
  }
}
