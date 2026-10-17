import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/UserService';
import { User } from '../types';

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: User | null;
      if (userId) {
        data = await userService.getProfile(userId);
      } else {
        data = await userService.getCurrentUser();
      }
      setProfile(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<User>) => {
    if (!profile) return null;
    try {
      const updated = await userService.updateProfile(profile.id, data);
      setProfile(updated);
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    updateProfile,
  };
}
