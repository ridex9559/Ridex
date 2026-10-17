import { mpsToKmh } from '@/utils/geo';

export class SpeedCalculator {
  private currentSpeedMps: number = 0;
  private maxSpeedMps: number = 0;
  private readonly maxReasonableSpeedMps: number;

  constructor(maxReasonableSpeedMps: number = 85) {
    this.maxReasonableSpeedMps = maxReasonableSpeedMps;
  }

  /**
   * Processes current speed from either GPS hardware sensor or derived delta.
   *
   * @param rawGpsSpeedMps Speed reported by GPS chipset in m/s (or null)
   * @param derivedSpeedMps Speed calculated from distance/time delta in m/s
   */
  public updateSpeed(
    rawGpsSpeedMps: number | null,
    derivedSpeedMps: number
  ): { currentSpeedMps: number; currentSpeedKmh: number; maxSpeedKmh: number } {
    let effectiveSpeed = 0;

    // Use GPS hardware speed if valid and non-negative
    if (
      rawGpsSpeedMps !== null &&
      !isNaN(rawGpsSpeedMps) &&
      rawGpsSpeedMps >= 0 &&
      rawGpsSpeedMps <= this.maxReasonableSpeedMps
    ) {
      effectiveSpeed = rawGpsSpeedMps;
    } else if (
      !isNaN(derivedSpeedMps) &&
      derivedSpeedMps >= 0 &&
      derivedSpeedMps <= this.maxReasonableSpeedMps
    ) {
      effectiveSpeed = derivedSpeedMps;
    }

    this.currentSpeedMps = effectiveSpeed;

    if (effectiveSpeed > this.maxSpeedMps) {
      this.maxSpeedMps = effectiveSpeed;
    }

    return {
      currentSpeedMps: this.currentSpeedMps,
      currentSpeedKmh: mpsToKmh(this.currentSpeedMps),
      maxSpeedKmh: mpsToKmh(this.maxSpeedMps),
    };
  }

  public getCurrentSpeedMps(): number {
    return this.currentSpeedMps;
  }

  public getCurrentSpeedKmh(): number {
    return mpsToKmh(this.currentSpeedMps);
  }

  public getMaxSpeedMps(): number {
    return this.maxSpeedMps;
  }

  public getMaxSpeedKmh(): number {
    return mpsToKmh(this.maxSpeedMps);
  }

  public reset(initialMaxSpeedMps: number = 0): void {
    this.currentSpeedMps = 0;
    this.maxSpeedMps = Math.max(0, initialMaxSpeedMps);
  }
}
