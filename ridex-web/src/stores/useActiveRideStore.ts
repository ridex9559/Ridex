/**
 * RIDEX Web — Live Ride Cockpit Store (Zustand)
 * Manages live GPS tracking status, peer rider positions, and hysteresis separation alerts.
 */

import { create } from 'zustand';
import { LiveRiderLocation, GroupSeparationState, SosAlert } from '../types';
import { evaluateGroupSeparation } from '../utils/geo';

interface ActiveRideState {
  activeRideId: string | null;
  isTracking: boolean;
  myLocation: LiveRiderLocation | null;
  peerLocations: Record<string, LiveRiderLocation>;
  separationState: GroupSeparationState;
  activeSos: SosAlert | null;
  permissionGranted: boolean;

  setActiveRideId: (rideId: string | null) => void;
  setPermissionGranted: (granted: boolean) => void;
  startTracking: (rideId: string, initialLocation?: LiveRiderLocation) => void;
  stopTracking: () => void;
  updateMyLocation: (location: LiveRiderLocation) => void;
  updatePeerLocation: (location: LiveRiderLocation) => void;
  triggerSos: (alert: SosAlert) => void;
  clearSos: () => void;
}

const initialSeparationState: GroupSeparationState = {
  status: 'TOGETHER',
  maxSpreadMeters: 0,
  leadDistanceMeters: 0,
  activeRidersCount: 1,
  staleRidersCount: 0,
  message: 'Squad together within safe distance.',
  separatedRiders: [],
};

export const useActiveRideStore = create<ActiveRideState>((set, get) => ({
  activeRideId: null,
  isTracking: false,
  myLocation: null,
  peerLocations: {},
  separationState: initialSeparationState,
  activeSos: null,
  permissionGranted: false,

  setActiveRideId: (rideId) => set({ activeRideId: rideId }),

  setPermissionGranted: (granted) => set({ permissionGranted: granted }),

  startTracking: (rideId, initialLocation) => {
    set({
      activeRideId: rideId,
      isTracking: true,
      myLocation: initialLocation || null,
    });
  },

  stopTracking: () => {
    set({
      isTracking: false,
    });
  },

  updateMyLocation: (location) => {
    const { peerLocations, separationState } = get();
    const allRiders = [location, ...Object.values(peerLocations)];
    const newSeparation = evaluateGroupSeparation(allRiders, location.userId, separationState.status);

    set({
      myLocation: location,
      separationState: newSeparation,
    });
  },

  updatePeerLocation: (location) => {
    const { peerLocations, myLocation, separationState } = get();
    const updatedPeers = {
      ...peerLocations,
      [location.userId]: location,
    };

    const allRiders = myLocation ? [myLocation, ...Object.values(updatedPeers)] : Object.values(updatedPeers);
    const newSeparation = evaluateGroupSeparation(
      allRiders,
      myLocation?.userId,
      separationState.status
    );

    set({
      peerLocations: updatedPeers,
      separationState: newSeparation,
    });
  },

  triggerSos: (alert) => set({ activeSos: alert }),

  clearSos: () => set({ activeSos: null }),
}));
