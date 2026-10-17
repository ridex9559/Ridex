/**
 * RIDEX V2 — Motorcycle and Garage Domain Models
 */

export type MotorcycleCategory =
  | 'ADVENTURE'
  | 'SPORT'
  | 'NAKED'
  | 'TOURING'
  | 'CRUISER'
  | 'SUPERMOTO'
  | 'CAFE_RACER'
  | 'COMMUTER';

export interface MaintenanceItem {
  id: string;
  name: string;
  intervalKm: number;
  lastServicedKm: number;
  dueInKm: number;
  status: 'GOOD' | 'DUE_SOON' | 'OVERDUE';
}

export interface MotorcycleMaintenance {
  engineOil?: MaintenanceItem;
  chainLube?: MaintenanceItem;
  chainReplacement?: MaintenanceItem;
  brakePads?: MaintenanceItem;
  airFilter?: MaintenanceItem;
  tyres?: MaintenanceItem;
  battery?: MaintenanceItem;
  generalService?: MaintenanceItem;
}

export interface Motorcycle {
  id: string;
  userId?: string;
  brand?: string;
  make?: string;
  manufacturer?: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  displacementCc?: number;
  mileageKm?: number;
  odometer?: number;
  odometerKm?: number;
  registrationNumber?: string;
  horsepower?: number;
  fuelTankCapacityLiters?: number;
  averageMileageKmpl?: number;
  engineHealth?: string | number;
  serviceDueDays?: number;
  tpmsFrontPsi?: number;
  tpmsRearPsi?: number;
  insuranceStatus?: string;
  insuranceExpiryDate?: string;
  pucExpiryDate?: string;
  maintenance?: MotorcycleMaintenance;
  category?: MotorcycleCategory;
  nickname?: string;
  imageUrl?: string;
  image?: string;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Bike = Motorcycle;

export interface CreateMotorcycleDto {
  brand: string;
  make?: string;
  manufacturer?: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  displacementCc?: number;
  mileageKm?: number;
  odometer?: number;
  odometerKm?: number;
  registrationNumber?: string;
  fuelTankCapacityLiters?: number;
  averageMileageKmpl?: number;
  insuranceExpiryDate?: string;
  pucExpiryDate?: string;
  horsepower?: number;
  category?: MotorcycleCategory;
  nickname?: string;
  imageUrl?: string;
  image?: string;
  isPrimary?: boolean;
}
