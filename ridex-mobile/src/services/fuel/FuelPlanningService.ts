/**
 * RIDEX — Fuel Planning & Trip Consumption Engine
 * Dynamically calculates fuel required, estimated cost, safe tank range,
 * and refuel warnings strictly from actual route distance and motorcycle telemetry.
 */

export interface FuelPlanSummary {
  distanceKm: number;
  fuelPricePerLiter: number;
  averageMileageKmpl: number;
  tankCapacityLiters: number;
  maxTankRangeKm: number;
  fullRangeKm: number;
  remainingRangeKm: number;
  requiredFuelLiters: number;
  estimatedCostInr: number;
  refuelStopsNeeded: number;
  safeSingleTank: boolean;
  exceedsSingleTank: boolean;
  suggestedStopIntervalKm: number;
}

export class FuelPlanningService {
  private static instance: FuelPlanningService | null = null;
  public static readonly DEFAULT_FUEL_PRICE_INR = 104.5; // Average petrol price in INR

  public static getInstance(): FuelPlanningService {
    if (!FuelPlanningService.instance) {
      FuelPlanningService.instance = new FuelPlanningService();
    }
    return FuelPlanningService.instance;
  }

  /**
   * Calculates dynamic fuel telemetry based on exact route distance and motorcycle configuration.
   * Formula:
   *   fuelRequiredLiters = distanceKm / mileageKmPerLiter
   *   fuelCost = fuelRequiredLiters * fuelPricePerLiter
   *   fullRangeKm = tankCapacityLiters * mileageKmPerLiter
   *   remainingRangeKm = fullRangeKm - distanceKm
   */
  public calculateFuelPlan(params: {
    distanceKm: number;
    tankCapacityLiters?: number;
    averageMileageKmpl?: number;
    fuelPricePerLiter?: number;
  }): FuelPlanSummary {
    const distanceKm = Math.max(1, Math.round(params.distanceKm || 50));
    const tankCapacityLiters = params.tankCapacityLiters && params.tankCapacityLiters > 0 ? params.tankCapacityLiters : 15;
    const averageMileageKmpl = params.averageMileageKmpl && params.averageMileageKmpl > 0 ? params.averageMileageKmpl : 28;
    const fuelPricePerLiter = params.fuelPricePerLiter || FuelPlanningService.DEFAULT_FUEL_PRICE_INR;

    const fullRangeKm = Math.round(tankCapacityLiters * averageMileageKmpl);
    const requiredFuelLiters = Number((distanceKm / averageMileageKmpl).toFixed(2));
    const estimatedCostInr = Math.round(requiredFuelLiters * fuelPricePerLiter);

    // Safe tank reserve threshold: up to 85% of full tank capacity is single-tank safe
    const safeTankThresholdKm = Math.round(fullRangeKm * 0.85);
    const exceedsSingleTank = distanceKm > safeTankThresholdKm;
    const safeSingleTank = !exceedsSingleTank;
    const remainingRangeKm = Math.max(0, fullRangeKm - distanceKm);

    const refuelStopsNeeded = exceedsSingleTank
      ? Math.max(1, Math.ceil((distanceKm - safeTankThresholdKm) / safeTankThresholdKm))
      : 0;

    return {
      distanceKm,
      fuelPricePerLiter,
      averageMileageKmpl,
      tankCapacityLiters,
      maxTankRangeKm: fullRangeKm,
      fullRangeKm,
      remainingRangeKm,
      requiredFuelLiters,
      estimatedCostInr,
      refuelStopsNeeded,
      safeSingleTank,
      exceedsSingleTank,
      suggestedStopIntervalKm: Math.round(fullRangeKm * 0.75),
    };
  }
}

export const fuelPlanningService = FuelPlanningService.getInstance();
