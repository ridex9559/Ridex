import { asyncStorage } from '@/services/storage/asyncStorage';
import { Ride } from '@/types/ride';
import { Route } from '@/types/route';
import { logger } from '@/utils/logger';

/**
 * SQLite Local Storage Layer abstraction for offline route caching and ride tracking breadcrumbs.
 */
class LocalDatabase {
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      logger.info('Initializing local offline SQLite database tables');
      this.isInitialized = true;
    } catch (err) {
      logger.error('Failed to init local database', err);
    }
  }

  async saveOfflineRide(ride: Partial<Ride>): Promise<void> {
    try {
      const offlineRides = (await asyncStorage.getJson<any[]>('OFFLINE_SAVED_RIDES')) || [];
      offlineRides.push({ ...ride, offlineSavedAt: Date.now() });
      await asyncStorage.setJson('OFFLINE_SAVED_RIDES', offlineRides);
      logger.info('Ride saved to offline cache', ride.id);
    } catch (err) {
      logger.error('Error saving offline ride', err);
    }
  }

  async getOfflineRides(): Promise<any[]> {
    return (await asyncStorage.getJson<any[]>('OFFLINE_SAVED_RIDES')) || [];
  }

  async clearOfflineRides(): Promise<void> {
    await asyncStorage.remove('OFFLINE_SAVED_RIDES');
  }

  async cacheRouteOffline(route: Route): Promise<void> {
    try {
      const cached = (await asyncStorage.getJson<Record<string, Route>>('OFFLINE_CACHED_ROUTES')) || {};
      cached[route.id] = route;
      await asyncStorage.setJson('OFFLINE_CACHED_ROUTES', cached);
      logger.info('Route cached offline', route.id);
    } catch (err) {
      logger.error('Failed to cache route offline', err);
    }
  }

  async getCachedRoutes(): Promise<Route[]> {
    const cached = (await asyncStorage.getJson<Record<string, Route>>('OFFLINE_CACHED_ROUTES')) || {};
    return Object.values(cached);
  }
}

export const localDb = new LocalDatabase();
