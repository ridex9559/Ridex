/**
 * RIDEX — useRideDetails Hook
 * Fetches group ride info, participant roster, and organizer metadata.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { rideService } from '../services/rides/RideService';
import { rideParticipationService } from '../services/rides/RideParticipationService';
import { RideEvent, RideParticipant } from '../types/groupRide';

export function useRideDetails(rideId: string) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  const rideQuery = useQuery<RideEvent | null>({
    queryKey: ['rides', 'details', rideId, currentUserId],
    queryFn: () => rideService.getRideDetails(rideId, currentUserId),
    enabled: !!rideId,
  });

  const participantsQuery = useQuery<RideParticipant[]>({
    queryKey: ['rides', 'participants', rideId],
    queryFn: async () => {
      const dbList = await rideService.getParticipants(rideId);
      if (dbList && dbList.length > 0) return dbList;
      return rideParticipationService.getParticipants(rideId);
    },
    enabled: !!rideId,
  });

  const ride = rideQuery.data;
  const participants = participantsQuery.data || [];

  const isOrganizer = !!(currentUserId && ride?.organizerId === currentUserId);
  const isLeader =
    isOrganizer ||
    (currentUserId ? ride?.assignedLeaders?.includes(currentUserId) : false) ||
    participants.some((p) => p.userId === currentUserId && p.role === 'LEADER');

  const userParticipation = participants.find((p) => p.userId === currentUserId);
  const isPending = userParticipation?.approvalStatus === 'PENDING';
  const isApproved =
    isOrganizer ||
    userParticipation?.approvalStatus === 'APPROVED' ||
    userParticipation?.status === 'JOINED' ||
    userParticipation?.status === 'approved';

  const pendingRequests = participants.filter((p) => p.approvalStatus === 'PENDING');
  const pendingCount = pendingRequests.length;

  const isFull =
    ride?.maxParticipants !== null &&
    ride?.maxParticipants !== undefined &&
    participants.filter((p) => p.approvalStatus === 'APPROVED' || p.status === 'JOINED' || p.status === 'approved').length >=
      ride.maxParticipants;

  return {
    ride,
    participants,
    pendingRequests,
    pendingCount,
    currentUserId,
    isLoading: rideQuery.isLoading || participantsQuery.isLoading,
    isOrganizer,
    isLeader,
    isApproved,
    isParticipant: isApproved,
    isJoined: isApproved,
    isPending,
    isFull,
    refetch: async () => {
      await Promise.all([rideQuery.refetch(), participantsQuery.refetch()]);
    },
  };
}

