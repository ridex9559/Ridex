import { Motorcycle, CreateMotorcycleDto } from '../../types';

export interface IMotorcycleRepository {
  getMotorcycles(userId: string): Promise<Motorcycle[]>;
  getMotorcycleById(id: string): Promise<Motorcycle | null>;
  createMotorcycle(userId: string, data: CreateMotorcycleDto): Promise<Motorcycle>;
  updateMotorcycle(id: string, data: Partial<Motorcycle>): Promise<Motorcycle>;
  deleteMotorcycle(id: string): Promise<void>;
  setPrimaryMotorcycle(userId: string, id: string): Promise<void>;
}
