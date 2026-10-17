import { create } from 'zustand';
import { Ride, RideLocation } from '@/types/ride';
import { rideService } from '@/services/api/rides';
import { logger } from '@/utils/logger';

interface ActiveRideTelemetry {
  isTracking: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  currentSpeedKmh: number;
  maxSpeedKmh: number;
  averageSpeedKmh: number;
  distanceKm: number;
  elevationGainMeters: number;
  maxLeanAngleDegrees?: number;
  currentLocation: RideLocation | null;
  coordinates: RideLocation[];
  selectedBikeId: string | null;
  rideTitle: string;
  rideType: 'SOLO' | 'GROUP' | 'COMMUTE' | 'TRACK';
  speedHistory: number[];
}

interface RideState extends ActiveRideTelemetry {
  // Active Ride Controls
  startRide: (params: { bikeId?: string; title?: string; type?: 'SOLO' | 'GROUP' | 'COMMUTE' | 'TRACK' }) => void;
  pauseRide: () => void;
  resumeRide: () => void;
  stopRide: () => Promise<Ride | null>;
  resetRide: () => void;
  
  // Real-time GPS & Sensor Updates
  addLocation: (location: RideLocation) => void;
  tickTimer: () => void;
  updateLeanAngle: (angle: number) => void;
}

const initialTelemetry: ActiveRideTelemetry = {
  isTracking: false,
  isPaused: false,
  startTime: null,
  elapsedSeconds: 0,
  currentSpeedKmh: 0,
  maxSpeedKmh: 0,
  averageSpeedKmh: 0,
  distanceKm: 0,
  elevationGainMeters: 0,
  maxLeanAngleDegrees: 0,
  currentLocation: null,
  coordinates: [],
  selectedBikeId: null,
  rideTitle: 'Morning Tour',
  rideType: 'SOLO',
  speedHistory: [],
};

export const useRideStore = create<RideState>((set, get) => ({
  ...initialTelemetry,

  startRide: ({ bikeId, title = 'Motorcycle Adventure', type = 'SOLO' }) => {
    set({
      ...initialTelemetry,
      isTracking: true,
      isPaused: false,
      startTime: Date.now(),
      selectedBikeId: bikeId || null,
      rideTitle: title,
      rideType: type,
    });
    logger.info('Ride tracking started', { title, type, bikeId });
  },

  pauseRide: () => {
    set({ isPaused: true });
    logger.info('Ride tracking paused');
  },

  resumeRide: () => {
    set({ isPaused: false });
    logger.info('Ride tracking resumed');
  },

  addLocation: (loc: RideLocation) => {
    const state = get();
    if (!state.isTracking || state.isPaused) return;

    const coords = [...state.coordinates, loc];
    const speed = Math.max(0, loc.speedKmh);
    const maxSpeed = Math.max(state.maxSpeedKmh, speed);
    const speedHistory = [...state.speedHistory, speed];
    const avgSpeed = speedHistory.length > 0 
      ? Number((speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length).toFixed(1))
      : speed;

    // Calculate incremental distance if there is a previous point
    let additionalDist = 0;
    let additionalElevation = 0;
    if (state.coordinates.length > 0) {
      const prev = state.coordinates[state.coordinates.length - 1];
      additionalDist = calculateDistance(prev.latitude, prev.longitude, loc.latitude, loc.longitude);
      if (loc.altitudeMeters > prev.altitudeMeters) {
        additionalElevation = loc.altitudeMeters - prev.altitudeMeters;
      }
    }

    set({
      currentLocation: loc,
      coordinates: coords,
      currentSpeedKmh: speed,
      maxSpeedKmh: maxSpeed,
      averageSpeedKmh: avgSpeed,
      distanceKm: Number((state.distanceKm + additionalDist).toFixed(2)),
      elevationGainMeters: Math.round(state.elevationGainMeters + additionalElevation),
      speedHistory,
    });
  },

  tickTimer: () => {
    const state = get();
    if (state.isTracking && !state.isPaused) {
      set({ elapsedSeconds: state.elapsedSeconds + 1 });
    }
  },

  updateLeanAngle: (angle: number) => {
    const state = get();
    const absAngle = Math.abs(angle);
    if (absAngle > (state.maxLeanAngleDegrees || 0)) {
      set({ maxLeanAngleDegrees: Math.round(absAngle) });
    }
  },

  stopRide: async () => {
    const state = get();
    if (!state.isTracking) return null;

    try {
      const newRide = await rideService.createRide({
        title: state.rideTitle || 'Motorcycle Ride',
        motorcycleId: state.selectedBikeId || 'bike-1',
        startTime: new Date(state.startTime || Date.now()).toISOString(),
        endTime: new Date().toISOString(),
        distanceKm: state.distanceKm,
        durationSeconds: state.elapsedSeconds,
        averageSpeedKmh: state.averageSpeedKmh,
        maxSpeedKmh: state.maxSpeedKmh,
        elevationGainMeters: state.elevationGainMeters,
        maxLeanAngleDegrees: state.maxLeanAngleDegrees,
        type: state.rideType,
        isPublic: true,
        coordinates: state.coordinates,
      });

      set({ ...initialTelemetry });
      logger.info('Ride stopped and saved successfully', newRide.id);
      return newRide;
    } catch (err) {
      logger.error('Failed to save ride', err);
      return null;
    }
  },

  resetRide: () => {
    set({ ...initialTelemetry });
  },
}));

// Helper Haversine distance formula in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
