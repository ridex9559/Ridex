/**
 * RIDEX — Ride Participant Repository Interface
 */

import { RideParticipant, ParticipantRole } from '../../types/groupRide';

export interface IRideParticipantRepository {
  getParticipantsByRideId(rideId: string): Promise<RideParticipant[]>;
  getUserParticipation(rideId: string, userId: string): Promise<RideParticipant | null>;
  joinRide(rideId: string, userId: string, role?: ParticipantRole): Promise<{ success: boolean; message?: string; participantId?: string; error?: string }>;
  leaveRide(rideId: string, userId: string): Promise<{ success: boolean; message?: string; error?: string }>;
  getJoinedRidesByUser(userId: string): Promise<string[]>;
}
