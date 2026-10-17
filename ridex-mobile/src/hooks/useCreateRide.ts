/**
 * RIDEX — useCreateRide Hook
 * Multi-step wizard state management with immutable structured location/waypoint state,
 * live multi-stop route distance & duration calculation, and ride publication.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useBikeStore } from '../store/bikeStore';
import { useRideTrackingStore } from '../store/rideTrackingStore';
import {
  RideDraft,
  CreateRideFormErrors,
  LocationAnchor,
  RideCategory,
  RideDifficulty,
  RideVisibility,
} from '../types/groupRide';
import { RideCheckpoint, CheckpointType } from '../types/connectRide';
import { rideService } from '../services/rides/RideService';
import { checkpointService } from '../services/connectRide/CheckpointService';
import { routeCalculationService } from '../services/maps/RouteCalculationService';
import { fuelPlanningService, FuelPlanSummary } from '../services/fuel/FuelPlanningService';
import { MapCoordinate } from '../services/maps/mapTypes';

export interface CreateRideState extends RideDraft {
  waypoints: RideCheckpoint[];
}

const INITIAL_DRAFT: RideDraft = {
  title: '',
  description: '',
  category: 'CASUAL',
  difficulty: 'BEGINNER',
  startLocation: null,
  destination: null,
  checkpoints: [],
  scheduledDate: new Date(Date.now() + 86400000), // Default tomorrow
  scheduledTime: '07:00',
  meetingTime: '06:30 AM',
  rideStartTime: '07:00 AM',
  maxParticipants: 15,
  visibility: 'PUBLIC',
  approvalRequired: true,
  assignedLeaders: [],
};

export function useCreateRide() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const storeLocation = useRideTrackingStore((s) => s.currentLocation);
  const { motorcycles, activeMotorcycleId } = useBikeStore();
  const activeBike = motorcycles.find((b) => b.id === activeMotorcycleId) || motorcycles[0];

  const [step, setStep] = useState<number>(1);
  const [draft, setDraft] = useState<RideDraft>(() => ({
    ...INITIAL_DRAFT,
    motorcycleId: activeBike?.id,
    startLocation: storeLocation
      ? {
          name: 'My Current Location',
          latitude: storeLocation.latitude,
          longitude: storeLocation.longitude,
        }
      : null,
    checkpoints: [],
  }));

  // Waypoints State (intermediate checkpoints strictly ordered between start and destination)
  const [waypoints, setWaypoints] = useState<RideCheckpoint[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(64);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number>(90);
  const [errors, setErrors] = useState<CreateRideFormErrors>({});
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Recalculate route polyline, distance and duration whenever start, destination, or waypoints change
  useEffect(() => {
    let isCancelled = false;

    // Fast synchronous distance first for instant feedback
    const quickKm = routeCalculationService.calculateQuickDistanceKm(
      draft.startLocation,
      waypoints,
      draft.destination
    );
    if (quickKm > 0) {
      setTotalDistanceKm(quickKm);
      setTotalDurationMinutes(Math.round((quickKm / 50) * 60) + waypoints.length * 15);
    }

    // Then trigger accurate multi-stop route resolution
    routeCalculationService
      .calculateMultiStopRoute(draft.startLocation, waypoints, draft.destination)
      .then((res) => {
        if (!isCancelled && res.distanceKm > 0) {
          setTotalDistanceKm(res.distanceKm);
          setTotalDurationMinutes(res.durationMinutes);
          setRouteCoordinates(res.coordinates);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [draft.startLocation, draft.destination, waypoints]);

  // Fuel plan calculation based on live calculated route distance
  const fuelPlan: FuelPlanSummary = useMemo(() => {
    return fuelPlanningService.calculateFuelPlan({
      distanceKm: totalDistanceKm || 64,
      tankCapacityLiters: activeBike?.fuelTankCapacityLiters || 15,
      averageMileageKmpl: activeBike?.averageMileageKmpl || 28,
    });
  }, [totalDistanceKm, activeBike]);

  const updateDraft = useCallback((updates: Partial<RideDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    setErrors({});
  }, []);

  const updateStartLocation = useCallback((location: LocationAnchor) => {
    setDraft((prev) => ({ ...prev, startLocation: location }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.startLocation;
      return next;
    });
  }, []);

  const updateDestination = useCallback((location: LocationAnchor) => {
    setDraft((prev) => ({ ...prev, destination: location }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.destination;
      return next;
    });
  }, []);

  // Backward compatibility aliases
  const setStartLocation = updateStartLocation;
  const setDestination = updateDestination;

  // Add a new waypoint immutably
  const addWaypoint = useCallback((waypoint: {
    id?: string;
    name: string;
    latitude: number;
    longitude: number;
    type?: string;
    category?: string;
    stopDuration?: number;
    estimatedStopMinutes?: number;
    address?: string;
  }) => {
    setWaypoints((prev) => {
      const seq = prev.length + 1;
      const newWp: RideCheckpoint = {
        id: waypoint.id || `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        rideId: '',
        name: waypoint.name || `Waypoint ${seq}`,
        type: (waypoint.type as CheckpointType) || (waypoint.category as CheckpointType) || 'REGROUP',
        latitude: Number(waypoint.latitude),
        longitude: Number(waypoint.longitude),
        orderIndex: seq,
        sequence: seq,
        estimatedStopMinutes: waypoint.stopDuration || waypoint.estimatedStopMinutes || 15,
        stopDuration: waypoint.stopDuration || waypoint.estimatedStopMinutes || 15,
        address: waypoint.address,
        category: waypoint.category,
      };

      const updated = [...prev, newWp];
      // Keep draft checkpoints in sync
      setDraft((d) => ({
        ...d,
        checkpoints: updated.map((cp, idx) => ({
          id: cp.id,
          name: cp.name,
          type: cp.type as any,
          latitude: cp.latitude,
          longitude: cp.longitude,
          order: idx + 1,
        })),
      }));
      return updated;
    });
  }, []);

  // Remove a waypoint immutably by index or ID and re-sequence remaining waypoints
  const removeWaypoint = useCallback((indexOrId: number | string) => {
    setWaypoints((prev) => {
      const filtered = typeof indexOrId === 'number'
        ? prev.filter((_, idx) => idx !== indexOrId)
        : prev.filter((wp) => wp.id !== indexOrId);

      // Re-index sequences strictly 1, 2, 3...
      const reindexed = filtered.map((wp, idx) => ({
        ...wp,
        orderIndex: idx + 1,
        sequence: idx + 1,
      }));

      setDraft((d) => ({
        ...d,
        checkpoints: reindexed.map((cp, idx) => ({
          id: cp.id,
          name: cp.name,
          type: cp.type as any,
          latitude: cp.latitude,
          longitude: cp.longitude,
          order: idx + 1,
        })),
      }));

      return reindexed;
    });
  }, []);

  // Update a waypoint immutably
  const updateWaypoint = useCallback((id: string, updates: Partial<RideCheckpoint>) => {
    setWaypoints((prev) => {
      const updated = prev.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp));

      setDraft((d) => ({
        ...d,
        checkpoints: updated.map((cp, idx) => ({
          id: cp.id,
          name: cp.name,
          type: cp.type as any,
          latitude: cp.latitude,
          longitude: cp.longitude,
          order: idx + 1,
        })),
      }));

      return updated;
    });
  }, []);

  // Reorder waypoints
  const reorderWaypoints = useCallback((fromIndex: number, toIndex: number) => {
    setWaypoints((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      const reindexed = next.map((wp, idx) => ({
        ...wp,
        orderIndex: idx + 1,
        sequence: idx + 1,
      }));

      setDraft((d) => ({
        ...d,
        checkpoints: reindexed.map((cp, idx) => ({
          id: cp.id,
          name: cp.name,
          type: cp.type as any,
          latitude: cp.latitude,
          longitude: cp.longitude,
          order: idx + 1,
        })),
      }));

      return reindexed;
    });
  }, []);

  // Build the complete combined checkpoints array (Start -> Waypoints -> Destination)
  const getAllCheckpoints = useCallback((): RideCheckpoint[] => {
    const list: RideCheckpoint[] = [];

    if (draft.startLocation) {
      list.push({
        id: 'cp-start',
        rideId: '',
        name: draft.startLocation.name || 'Start Rendezvous Point',
        type: 'START',
        latitude: draft.startLocation.latitude,
        longitude: draft.startLocation.longitude,
        orderIndex: 0,
        sequence: 0,
        estimatedStopMinutes: 15,
        stopDuration: 15,
      });
    }

    waypoints.forEach((wp, idx) => {
      list.push({
        ...wp,
        orderIndex: idx + 1,
        sequence: idx + 1,
      });
    });

    if (draft.destination) {
      list.push({
        id: 'cp-dest',
        rideId: '',
        name: draft.destination.name || 'Final Destination',
        type: 'DESTINATION',
        latitude: draft.destination.latitude,
        longitude: draft.destination.longitude,
        orderIndex: list.length,
        sequence: list.length,
        estimatedStopMinutes: 0,
        stopDuration: 0,
      });
    }

    return list;
  }, [draft.startLocation, draft.destination, waypoints]);

  const validateCurrentStep = useCallback((): boolean => {
    if (step === 1) {
      if (!draft.title || draft.title.trim().length < 3) {
        setErrors({ title: 'Title must be at least 3 characters' });
        return false;
      }
    } else if (step === 2) {
      if (!draft.startLocation) {
        setErrors({ startLocation: 'Please select a start / meetup point' });
        return false;
      }
      if (!draft.destination) {
        setErrors({ destination: 'Please select a destination point' });
        return false;
      }
    } else if (step === 4) {
      if (!draft.scheduledDate) {
        setErrors({ scheduledDate: 'Please pick a ride date' });
        return false;
      }
      if (!draft.scheduledTime) {
        setErrors({ scheduledTime: 'Please pick a departure time' });
        return false;
      }
    }
    setErrors({});
    return true;
  }, [step, draft]);

  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(5, prev + 1));
    }
  }, [validateCurrentStep]);

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  }, []);

  const publishRide = useCallback(async (): Promise<{ id: string; rideCode: string } | null> => {
    if (!user) {
      setErrors({ general: 'You must be logged in to create a ride' });
      return null;
    }

    const fullCheckpoints = getAllCheckpoints();

    const draftToValidate: RideDraft = {
      ...draft,
      checkpoints: fullCheckpoints.map((cp, idx) => ({
        id: cp.id,
        name: cp.name,
        type: cp.type as any,
        latitude: cp.latitude,
        longitude: cp.longitude,
        order: idx,
      })),
    };

    const validation = rideService.validateDraft(draftToValidate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return null;
    }

    setIsPublishing(true);
    try {
      const created = await rideService.publishRide(user.id, draftToValidate);
      if (created) {
        // Persist all checkpoints to DB & local cache
        await checkpointService.saveCheckpoints(created.id, fullCheckpoints);
      }
      setIsPublishing(false);
      return { id: created.id, rideCode: created.rideCode };
    } catch (err: any) {
      setIsPublishing(false);
      setErrors({ general: err?.message || 'Failed to publish ride' });
      return null;
    }
  }, [user, draft, getAllCheckpoints]);

  return {
    step,
    draft,
    waypoints,
    totalDistanceKm,
    totalDurationMinutes,
    routeCoordinates,
    fuelPlan,
    errors,
    isPublishing,
    updateDraft,
    updateStartLocation,
    updateDestination,
    setStartLocation,
    setDestination,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    reorderWaypoints,
    setWaypoints,
    getAllCheckpoints,
    nextStep,
    prevStep,
    publishRide,
    setStep,
  };
}
