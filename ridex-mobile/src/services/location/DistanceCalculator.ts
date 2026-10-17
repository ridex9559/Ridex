import { metersToKm } from '@/utils/geo';

/**
 * Pure distance accumulator for active rides.
 * Stores internal distance strictly in METERS.
 */
export class DistanceCalculator {
  private totalDistanceMeters: number = 0;

  constructor(initialDistanceMeters: number = 0) {
    this.totalDistanceMeters = Math.max(0, initialDistanceMeters);
  }

  /**
   * Adds validated incremental distance in meters.
   */
  public addDistance(distanceMeters: number): number {
    if (isNaN(distanceMeters) || distanceMeters <= 0) {
      return this.totalDistanceMeters;
    }
    this.totalDistanceMeters += distanceMeters;
    return this.totalDistanceMeters;
  }

  /**
   * Returns total accumulated distance in METERS.
   */
  public getDistanceMeters(): number {
    return this.totalDistanceMeters;
  }

  /**
   * Returns total accumulated distance in KILOMETERS (rounded float).
   */
  public getDistanceKm(): number {
    return metersToKm(this.totalDistanceMeters);
  }

  /**
   * Resets distance accumulator.
   */
  public reset(initialMeters: number = 0): void {
    this.totalDistanceMeters = Math.max(0, initialMeters);
  }
}
