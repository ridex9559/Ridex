import { repositories } from '../repositories';
import { Motorcycle, CreateMotorcycleDto } from '../types';

export class MotorcycleService {
  private motorcycleRepo = repositories.motorcycles;

  async getMotorcycles(userId: string): Promise<Motorcycle[]> {
    return this.motorcycleRepo.getMotorcycles(userId);
  }

  async getMotorcycleById(id: string): Promise<Motorcycle | null> {
    return this.motorcycleRepo.getMotorcycleById(id);
  }

  async addMotorcycle(userId: string, data: CreateMotorcycleDto): Promise<Motorcycle> {
    return this.motorcycleRepo.createMotorcycle(userId, data);
  }

  async updateMotorcycle(id: string, data: Partial<Motorcycle>): Promise<Motorcycle> {
    return this.motorcycleRepo.updateMotorcycle(id, data);
  }

  async deleteMotorcycle(id: string): Promise<void> {
    return this.motorcycleRepo.deleteMotorcycle(id);
  }

  async setPrimaryMotorcycle(userId: string, id: string): Promise<void> {
    return this.motorcycleRepo.setPrimaryMotorcycle(userId, id);
  }
}

export const motorcycleService = new MotorcycleService();
export default motorcycleService;
