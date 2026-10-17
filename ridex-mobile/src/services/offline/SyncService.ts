import { AppState, AppStateStatus } from 'react-native';
import { supabaseClient } from '../supabase/client';
import { networkService } from './NetworkService';
import { localSyncRepository } from '../database/repositories/LocalSyncRepository';
import { localProfileRepository } from '../database/repositories/LocalProfileRepository';
import { localMotorcycleRepository } from '../database/repositories/LocalMotorcycleRepository';
import { localRideRepository } from '../database/repositories/LocalRideRepository';
import { localRideLocationRepository } from '../database/repositories/LocalRideLocationRepository';
import { SyncQueueManager } from './SyncQueue';
import { ConflictResolver } from './ConflictResolver';
import { SyncStatusService } from './SyncStatusService';
import {
  mapCloudProfileToLocal,
  mapCloudMotorcycleToLocal,
  mapCloudRideToLocal,
  mapLocalMotorcycleToCloud,
  mapLocalRideToCloud,
} from '../database/mappers';
import { logger } from '@/utils/logger';

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  errors: string[];
}

export class SyncService {
  private static instance: SyncService | null = null;
  private isSyncRunning = false;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    logger.info('[SyncService] Initializing automatic synchronization triggers...');

    // 1. Subscribe to network state recovery (OFFLINE -> ONLINE)
    networkService.subscribe((state) => {
      if (state.status === 'ONLINE') {
        logger.info('[SyncService] Network recovery detected. Scheduling sync...');
        setTimeout(() => {
          this.syncNow().catch((err) => logger.error('[SyncService] Network recovery sync failed:', err));
        }, 1500);
      }
    });

    // 2. Subscribe to AppState (Active / Foreground)
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        logger.info('[SyncService] App resumed to foreground. Triggering sync...');
        this.syncNow().catch((err) => logger.error('[SyncService] Foreground sync failed:', err));
      }
    });

    // Initial count refresh
    SyncStatusService.refreshCounts();
  }

  /**
   * Main synchronization routine.
   * Acquires a strict atomic lock to ensure only one sync process runs at any time.
   */
  public async syncNow(): Promise<SyncResult> {
    if (this.isSyncRunning) {
      logger.info('[SyncService] Sync is already running. Skipping duplicate request.');
      return { success: false, pushedCount: 0, pulledCount: 0, errors: ['Sync already in progress'] };
    }

    const isOnline = await networkService.isOnline();
    if (!isOnline) {
      logger.info('[SyncService] Device is offline. Sync deferred.');
      return { success: false, pushedCount: 0, pulledCount: 0, errors: ['Device offline'] };
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) {
      logger.info('[SyncService] No authenticated session found. Sync aborted.');
      return { success: false, pushedCount: 0, pulledCount: 0, errors: ['No authenticated user'] };
    }

    this.isSyncRunning = true;
    SyncStatusService.setSyncing(true);

    const result: SyncResult = {
      success: true,
      pushedCount: 0,
      pulledCount: 0,
      errors: [],
    };

    try {
      logger.info(`[SyncService] Starting sync cycle for user ${user.id}...`);

      // ----------------------------------------------------
      // STEP 1: PUSH LOCAL CHANGES TO SUPABASE
      // ----------------------------------------------------
      const pendingItems = await localSyncRepository.getPendingOperations(50);
      logger.info(`[SyncService] Found ${pendingItems.length} pending local sync operations.`);

      // Sort operations by entity dependency: profile -> motorcycle -> ride -> ride_location
      const entityOrder: Record<string, number> = {
        profile: 1,
        motorcycle: 2,
        ride: 3,
        ride_location: 4,
      };

      const sortedItems = [...pendingItems].sort(
        (a, b) => (entityOrder[a.entity_type] || 99) - (entityOrder[b.entity_type] || 99)
      );

      for (const item of sortedItems) {
        try {
          await this.processPushOperation(item, user.id);
          result.pushedCount++;
        } catch (opError: any) {
          logger.error(`[SyncService] Failed processing push operation ${item.id}:`, opError);
          result.errors.push(`${item.entity_type}:${item.entity_id} - ${opError.message || opError}`);
          await SyncQueueManager.markFailed(item.id, opError, item.retry_count);
        }
      }

      // ----------------------------------------------------
      // STEP 2: PULL REMOTE CHANGES FROM SUPABASE
      // ----------------------------------------------------
      try {
        const pullCount = await this.processPullChanges(user.id);
        result.pulledCount = pullCount;
      } catch (pullError: any) {
        logger.error('[SyncService] Pull changes failed:', pullError);
        result.errors.push(`Pull: ${pullError.message || pullError}`);
      }

      // ----------------------------------------------------
      // STEP 3: UPDATE METADATA & STATUS
      // ----------------------------------------------------
      const nowIso = new Date().toISOString();
      await localSyncRepository.updateSyncMetadata('all', nowIso, nowIso);
      SyncStatusService.setLastSyncAt(nowIso);
      SyncStatusService.setLastError(result.errors.length > 0 ? result.errors[0] : null);

      logger.info(`[SyncService] Sync cycle finished. Pushed: ${result.pushedCount}, Pulled: ${result.pulledCount}`);
    } catch (globalError: any) {
      logger.error('[SyncService] Fatal error during sync cycle:', globalError);
      result.success = false;
      result.errors.push(globalError.message || 'Fatal sync failure');
      SyncStatusService.setLastError(globalError.message || 'Sync failed');
    } finally {
      this.isSyncRunning = false;
      SyncStatusService.setSyncing(false);
      await SyncStatusService.refreshCounts();
    }

    return result;
  }

  private async processPushOperation(item: any, userId: string): Promise<void> {
    const payload = item.payload ? JSON.parse(item.payload) : {};

    const isUuid = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (item.entity_type === 'profile') {
      if (item.operation === 'UPDATE' || item.operation === 'CREATE') {
        const { error } = await (supabaseClient.from('profiles') as any)
          .upsert({
            id: isUuid(userId) ? userId : undefined,
            full_name: payload.full_name || payload.name,
            username: payload.username,
            avatar_url: payload.avatar_url || payload.avatarUrl,
            bio: payload.bio,
            city: payload.city,
            country: payload.country,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
        await localProfileRepository.updateSyncStatus(item.entity_id, 'SYNCED');
      }
    } else if (item.entity_type === 'motorcycle') {
      if (item.operation === 'DELETE') {
        const { error } = await (supabaseClient.from('motorcycles') as any)
          .delete()
          .eq('id', item.entity_id);
        if (error) throw error;
      } else {
        const cloudData = mapLocalMotorcycleToCloud(payload);
        if (!isUuid(cloudData.user_id)) cloudData.user_id = userId;
        const { error } = await (supabaseClient.from('motorcycles') as any)
          .upsert(cloudData);
        if (error) throw error;
        await localMotorcycleRepository.updateSyncStatus(item.entity_id, 'SYNCED');
      }
    } else if (item.entity_type === 'ride') {
      if (item.operation === 'DELETE') {
        const { error } = await (supabaseClient.from('rides') as any)
          .delete()
          .eq('id', item.entity_id);
        if (error) throw error;
      } else {
        const cloudData = mapLocalRideToCloud(payload);
        if (!isUuid(cloudData.user_id)) cloudData.user_id = userId;
        if (cloudData.motorcycle_id && !isUuid(cloudData.motorcycle_id)) {
          delete cloudData.motorcycle_id;
        }
        const { error } = await (supabaseClient.from('rides') as any)
          .upsert(cloudData);
        if (error) throw error;
        await localRideRepository.updateSyncStatus(item.entity_id, 'SYNCED', new Date().toISOString(), payload.version || 1);
      }
    } else if (item.entity_type === 'ride_location') {
      if (Array.isArray(payload) && payload.length > 0) {
        const cloudPoints = payload
          .filter((p) => isUuid(p.ride_id))
          .map((p) => ({
            id: isUuid(p.id) ? p.id : undefined,
            ride_id: p.ride_id,
            latitude: p.latitude,
            longitude: p.longitude,
            altitude: p.altitude || 0,
            speed_kmh: p.speed !== null && p.speed !== undefined ? (p.speed > 100 ? p.speed : p.speed * 3.6) : 0,
            accuracy_meters: p.accuracy || null,
            heading_degrees: p.heading || null,
            recorded_at: p.recorded_at,
          }));

        if (cloudPoints.length > 0) {
          const { error } = await (supabaseClient.from('ride_locations') as any)
            .upsert(cloudPoints, { onConflict: 'id' });
          if (error) throw error;
        }

        const ids = payload.map((p) => p.id);
        await localRideLocationRepository.updateLocationsSyncStatus(ids, 'SYNCED');
      }
    }

    await SyncQueueManager.markCompleted(item.id);
  }

  private async processPullChanges(userId: string): Promise<number> {
    let pulledCount = 0;
    const metadata = await localSyncRepository.getSyncMetadata('all');
    const lastSyncAt = metadata?.last_successful_sync_at;

    // 1. Pull Profile
    const { data: cloudProfile, error: profileErr } = await (supabaseClient.from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .single();

    if (!profileErr && cloudProfile) {
      const localProfile = await localProfileRepository.getProfile(userId);
      const remoteProfileLocal = mapCloudProfileToLocal(cloudProfile);

      if (localProfile) {
        const resolved = ConflictResolver.resolveProfile(localProfile, remoteProfileLocal);
        await localProfileRepository.saveProfile(resolved.resolvedData);
      } else {
        await localProfileRepository.saveProfile(remoteProfileLocal);
      }
      pulledCount++;
    }

    // 2. Pull Motorcycles
    let motoQuery = (supabaseClient.from('motorcycles') as any).select('*').eq('user_id', userId);
    if (lastSyncAt) {
      motoQuery = motoQuery.gte('updated_at', lastSyncAt);
    }
    const { data: cloudBikes, error: bikesErr } = await motoQuery;
    if (!bikesErr && cloudBikes && cloudBikes.length > 0) {
      for (const bike of cloudBikes) {
        const remoteLocal = mapCloudMotorcycleToLocal(bike);
        const localBike = await localMotorcycleRepository.getMotorcycleById(bike.id, userId);
        if (localBike) {
          const resolved = ConflictResolver.resolveMotorcycle(localBike, remoteLocal);
          await localMotorcycleRepository.saveMotorcycle(resolved.resolvedData);
        } else {
          await localMotorcycleRepository.saveMotorcycle(remoteLocal);
        }
        pulledCount++;
      }
    }

    // 3. Pull Rides (Recent 50 or since last sync)
    let rideQuery = (supabaseClient.from('rides') as any)
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(50);

    if (lastSyncAt) {
      rideQuery = rideQuery.gte('updated_at', lastSyncAt);
    }
    const { data: cloudRides, error: ridesErr } = await rideQuery;
    if (!ridesErr && cloudRides && cloudRides.length > 0) {
      for (const ride of cloudRides) {
        const remoteLocal = mapCloudRideToLocal(ride);
        const localRide = await localRideRepository.getRideById(ride.id, userId);
        if (localRide) {
          const resolved = ConflictResolver.resolveRide(localRide, remoteLocal);
          await localRideRepository.saveRide(resolved.resolvedData);
        } else {
          await localRideRepository.saveRide(remoteLocal);
        }
        pulledCount++;
      }
    }

    return pulledCount;
  }
}

export const syncService = SyncService.getInstance();
