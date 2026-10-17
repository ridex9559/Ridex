import { create } from 'zustand';
import { RideLocationPoint, RideTrackingStatus } from '@/services/location/locationTypes';

export interface LiveTelemetryMetrics {
  currentLocation: RideLocationPoint | null;
  currentSpeedKmh: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  elevationGainMeters: number;
}

export interface RideTrackingStoreState extends LiveTelemetryMetrics {
  activeRideId: string | null;
  status: RideTrackingStatus;
  isTracking: boolean;
  isPaused: boolean;
  startTimeMs: number | null;
  maxLeanAngleDegrees: number;
  currentLeanAngleDegrees: number;
  error: string | null;

  // Actions
  setTrackingState: (state: Partial<RideTrackingStoreState>) => void;
  updateLiveMetrics: (metrics: Partial<LiveTelemetryMetrics>) => void;
  setPaused: (isPaused: boolean) => void;
  setLeanAngle: (angle: number) => void;
  setError: (error: string | null) => void;
  resetTracking: () => void;
}

const initialTrackingState = {
  activeRideId: null,
  status: 'IDLE' as RideTrackingStatus,
  isTracking: false,
  isPaused: false,
  startTimeMs: null,
  currentLocation: null,
  currentSpeedKmh: 0,
  maxSpeedKmh: 0,
  avgSpeedKmh: 0,
  distanceMeters: 0,
  distanceKm: 0,
  durationSeconds: 0,
  elevationGainMeters: 0,
  maxLeanAngleDegrees: 0,
  currentLeanAngleDegrees: 0,
  error: null,
};

export const useRideTrackingStore = create<RideTrackingStoreState>((set) => ({
  ...initialTrackingState,

  setTrackingState: (partialState) => set((state) => ({ ...state, ...partialState })),

  updateLiveMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),

  setPaused: (isPaused) =>
    set((state) => ({
      ...state,
      isPaused,
      status: isPaused ? 'PAUSED' : 'ACTIVE',
    })),

  setLeanAngle: (angle) =>
    set((state) => {
      const absAngle = Math.abs(angle);
      return {
        ...state,
        currentLeanAngleDegrees: angle,
        maxLeanAngleDegrees: Math.max(state.maxLeanAngleDegrees, Math.round(absAngle)),
      };
    }),

  setError: (error) => set({ error }),

  resetTracking: () => set({ ...initialTrackingState }),
}));
