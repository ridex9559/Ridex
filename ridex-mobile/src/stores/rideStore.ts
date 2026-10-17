/**
 * RIDEX V2 — Central Ride State Store
 * Single source of truth for ride lifecycle, participant status, approved roster,
 * and live squad GPS telemetry.
 */

import { create } from 'zustand';
import { RideEvent, RideParticipant, ParticipantApprovalStatus } from '../types/groupRide';
import { LiveRiderLocation } from '../types/liveRide';

export type UserRideRole = 'ORGANIZER' | 'LEADER' | 'RIDER' | 'NONE';
export type UserParticipationState =
  | 'NOT_JOINED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ORGANIZER';

export interface PeerTelemetry {
  userId: string;
  riderName: string;
  avatarUrl?: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  accuracy?: number;
  updatedAt: string;
}

interface RideState {
  // Current Selected / Active Ride
  currentRide: RideEvent | null;
  userParticipationStatus: UserParticipationState;
  userRole: UserRideRole;

  // Squad Members
  participants: RideParticipant[];
  pendingRequests: RideParticipant[];

  // Live Telemetry
  isTracking: boolean;
  peerLocations: Record<string, PeerTelemetry>;

  // Network / Sync Status
  isRealtimeConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentRide: (ride: RideEvent | null) => void;
  setUserParticipationStatus: (status: UserParticipationState) => void;
  setParticipants: (participants: RideParticipant[]) => void;
  addParticipant: (participant: RideParticipant) => void;
  updateParticipantApproval: (userId: string, status: ParticipantApprovalStatus) => void;
  updatePeerLocation: (location: PeerTelemetry) => void;
  removePeerLocation: (userId: string) => void;
  setIsTracking: (isTracking: boolean) => void;
  setRealtimeConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetRideState: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  currentRide: null,
  userParticipationStatus: 'NOT_JOINED',
  userRole: 'NONE',
  participants: [],
  pendingRequests: [],
  isTracking: false,
  peerLocations: {},
  isRealtimeConnected: false,
  isLoading: false,
  error: null,

  setCurrentRide: (ride) =>
    set((state) => {
      if (!ride) {
        return {
          currentRide: null,
          userParticipationStatus: 'NOT_JOINED',
          userRole: 'NONE',
          participants: [],
          pendingRequests: [],
          peerLocations: {},
        };
      }
      return {
        currentRide: ride,
        userParticipationStatus: (ride.userParticipationStatus as any) || state.userParticipationStatus,
        userRole: (ride.userRole as any) || state.userRole,
      };
    }),

  setUserParticipationStatus: (status) => set({ userParticipationStatus: status }),

  setParticipants: (participants) =>
    set({
      participants,
      pendingRequests: participants.filter((p) => p.approvalStatus === 'PENDING'),
    }),

  addParticipant: (participant) =>
    set((state) => {
      const existingIdx = state.participants.findIndex((p) => p.userId === participant.userId);
      let updated: RideParticipant[];
      if (existingIdx >= 0) {
        updated = [...state.participants];
        updated[existingIdx] = participant;
      } else {
        updated = [...state.participants, participant];
      }
      return {
        participants: updated,
        pendingRequests: updated.filter((p) => p.approvalStatus === 'PENDING'),
      };
    }),

  updateParticipantApproval: (userId, status) =>
    set((state) => {
      const updated = state.participants.map((p) =>
        p.userId === userId ? { ...p, approvalStatus: status } : p
      );
      return {
        participants: updated,
        pendingRequests: updated.filter((p) => p.approvalStatus === 'PENDING'),
      };
    }),

  updatePeerLocation: (loc) =>
    set((state) => ({
      peerLocations: {
        ...state.peerLocations,
        [loc.userId]: loc,
      },
    })),

  removePeerLocation: (userId) =>
    set((state) => {
      const updated = { ...state.peerLocations };
      delete updated[userId];
      return { peerLocations: updated };
    }),

  setIsTracking: (isTracking) => set({ isTracking }),
  setRealtimeConnected: (isRealtimeConnected) => set({ isRealtimeConnected }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  resetRideState: () =>
    set({
      currentRide: null,
      userParticipationStatus: 'NOT_JOINED',
      userRole: 'NONE',
      participants: [],
      pendingRequests: [],
      isTracking: false,
      peerLocations: {},
      isRealtimeConnected: false,
      isLoading: false,
      error: null,
    }),
}));
