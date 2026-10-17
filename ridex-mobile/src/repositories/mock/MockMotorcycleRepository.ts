import { IMotorcycleRepository } from '../interfaces/IMotorcycleRepository';
import { Motorcycle, CreateMotorcycleDto } from '../../types';
import { mockMotorcycles } from '../../data/motorcycles';

export class MockMotorcycleRepository implements IMotorcycleRepository {
  private bikes: Motorcycle[] = [...mockMotorcycles];

  async getMotorcycles(userId: string): Promise<Motorcycle[]> {
    if (!userId) return [];
    // Demo account returns demo fleet; other users return only their own bikes
    return this.bikes.filter((b) => b.userId === userId || (!b.userId && userId === '00000000-0000-0000-0000-000000000001'));
  }

  async getMotorcycleById(id: string): Promise<Motorcycle | null> {
    return this.bikes.find((b) => b.id === id) || null;
  }

  async createMotorcycle(userId: string, data: CreateMotorcycleDto): Promise<Motorcycle> {
    const userBikes = this.bikes.filter((b) => b.userId === userId);
    const newBike: Motorcycle = {
      id: `bike-${Date.now()}`,
      userId,
      make: data.make || data.manufacturer || 'Motorcycle',
      manufacturer: data.make || data.manufacturer || 'Motorcycle',
      model: data.model,
      year: data.year,
      displacementCc: data.displacementCc,
      mileageKm: data.mileageKm || data.odometer || 0,
      odometer: data.mileageKm || data.odometer || 0,
      category: data.category,
      nickname: data.nickname,
      color: data.color,
      horsepower: data.horsepower,
      isPrimary: data.isPrimary ?? userBikes.length === 0,
      imageUrl: data.imageUrl || data.image,
      image: data.imageUrl || data.image,
      registrationNumber: data.registrationNumber,
      engineHealth: 'Optimal',
      serviceDueDays: 60,
      tpmsFrontPsi: 34.0,
      tpmsRearPsi: 40.0,
      insuranceStatus: 'Active',
      createdAt: new Date().toISOString(),
    };

    if (newBike.isPrimary) {
      this.bikes.filter((b) => b.userId === userId).forEach((b) => (b.isPrimary = false));
    }

    this.bikes.unshift(newBike);
    return newBike;
  }

  async updateMotorcycle(id: string, data: Partial<Motorcycle>): Promise<Motorcycle> {
    const idx = this.bikes.findIndex((b) => b.id === id);
    if (idx === -1) {
      throw new Error(`Motorcycle not found: ${id}`);
    }

    const currentBike = this.bikes[idx];
    if (data.isPrimary && currentBike.userId) {
      this.bikes.filter((b) => b.userId === currentBike.userId).forEach((b) => (b.isPrimary = false));
    }

    const updated = {
      ...this.bikes[idx],
      ...data,
      odometer: data.mileageKm !== undefined ? data.mileageKm : this.bikes[idx].odometer,
    };
    this.bikes[idx] = updated;
    return updated;
  }

  async deleteMotorcycle(id: string): Promise<void> {
    this.bikes = this.bikes.filter((b) => b.id !== id);
  }

  async setPrimaryMotorcycle(userId: string, id: string): Promise<void> {
    this.bikes.filter((b) => b.userId === userId).forEach((b) => {
      b.isPrimary = b.id === id;
    });
  }
}

export const mockMotorcycleRepository = new MockMotorcycleRepository();
export default mockMotorcycleRepository;
