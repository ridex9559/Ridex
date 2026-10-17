import { RideStatistics } from '../location/locationTypes';
import { DistanceCalculator } from '../location/DistanceCalculator';
import { SpeedCalculator } from '../location/SpeedCalculator';

export class RideStatisticsService {
  private startTimeMs: number | null = null;
  private pauseTimeMs: number | null = null;
  private totalPausedDurationMs: number = 0;
  private movingDurationMs: number = 0;
  private lastActiveTimestampMs: number | null = null;

  private distanceCalc: DistanceCalculator;
  private speedCalc: SpeedCalculator;
  private elevationGainMeters: number = 0;
  private lastAltitudeMeters: number | null = null;
  private maxLeanAngleDegrees: number = 0;

  constructor(distanceCalc: DistanceCalculator, speedCalc: SpeedCalculator) {
    this.distanceCalc = distanceCalc;
    this.speedCalc = speedCalc;
  }

  public start(startTimeMs: number = Date.now()) {
    this.startTimeMs = startTimeMs;
    this.pauseTimeMs = null;
    this.totalPausedDurationMs = 0;
    this.movingDurationMs = 0;
    this.lastActiveTimestampMs = startTimeMs;
    this.elevationGainMeters = 0;
    this.lastAltitudeMeters = null;
    this.maxLeanAngleDegrees = 0;
  }

  public pause(pauseTimeMs: number = Date.now()) {
    if (!this.pauseTimeMs) {
      this.pauseTimeMs = pauseTimeMs;
    }
  }

  public resume(resumeTimeMs: number = Date.now()) {
    if (this.pauseTimeMs) {
      this.totalPausedDurationMs += Math.max(0, resumeTimeMs - this.pauseTimeMs);
      this.pauseTimeMs = null;
    }
    this.lastActiveTimestampMs = resumeTimeMs;
  }

  /**
   * Updates telemetry on each incoming valid coordinate point.
   */
  public processPoint(
    altitudeMeters: number | null,
    speedMps: number,
    pointTimestampMs: number
  ) {
    // 1. Moving duration accumulation
    if (this.lastActiveTimestampMs && !this.pauseTimeMs) {
      const deltaMs = Math.max(0, pointTimestampMs - this.lastActiveTimestampMs);
      if (speedMps > 0.5) {
        this.movingDurationMs += deltaMs;
      }
    }
    this.lastActiveTimestampMs = pointTimestampMs;

    // 2. Elevation gain calculation
    if (altitudeMeters !== null && !isNaN(altitudeMeters)) {
      if (this.lastAltitudeMeters !== null) {
        const altDelta = altitudeMeters - this.lastAltitudeMeters;
        // Accumulate positive ascents greater than 1 meter to filter vertical sensor jitter
        if (altDelta > 1.0) {
          this.elevationGainMeters += altDelta;
        }
      }
      this.lastAltitudeMeters = altitudeMeters;
    }
  }

  public updateLeanAngle(leanAngleDegrees: number) {
    const absAngle = Math.abs(leanAngleDegrees);
    if (absAngle > this.maxLeanAngleDegrees) {
      this.maxLeanAngleDegrees = Math.round(absAngle);
    }
  }

  /**
   * Computes complete live snapshot of ride statistics.
   */
  public getSnapshot(currentTimeMs: number = Date.now()): RideStatistics {
    if (!this.startTimeMs) {
      return {
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        movingDurationSeconds: 0,
        pausedDurationSeconds: 0,
        currentSpeedMps: 0,
        averageSpeedMps: 0,
        maxSpeedMps: 0,
        elevationGainMeters: 0,
        maxLeanAngleDegrees: 0,
      };
    }

    const currentPauseDelta = this.pauseTimeMs
      ? Math.max(0, currentTimeMs - this.pauseTimeMs)
      : 0;
    const totalPausedMs = this.totalPausedDurationMs + currentPauseDelta;
    const totalDurationMs = Math.max(0, currentTimeMs - this.startTimeMs - totalPausedMs);
    const totalDurationSeconds = Math.floor(totalDurationMs / 1000);
    const movingDurationSeconds = Math.max(1, Math.floor(this.movingDurationMs / 1000));
    const pausedDurationSeconds = Math.floor(totalPausedMs / 1000);

    const totalDistanceMeters = this.distanceCalc.getDistanceMeters();
    const currentSpeedMps = this.speedCalc.getCurrentSpeedMps();
    const maxSpeedMps = this.speedCalc.getMaxSpeedMps();

    // Average speed = total distance / moving time
    const averageSpeedMps =
      movingDurationSeconds > 0
        ? totalDistanceMeters / movingDurationSeconds
        : 0;

    return {
      totalDistanceMeters,
      totalDurationSeconds,
      movingDurationSeconds,
      pausedDurationSeconds,
      currentSpeedMps,
      averageSpeedMps,
      maxSpeedMps,
      elevationGainMeters: Math.round(this.elevationGainMeters),
      maxLeanAngleDegrees: this.maxLeanAngleDegrees,
    };
  }

  public restore(
    startTimeMs: number,
    totalPausedDurationMs: number,
    elevationGainMeters: number,
    maxLeanAngleDegrees: number
  ) {
    this.startTimeMs = startTimeMs;
    this.totalPausedDurationMs = totalPausedDurationMs;
    this.elevationGainMeters = elevationGainMeters;
    this.maxLeanAngleDegrees = maxLeanAngleDegrees;
    this.lastActiveTimestampMs = Date.now();
  }
}
