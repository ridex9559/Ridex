import { RideLocationPoint, RideStatistics, LocationError } from './locationTypes';
import { LocationFilter, locationFilter } from './LocationFilter';
import { DistanceCalculator } from './DistanceCalculator';
import { SpeedCalculator } from './SpeedCalculator';
import { RideStatisticsService } from '../rides/RideStatisticsService';
import { locationService } from './LocationService';
import { localRideLocationRepository } from '../database/repositories/LocalRideLocationRepository';
import { localRideRepository } from '../database/repositories/LocalRideRepository';
import { LocalRideLocation } from '../database/databaseTypes';
import { DEFAULT_RIDE_TRACKING_CONFIG, RideTrackingConfig } from '@/config/rideTracking';
import { useRideTrackingStore } from '@/store/rideTrackingStore';
import { mpsToKmh, metersToKm } from '@/utils/geo';
import { logger } from '@/utils/logger';

export type TrackingTelemetryCallback = (statistics: RideStatistics, point: RideLocationPoint) => void;

export class RideTrackingEngine {
  private static instance: RideTrackingEngine | null = null;

  private activeRideId: string | null = null;
  private isEngineActive: boolean = false;
  private isPaused: boolean = false;

  private distanceCalc: DistanceCalculator;
  private speedCalc: SpeedCalculator;
  private statisticsService: RideStatisticsService;
  private filter: LocationFilter;
  private config: RideTrackingConfig;

  // Previous valid baseline GPS point
  private previousPoint: RideLocationPoint | null = null;

  // In-memory buffer for high-performance batch SQLite persistence
  private locationBuffer: LocalRideLocation[] = [];
  private lastBufferFlushTimeMs: number = Date.now();
  private flushTimer: any = null;
  private telemetryUnsubscribe: (() => void) | null = null;
  private errorUnsubscribe: (() => void) | null = null;

  private constructor(config: RideTrackingConfig = DEFAULT_RIDE_TRACKING_CONFIG) {
    this.config = config;
    this.filter = locationFilter;
    this.distanceCalc = new DistanceCalculator();
    this.speedCalc = new SpeedCalculator();
    this.statisticsService = new RideStatisticsService(this.distanceCalc, this.speedCalc);
  }

  public static getInstance(): RideTrackingEngine {
    if (!RideTrackingEngine.instance) {
      RideTrackingEngine.instance = new RideTrackingEngine();
    }
    return RideTrackingEngine.instance;
  }

  public getActiveRideId(): string | null {
    return this.activeRideId;
  }

  public isTracking(): boolean {
    return this.isEngineActive && !this.isPaused;
  }

  /**
   * Initializes the engine for a newly launched or recovered ride.
   */
  public async start(rideId: string, initialStartTimeMs: number = Date.now()): Promise<boolean> {
    logger.info(`[RideTrackingEngine] Starting GPS engine for ride ${rideId}...`);

    this.activeRideId = rideId;
    this.isEngineActive = true;
    this.isPaused = false;
    this.previousPoint = null;
    this.locationBuffer = [];
    this.lastBufferFlushTimeMs = Date.now();

    this.distanceCalc.reset();
    this.speedCalc.reset();
    this.statisticsService.start(initialStartTimeMs);

    // Update Zustand HUD state
    useRideTrackingStore.getState().setTrackingState({
      activeRideId: rideId,
      status: 'ACTIVE',
      isTracking: true,
      isPaused: false,
      startTimeMs: initialStartTimeMs,
      distanceMeters: 0,
      distanceKm: 0,
      currentSpeedKmh: 0,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      durationSeconds: 0,
      elevationGainMeters: 0,
      error: null,
    });

    // Subscribe to raw hardware location stream
    this.telemetryUnsubscribe = locationService.onLocation((point) => {
      this.handleIncomingPoint(point);
    });

    this.errorUnsubscribe = locationService.onError((error: LocationError) => {
      logger.error('[RideTrackingEngine] Location hardware error:', error);
      useRideTrackingStore.getState().setError(error.message);
    });

    // Start periodic buffer flush loop
    this.flushTimer = setInterval(() => {
      this.flushLocationBuffer().catch((err) =>
        logger.error('[RideTrackingEngine] Periodic flush error:', err)
      );
    }, this.config.bufferFlushIntervalMs);

    // Start hardware GPS tracking
    const trackingStarted = await locationService.startTracking(rideId);
    if (!trackingStarted) {
      logger.error('[RideTrackingEngine] Failed to start location hardware stream.');
      await this.stop();
      return false;
    }

    return true;
  }

  /**
   * Pauses GPS accumulation and flushes current buffer.
   */
  public async pause(): Promise<void> {
    if (!this.isEngineActive || this.isPaused) return;

    logger.info('[RideTrackingEngine] Pausing ride tracking engine...');
    this.isPaused = true;
    this.statisticsService.pause();

    // Reset previous baseline so resuming does not connect across the pause gap
    this.previousPoint = null;

    useRideTrackingStore.getState().setPaused(true);

    // Flush any pending GPS points
    await this.flushLocationBuffer();
  }

  /**
   * Resumes GPS tracking and establishes a fresh baseline.
   */
  public async resume(): Promise<void> {
    if (!this.isEngineActive || !this.isPaused) return;

    logger.info('[RideTrackingEngine] Resuming ride tracking engine...');
    this.isPaused = false;
    this.statisticsService.resume();

    // Critical: Establishing a new baseline to prevent distance jump
    this.previousPoint = null;

    useRideTrackingStore.getState().setPaused(false);
  }

  /**
   * Stops tracking engine, flushes all remaining buffers, and cleans up resources.
   */
  public async stop(): Promise<RideStatistics> {
    logger.info('[RideTrackingEngine] Stopping ride tracking engine...');

    this.isEngineActive = false;
    this.isPaused = false;

    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Unsubscribe from hardware stream
    if (this.telemetryUnsubscribe) {
      this.telemetryUnsubscribe();
      this.telemetryUnsubscribe = null;
    }

    if (this.errorUnsubscribe) {
      this.errorUnsubscribe();
      this.errorUnsubscribe = null;
    }

    // Stop hardware GPS
    await locationService.stopTracking();

    // Final buffer flush
    await this.flushLocationBuffer();

    const finalStats = this.statisticsService.getSnapshot();

    useRideTrackingStore.getState().setTrackingState({
      isTracking: false,
      isPaused: false,
      status: 'COMPLETED',
      currentSpeedKmh: 0,
      durationSeconds: finalStats.totalDurationSeconds,
      distanceKm: metersToKm(finalStats.totalDistanceMeters),
      distanceMeters: finalStats.totalDistanceMeters,
      avgSpeedKmh: mpsToKmh(finalStats.averageSpeedMps),
      maxSpeedKmh: mpsToKmh(finalStats.maxSpeedMps),
      elevationGainMeters: finalStats.elevationGainMeters,
    });

    const completedRideId = this.activeRideId;
    this.activeRideId = null;
    this.previousPoint = null;

    logger.info(`[RideTrackingEngine] Ride ${completedRideId} finalized: ${finalStats.totalDistanceMeters.toFixed(0)}m in ${finalStats.totalDurationSeconds}s.`);
    return finalStats;
  }

  /**
   * Processes each raw incoming location point through the multi-stage filter.
   */
  private handleIncomingPoint(point: RideLocationPoint) {
    if (!this.isEngineActive || this.isPaused || !this.activeRideId) {
      return;
    }

    // 1. Run through multi-stage filter pipeline
    const validation = this.filter.filterPoint(point, this.previousPoint);
    if (!validation.isValid) {
      logger.info(`[RideTrackingEngine] Point filtered: ${validation.reason}`);
      return;
    }

    // 2. Accumulate validated distance
    if (validation.distanceFromPrevMeters && validation.distanceFromPrevMeters > 0) {
      this.distanceCalc.addDistance(validation.distanceFromPrevMeters);
    }

    // 3. Update velocity
    const speedResult = this.speedCalc.updateSpeed(
      point.speed,
      validation.calculatedSpeedMps || 0
    );

    // 4. Update statistics
    this.statisticsService.processPoint(
      point.altitude,
      speedResult.currentSpeedMps,
      point.timestamp
    );

    // Set as new valid baseline
    this.previousPoint = point;

    // 5. Buffer point for high-performance SQLite batch persistence
    const localLocation: LocalRideLocation = {
      id: point.id,
      ride_id: this.activeRideId,
      latitude: point.latitude,
      longitude: point.longitude,
      altitude: point.altitude,
      speed: point.speed,
      accuracy: point.accuracy,
      heading: point.heading,
      recorded_at: point.recordedAt,
      created_at: new Date().toISOString(),
      sync_status: 'LOCAL',
    };

    this.locationBuffer.push(localLocation);

    // Flush buffer if batch size reached
    if (this.locationBuffer.length >= this.config.bufferBatchSize) {
      this.flushLocationBuffer().catch((err) =>
        logger.error('[RideTrackingEngine] Batch size flush error:', err)
      );
    }

    // 6. Update Live Zustand HUD state
    const stats = this.statisticsService.getSnapshot();
    useRideTrackingStore.getState().updateLiveMetrics({
      currentLocation: point,
      currentSpeedKmh: speedResult.currentSpeedKmh,
      maxSpeedKmh: speedResult.maxSpeedKmh,
      distanceMeters: stats.totalDistanceMeters,
      distanceKm: metersToKm(stats.totalDistanceMeters),
      durationSeconds: stats.totalDurationSeconds,
      avgSpeedKmh: mpsToKmh(stats.averageSpeedMps),
      elevationGainMeters: stats.elevationGainMeters,
    });
  }

  /**
   * Flushes in-memory location buffer into local SQLite tables within an atomic transaction.
   */
  public async flushLocationBuffer(): Promise<void> {
    if (this.locationBuffer.length === 0 || !this.activeRideId) {
      return;
    }

    const pointsToPersist = [...this.locationBuffer];
    this.locationBuffer = [];
    this.lastBufferFlushTimeMs = Date.now();

    try {
      // 1. Batch insert GPS breadcrumbs to SQLite
      await localRideLocationRepository.saveBatchLocations(pointsToPersist);

      // 2. Incrementally update active ride statistics in SQLite (protecting against sudden crash)
      const stats = this.statisticsService.getSnapshot();
      const existingRide = await localRideRepository.getRideById(this.activeRideId, '');
      if (existingRide) {
        await localRideRepository.saveRide({
          ...existingRide,
          distance_meters: stats.totalDistanceMeters,
          duration_seconds: stats.totalDurationSeconds,
          average_speed: mpsToKmh(stats.averageSpeedMps),
          max_speed: mpsToKmh(stats.maxSpeedMps),
          elevation_gain: stats.elevationGainMeters,
          max_lean_angle: stats.maxLeanAngleDegrees || null,
          end_latitude: pointsToPersist[pointsToPersist.length - 1].latitude,
          end_longitude: pointsToPersist[pointsToPersist.length - 1].longitude,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('[RideTrackingEngine] Failed to flush location buffer to SQLite:', error);
      // Re-insert unpersisted points back to buffer to prevent data loss
      this.locationBuffer = [...pointsToPersist, ...this.locationBuffer];
    }
  }

  public getStatistics(): RideStatistics {
    return this.statisticsService.getSnapshot();
  }
}

export const rideTrackingEngine = RideTrackingEngine.getInstance();
