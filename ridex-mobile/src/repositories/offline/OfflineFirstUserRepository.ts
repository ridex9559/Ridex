import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '@/types/user';
import { localProfileRepository } from '@/services/database/repositories/LocalProfileRepository';
import { localSyncRepository } from '@/services/database/repositories/LocalSyncRepository';
import { syncService } from '@/services/offline/SyncService';
import { networkService } from '@/services/offline/NetworkService';
import {
  mapLocalProfileToDomain,
  mapDomainProfileToLocal,
} from '@/services/database/mappers';
import { SupabaseUserRepository } from '../supabase/SupabaseUserRepository';
import { supabaseClient } from '@/services/supabase/client';
import { logger } from '@/utils/logger';

export class OfflineFirstUserRepository implements IUserRepository {
  private fallbackCloudRepo = new SupabaseUserRepository();

  async getProfile(userId: string): Promise<User | null> {
    try {
      // 1. Read SQLite first
      const localProfile = await localProfileRepository.getProfile(userId);

      if (localProfile) {
        logger.info(`[OfflineFirstUserRepository] Returning profile for user ${userId} from SQLite.`);
        
        // Background sync if online
        if (await networkService.isOnline()) {
          syncService.syncNow().catch((err) => logger.warn('[OfflineFirstUserRepository] Background sync error:', err));
        }

        return mapLocalProfileToDomain(localProfile);
      }

      // 2. If not found and online, fetch from cloud
      if (await networkService.isOnline()) {
        logger.info(`[OfflineFirstUserRepository] Profile not in SQLite. Fetching from Supabase...`);
        const cloudUser = await this.fallbackCloudRepo.getProfile(userId);
        if (cloudUser) {
          const local = mapDomainProfileToLocal(cloudUser, 'SYNCED');
          await localProfileRepository.saveProfile(local);
          return cloudUser;
        }
      }

      return null;
    } catch (error) {
      logger.error('[OfflineFirstUserRepository] getProfile error:', error);
      return this.fallbackCloudRepo.getProfile(userId);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    return this.getProfile(user.id);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const current = (await this.getProfile(userId)) || {
      id: userId,
      name: data.name || 'RIDEX Rider',
      username: data.username || 'rider',
      email: data.email || 'rider@ridex.app',
      createdAt: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...current,
      ...data,
      name: data.name || current.name,
      username: data.username || current.username,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : current.avatarUrl,
      avatar: data.avatar !== undefined ? data.avatar : current.avatar,
      bio: data.bio !== undefined ? data.bio : current.bio,
      location: data.location !== undefined ? data.location : current.location,
    };

    const localProfile = mapDomainProfileToLocal(updatedUser, 'PENDING');

    // 1. Save to SQLite immediately
    await localProfileRepository.saveProfile(localProfile);

    // 2. Enqueue Sync
    await localSyncRepository.enqueue('profile', userId, 'UPDATE', localProfile);

    // 3. Trigger sync asynchronously
    syncService.syncNow().catch((err) => logger.warn('[OfflineFirstUserRepository] Async sync error:', err));

    return updatedUser;
  }

  async getFollowers(userId: string): Promise<User[]> {
    if (await networkService.isOnline()) {
      return this.fallbackCloudRepo.getFollowers(userId);
    }
    return [];
  }

  async getFollowing(userId: string): Promise<User[]> {
    if (await networkService.isOnline()) {
      return this.fallbackCloudRepo.getFollowing(userId);
    }
    return [];
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (await networkService.isOnline()) {
      return this.fallbackCloudRepo.followUser(followerId, followingId);
    }
    logger.warn('[OfflineFirstUserRepository] Cannot follow user while offline.');
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (await networkService.isOnline()) {
      return this.fallbackCloudRepo.unfollowUser(followerId, followingId);
    }
    logger.warn('[OfflineFirstUserRepository] Cannot unfollow user while offline.');
  }
}
