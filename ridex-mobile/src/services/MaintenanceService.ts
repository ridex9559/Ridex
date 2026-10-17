/**
 * RIDEX — Motorcycle Maintenance & Document Expiry Engine
 * Calculates service intervals, due mileage, and document expiry countdowns.
 */

import { MaintenanceItem, Motorcycle, MotorcycleMaintenance } from '../types/motorcycle';

export class MaintenanceService {
  private static instance: MaintenanceService | null = null;

  public static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }

  /**
   * Generates or updates maintenance status for a given motorcycle.
   */
  public evaluateMaintenance(bike: Motorcycle): MotorcycleMaintenance {
    const currentOdo = bike.odometerKm || bike.mileageKm || 4500;

    const createItem = (name: string, intervalKm: number, lastServicedKm?: number): MaintenanceItem => {
      const last = lastServicedKm ?? Math.floor(currentOdo / intervalKm) * intervalKm;
      const nextDue = last + intervalKm;
      const dueInKm = Math.max(0, nextDue - currentOdo);

      let status: 'GOOD' | 'DUE_SOON' | 'OVERDUE' = 'GOOD';
      if (dueInKm === 0) {
        status = 'OVERDUE';
      } else if (dueInKm <= intervalKm * 0.2) {
        status = 'DUE_SOON';
      }

      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        intervalKm,
        lastServicedKm: last,
        dueInKm,
        status,
      };
    };

    return {
      engineOil: createItem('Engine Oil & Filter', 3000),
      chainLube: createItem('Chain Clean & Lubrication', 500),
      chainReplacement: createItem('Drive Chain & Sprockets', 15000),
      brakePads: createItem('Brake Pads & Fluid', 5000),
      airFilter: createItem('Air Filter Cleaning', 4000),
      tyres: createItem('Tyre Tread Depth & PSI', 10000),
      battery: createItem('Battery Voltage & Health', 12000),
      generalService: createItem('Comprehensive General Service', 6000),
    };
  }

  /**
   * Computes days remaining until a document's expiry date.
   */
  public getDaysUntilExpiry(expiryDateStr?: string): { days: number; status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' } {
    if (!expiryDateStr) {
      return { days: 45, status: 'VALID' };
    }

    const expiry = new Date(expiryDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { days: 0, status: 'EXPIRED' };
    } else if (diffDays <= 15) {
      return { days: diffDays, status: 'EXPIRING_SOON' };
    }
    return { days: diffDays, status: 'VALID' };
  }
}

export const maintenanceService = MaintenanceService.getInstance();
