/**
 * RIDEX — useRideDiscovery Hook
 * Queries upcoming community rides using TanStack Query with automatic caching and filtering.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rideDiscoveryService } from '../services/rides/RideDiscoveryService';
import { RideDiscoveryFilters, RideCategory, RideDifficulty } from '../types/groupRide';

export function useRideDiscovery(initialFilters: RideDiscoveryFilters = {}) {
  const [filters, setFilters] = useState<RideDiscoveryFilters>({
    category: 'ALL',
    difficulty: 'ALL',
    dateFilter: 'ALL',
    searchQuery: '',
    ...initialFilters,
  });

  const query = useQuery({
    queryKey: ['rides', 'discovery', filters],
    queryFn: () => rideDiscoveryService.discoverRides(filters),
    staleTime: 1000 * 30, // 30 seconds
  });

  const setCategory = (category: RideCategory | 'ALL') => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const setDifficulty = (difficulty: RideDifficulty | 'ALL') => {
    setFilters((prev) => ({ ...prev, difficulty }));
  };

  const setDateFilter = (dateFilter: 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEKEND' | 'THIS_WEEK') => {
    setFilters((prev) => ({ ...prev, dateFilter }));
  };

  const setSearchQuery = (searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  };

  return {
    rides: query.data || [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
    filters,
    setCategory,
    setDifficulty,
    setDateFilter,
    setSearchQuery,
    setFilters,
  };
}
