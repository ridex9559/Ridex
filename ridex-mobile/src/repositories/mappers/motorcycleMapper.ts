import { Database } from '../../services/supabase/types';
import { Motorcycle, CreateMotorcycleDto, MotorcycleCategory } from '../../types';

type MotorcycleRow = Database['public']['Tables']['motorcycles']['Row'];
type MotorcycleInsert = Database['public']['Tables']['motorcycles']['Insert'];
type MotorcycleUpdate = Database['public']['Tables']['motorcycles']['Update'];

export class MotorcycleMapper {
  static toDomain(row: MotorcycleRow): Motorcycle {
    return {
      id: row.id,
      userId: row.user_id,
      make: row.manufacturer,
      manufacturer: row.manufacturer,
      model: row.model,
      year: row.year,
      displacementCc: row.displacement_cc,
      mileageKm: Number(row.odometer_km) || 0,
      odometer: Number(row.odometer_km) || 0,
      registrationNumber: row.registration_number ?? undefined,
      horsepower: row.horsepower ?? undefined,
      category: row.category as MotorcycleCategory,
      nickname: row.nickname ?? undefined,
      imageUrl: row.image_url ?? undefined,
      image: row.image_url ?? undefined,
      isPrimary: row.is_primary,
      engineHealth: 'Optimal',
      serviceDueDays: 60,
      tpmsFrontPsi: 34.0,
      tpmsRearPsi: 40.0,
      insuranceStatus: 'Active',
      createdAt: row.created_at,
    };
  }

  static toInsert(userId: string, dto: CreateMotorcycleDto): MotorcycleInsert {
    return {
      user_id: userId,
      manufacturer: dto.make || dto.manufacturer || 'Motorcycle',
      model: dto.model,
      year: dto.year,
      displacement_cc: dto.displacementCc,
      odometer_km: dto.mileageKm || dto.odometer || 0,
      category: dto.category,
      nickname: dto.nickname || null,
      horsepower: dto.horsepower || null,
      is_primary: dto.isPrimary ?? false,
      image_url: dto.imageUrl || dto.image || null,
      registration_number: dto.registrationNumber || null,
    };
  }

  static toUpdate(data: Partial<Motorcycle>): MotorcycleUpdate {
    const update: MotorcycleUpdate = {};
    if (data.make !== undefined || data.manufacturer !== undefined) {
      update.manufacturer = data.make || data.manufacturer;
    }
    if (data.model !== undefined) update.model = data.model;
    if (data.year !== undefined) update.year = data.year;
    if (data.displacementCc !== undefined) update.displacement_cc = data.displacementCc;
    if (data.mileageKm !== undefined || data.odometer !== undefined) {
      update.odometer_km = data.mileageKm !== undefined ? data.mileageKm : data.odometer;
    }
    if (data.category !== undefined) update.category = data.category;
    if (data.nickname !== undefined) update.nickname = data.nickname ?? null;
    if (data.horsepower !== undefined) update.horsepower = data.horsepower ?? null;
    if (data.isPrimary !== undefined) update.is_primary = data.isPrimary;
    if (data.imageUrl !== undefined || data.image !== undefined) {
      update.image_url = data.imageUrl ?? data.image ?? null;
    }
    if (data.registrationNumber !== undefined) update.registration_number = data.registrationNumber ?? null;
    return update;
  }
}
