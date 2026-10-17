import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { RideLocationPoint, LocationError } from './locationTypes';
import { LocationConfig, DEFAULT_LOCATION_CONFIG } from '@/config/location';
import { locationPermissionService } from './LocationPermissionService';
import { generateUUID } from '@/utils/uuid';
import { logger } from '@/utils/logger';

export type RawLocationListener = (location: RideLocationPoint) => void;
export type LocationErrorListener = (error: LocationError) => void;

export class LocationService {
  private static instance: LocationService | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private webIntervalTimer: any = null;
  private isTracking = false;
  private currentRideId: string | null = null;
  private lastKnownLocation: RideLocationPoint | null = null;

  // Listeners
  private locationListeners: Set<RawLocationListener> = new Set();
  private errorListeners: Set<LocationErrorListener> = new Set();

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  public getLastKnownLocation(): RideLocationPoint | null {
    return this.lastKnownLocation;
  }

  private webWatchId: number | null = null;

  /**
   * Fetches single current location snapshot.
   */
  async getCurrentPosition(): Promise<RideLocationPoint | null> {
    try {
      if (Platform.OS === 'web') {
        const defaultFallback: RideLocationPoint = {
          id: generateUUID(),
          rideId: this.currentRideId || 'single-snapshot',
          latitude: 18.5204,
          longitude: 73.8567,
          altitude: 560,
          speed: 0,
          accuracy: 10.0,
          heading: 0,
          recordedAt: new Date().toISOString(),
          timestamp: Date.now(),
        };

        if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const point: RideLocationPoint = {
                  id: generateUUID(),
                  rideId: this.currentRideId || 'single-snapshot',
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  altitude: pos.coords.altitude || 500,
                  speed: pos.coords.speed !== null && pos.coords.speed >= 0 ? pos.coords.speed : 0,
                  accuracy: pos.coords.accuracy || 5.0,
                  heading: pos.coords.heading || 0,
                  recordedAt: new Date(pos.timestamp).toISOString(),
                  timestamp: pos.timestamp || Date.now(),
                };
                this.lastKnownLocation = point;
                logger.info(`[LocationService] Real Web GPS position obtained: ${point.latitude}, ${point.longitude}`);
                resolve(point);
              },
              (err) => {
                logger.warn('[LocationService] Web GPS error (HTTP IP or blocked), using Pune fallback coordinate:', err);
                this.lastKnownLocation = this.lastKnownLocation || defaultFallback;
                resolve(this.lastKnownLocation);
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
            );
          });
        }
        this.lastKnownLocation = this.lastKnownLocation || defaultFallback;
        return this.lastKnownLocation;
      }

      const servicesEnabled = await locationPermissionService.isLocationServicesEnabled();
      if (!servicesEnabled) {
        this.emitError({
          code: 'SERVICES_DISABLED',
          message: 'Location services are disabled on device.',
          recoverable: true,
          timestamp: Date.now(),
        });
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const point: RideLocationPoint = {
        id: generateUUID(),
        rideId: this.currentRideId || 'single-snapshot',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        speed: loc.coords.speed !== null && loc.coords.speed >= 0 ? loc.coords.speed : 0,
        accuracy: loc.coords.accuracy,
        heading: loc.coords.heading,
        recordedAt: new Date(loc.timestamp).toISOString(),
        timestamp: loc.timestamp,
      };

      this.lastKnownLocation = point;
      return point;
    } catch (error: any) {
      logger.error('[LocationService] getCurrentPosition error:', error);
      this.emitError({
        code: 'TRACKING_FAILED',
        message: error.message || 'Failed to get current GPS position',
        recoverable: true,
        timestamp: Date.now(),
        originalError: error,
      });
      return null;
    }
  }

  /**
   * Starts high-precision continuous location updates for a designated ride.
   * Enforces single active subscription protection.
   */
  async startTracking(
    rideId: string,
    config: LocationConfig = DEFAULT_LOCATION_CONFIG
  ): Promise<boolean> {
    if (this.isTracking) {
      logger.warn('[LocationService] Already tracking. Stopping previous subscription first.');
      await this.stopTracking();
    }

    this.currentRideId = rideId;
    this.isTracking = true;

    // 1. Verify Permissions
    const permission = await locationPermissionService.checkForegroundPermission();
    if (permission !== 'GRANTED') {
      const requested = await locationPermissionService.requestForegroundPermission();
      if (!requested.granted) {
        this.emitError({
          code: requested.status === 'BLOCKED' ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED',
          message: 'Location permission is required for ride tracking.',
          recoverable: false,
          timestamp: Date.now(),
        });
        this.isTracking = false;
        return false;
      }
    }

    // 2. Verify GPS Services Switch
    const servicesEnabled = await locationPermissionService.isLocationServicesEnabled();
    if (!servicesEnabled) {
      this.emitError({
        code: 'SERVICES_DISABLED',
        message: 'Location services (GPS) are turned off on your device.',
        recoverable: true,
        timestamp: Date.now(),
      });
      this.isTracking = false;
      return false;
    }

    logger.info(`[LocationService] Starting hardware GPS stream for ride ${rideId}...`);

    // Web Platform GPS Stream (Real browser watchPosition)
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        logger.info('[LocationService] Using real browser navigator.geolocation.watchPosition...');
        this.webWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!this.isTracking) return;

            const point: RideLocationPoint = {
              id: generateUUID(),
              rideId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude || 500,
              speed: pos.coords.speed !== null && pos.coords.speed >= 0 ? pos.coords.speed : 0,
              accuracy: pos.coords.accuracy || 5,
              heading: pos.coords.heading || 0,
              recordedAt: new Date(pos.timestamp).toISOString(),
              timestamp: pos.timestamp || Date.now(),
            };

            this.lastKnownLocation = point;
            this.emitLocation(point);
          },
          (err) => {
            logger.warn('[LocationService] Web watchPosition warning, falling back to simulator:', err);
            if (!this.webIntervalTimer) {
              this.startWebSimulator(rideId, config);
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000,
          }
        );
        return true;
      } else {
        this.startWebSimulator(rideId, config);
        return true;
      }
    }

    // Native Platform expo-location
    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: config.timeIntervalMs,
          distanceInterval: config.distanceIntervalMeters,
        },
        (location) => {
          if (!this.isTracking) return;

          const point: RideLocationPoint = {
            id: generateUUID(),
            rideId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            speed: location.coords.speed !== null && location.coords.speed >= 0 ? location.coords.speed : 0,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading,
            recordedAt: new Date(location.timestamp).toISOString(),
            timestamp: location.timestamp,
          };

          this.lastKnownLocation = point;
          this.emitLocation(point);
        }
      );

      logger.info('[LocationService] Native GPS subscription established successfully.');
      return true;
    } catch (error: any) {
      logger.error('[LocationService] Failed to establish native watchPositionAsync:', error);
      this.emitError({
        code: 'TRACKING_FAILED',
        message: error.message || 'GPS hardware failure',
        recoverable: true,
        timestamp: Date.now(),
        originalError: error,
      });
      this.isTracking = false;
      return false;
    }
  }

  /**
   * Web platform simulation for web previews and desktop development testing.
   */
  private startWebSimulator(rideId: string, config: LocationConfig) {
    let lat = this.lastKnownLocation?.latitude || 18.5204;
    let lon = this.lastKnownLocation?.longitude || 73.8567;
    let speedMps = 18.5; // ~66 km/h
    let altitude = 580;

    this.webIntervalTimer = setInterval(() => {
      if (!this.isTracking) return;

      // Realistic motorcycle acceleration & turning delta
      speedMps = Math.min(42, Math.max(5, speedMps + (Math.random() * 2.5 - 1.2)));
      lat += 0.00015 + (Math.random() * 0.00004 - 0.00002);
      lon += 0.00012 + (Math.random() * 0.00004 - 0.00002);
      altitude += (Math.random() - 0.45) * 1.2;

      const point: RideLocationPoint = {
        id: generateUUID(),
        rideId,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lon.toFixed(6)),
        altitude: Number(altitude.toFixed(1)),
        speed: Number(speedMps.toFixed(2)),
        accuracy: 3.5,
        heading: 42,
        recordedAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      this.lastKnownLocation = point;
      this.emitLocation(point);
    }, config.timeIntervalMs);
  }

  /**
   * Stops continuous location tracking and cleans up native subscription listeners.
   */
  async stopTracking(): Promise<void> {
    this.isTracking = false;
    this.currentRideId = null;

    if (this.locationSubscription) {
      try {
        this.locationSubscription.remove();
        logger.info('[LocationService] Native location subscription removed.');
      } catch (err) {
        logger.warn('[LocationService] Subscription removal warning:', err);
      }
      this.locationSubscription = null;
    }

    if (this.webWatchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.webWatchId);
      this.webWatchId = null;
    }

    if (this.webIntervalTimer) {
      clearInterval(this.webIntervalTimer);
      this.webIntervalTimer = null;
    }

    logger.info('[LocationService] Location tracking stopped and resources cleared.');
  }

  // --- Subscriptions ---

  public onLocation(listener: RawLocationListener): () => void {
    this.locationListeners.add(listener);
    return () => {
      this.locationListeners.delete(listener);
    };
  }

  public onError(listener: LocationErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  private emitLocation(point: RideLocationPoint) {
    this.locationListeners.forEach((listener) => {
      try {
        listener(point);
      } catch (err) {
        logger.error('[LocationService] Location listener error:', err);
      }
    });
  }

  private emitError(error: LocationError) {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (err) {
        logger.error('[LocationService] Error listener error:', err);
      }
    });
  }
}

export const locationService = LocationService.getInstance();
