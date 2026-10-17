import { useState, useEffect, useCallback } from 'react';
import { motorcycleService } from '../services/MotorcycleService';
import { Motorcycle, CreateMotorcycleDto } from '../types';

export function useMotorcycles(userId = 'usr-1') {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMotorcycles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await motorcycleService.getMotorcycles(userId);
      setMotorcycles(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load garage motorcycles');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMotorcycles();
  }, [fetchMotorcycles]);

  const addMotorcycle = async (data: CreateMotorcycleDto) => {
    try {
      const newBike = await motorcycleService.addMotorcycle(userId, data);
      setMotorcycles((prev) => [newBike, ...prev]);
      return newBike;
    } catch (err: any) {
      setError(err?.message || 'Failed to add motorcycle');
      throw err;
    }
  };

  const updateMotorcycle = async (id: string, data: Partial<Motorcycle>) => {
    try {
      const updated = await motorcycleService.updateMotorcycle(id, data);
      setMotorcycles((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update motorcycle');
      throw err;
    }
  };

  const deleteMotorcycle = async (id: string) => {
    try {
      await motorcycleService.deleteMotorcycle(id);
      setMotorcycles((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete motorcycle');
      throw err;
    }
  };

  const setPrimary = async (id: string) => {
    try {
      await motorcycleService.setPrimaryMotorcycle(userId, id);
      setMotorcycles((prev) =>
        prev.map((b) => ({ ...b, isPrimary: b.id === id }))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to set primary motorcycle');
      throw err;
    }
  };

  const primaryBike = motorcycles.find((b) => b.isPrimary) || motorcycles[0];

  return {
    motorcycles,
    primaryBike,
    loading,
    error,
    refresh: fetchMotorcycles,
    addMotorcycle,
    updateMotorcycle,
    deleteMotorcycle,
    setPrimary,
  };
}
