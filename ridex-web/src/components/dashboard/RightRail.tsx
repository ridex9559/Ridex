/**
 * RIDEX Web — Right Information Rail (~330-350px)
 * Displays Upcoming Rides, Host Join Requests / Ride Invitations with real Approve/Reject mutations,
 * verified Rider Community, and atmospheric adventure touring banner.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Compass,
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { RideEvent, UserProfile } from '../../types';

interface RightRailProps {
  currentUser?: UserProfile | null;
  rides: RideEvent[];
  onSelectFilter?: (filter: 'all' | 'hosted' | 'joined') => void;
}

export const RightRail: React.FC<RightRailProps> = ({
  currentUser,
  rides,
  onSelectFilter,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 1. Fetch pending join requests across all rides hosted by current user
  const { data: pendingRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['hostPendingRequests', currentUser?.id],
    queryFn: () =>
      currentUser?.id
        ? rideService.getHostPendingRequests(currentUser.id)
        : Promise.resolve([]),
    enabled: !!currentUser?.id,
  });

  // 2. Approve Request Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ rideId, userId }: { rideId: string; userId: string }) => {
      const success = await rideService.approveParticipant(rideId, userId);
      if (!success) throw new Error('Failed to approve participant.');
      return success;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      setActionFeedback('Rider approved and added to squad!');
      setTimeout(() => setActionFeedback(null), 3000);
    },
    onError: () => {
      setActionFeedback('Failed to approve rider. Please check connection.');
      setTimeout(() => setActionFeedback(null), 3000);
    },
  });

  // 3. Reject Request Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ rideId, userId }: { rideId: string; userId: string }) => {
      const success = await rideService.rejectParticipant(rideId, userId);
      if (!success) throw new Error('Failed to decline request.');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      setActionFeedback('Request declined.');
      setTimeout(() => setActionFeedback(null), 3000);
    },
    onError: () => {
      setActionFeedback('Failed to decline request.');
      setTimeout(() => setActionFeedback(null), 3000);
    },
  });

  // Upcoming rides (limit to next 3)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingRides = rides
    .filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
    .slice(0, 3);

  // Extract distinct community riders from rides
  const communityRiders: UserProfile[] = [];
  const seenIds = new Set<string>();
  if (currentUser) seenIds.add(currentUser.id);

  rides.forEach((r) => {
    if (r.organizer && !seenIds.has(r.organizer.id)) {
      seenIds.add(r.organizer.id);
      communityRiders.push(r.organizer);
    }
    r.participants?.forEach((p) => {
      if (p.user && !seenIds.has(p.user.id)) {
        seenIds.add(p.user.id);
        communityRiders.push(p.user);
      }
    });
  });

  return (
    <div className="ridex-right-rail">
      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="rail-toast">
          <CheckCircle2 size={16} color="var(--success)" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* SECTION 1: UPCOMING RIDES */}
      <div className="rail-card">
        <div className="rail-card-header">
          <div>
            <h3 className="rail-card-title">Upcoming Rides</h3>
            <span className="rail-card-subtitle">Scheduled expeditions</span>
          </div>
          <button
            onClick={() => onSelectFilter?.('all')}
            className="rail-link-btn"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="rail-list">
          {upcomingRides.length === 0 ? (
            <div className="rail-empty-state">
              <Compass size={28} color="var(--text-muted)" />
              <p>No upcoming rides scheduled yet.</p>
              <button
                onClick={() => navigate('/host')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', minHeight: '34px', padding: '6px 12px' }}
              >
                Host an Expedition
              </button>
            </div>
          ) : (
            upcomingRides.map((ride) => (
              <div
                key={ride.id}
                onClick={() => navigate(`/rides/${ride.id}`)}
                className="rail-ride-row card-interactive"
              >
                <div className="rail-ride-badge">
                  <span className="rail-ride-month">
                    {new Date(ride.rideDate).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="rail-ride-day">
                    {new Date(ride.rideDate).getDate() || '18'}
                  </span>
                </div>
                <div className="rail-ride-info">
                  <div className="rail-ride-title">{ride.title}</div>
                  <div className="rail-ride-route">
                    <MapPin size={11} color="var(--cyan)" />
                    <span>{ride.destinationName}</span>
                  </div>
                  <div className="rail-ride-meta">
                    <span>{ride.distanceKm} km</span>
                    <span>•</span>
                    <span>{ride.departureTime}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 2: JOIN REQUESTS / RIDE INVITATIONS (Host Permissions) */}
      <div className="rail-card">
        <div className="rail-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 className="rail-card-title">Join Requests</h3>
              {pendingRequests.length > 0 && (
                <span className="rail-counter-pill">{pendingRequests.length}</span>
              )}
            </div>
            <span className="rail-card-subtitle">Road Captain approval queue</span>
          </div>
        </div>

        <div className="rail-list">
          {!currentUser ? (
            <div className="rail-empty-state">
              <p>Sign in to manage tour join requests.</p>
            </div>
          ) : isLoadingRequests ? (
            <div className="rail-empty-state">
              <p>Checking squad requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="rail-empty-state">
              <UserCheck size={26} color="var(--text-muted)" />
              <p>No pending join requests</p>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Riders who apply with your Ride ID will appear here for approval.
              </span>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.participantId} className="rail-request-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={
                      req.user?.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80'
                    }
                    alt={req.user?.fullName || 'Rider'}
                    className="rail-user-avatar"
                  />
                  <div className="rail-request-details">
                    <div className="rail-request-name">
                      {req.user?.fullName || 'Rider'}
                    </div>
                    <div className="rail-request-tour">
                      Tour: <strong>{req.rideTitle}</strong>
                    </div>
                    <div className="rail-request-city">
                      {req.user?.city || 'Adventure Rider'}
                    </div>
                  </div>
                </div>

                <div className="rail-request-actions">
                  <button
                    onClick={() =>
                      approveMutation.mutate({
                        rideId: req.rideId,
                        userId: req.userId,
                      })
                    }
                    disabled={approveMutation.isPending}
                    className="btn-approve"
                    title="Approve Rider"
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() =>
                      rejectMutation.mutate({
                        rideId: req.rideId,
                        userId: req.userId,
                      })
                    }
                    disabled={rejectMutation.isPending}
                    className="btn-reject"
                    title="Decline"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 3: RIDER COMMUNITY */}
      <div className="rail-card">
        <div className="rail-card-header">
          <div>
            <h3 className="rail-card-title">Ride Community</h3>
            <span className="rail-card-subtitle">Active squad members</span>
          </div>
          <span className="rail-status-dot-active" title="Network Online">
            <span className="dot"></span> Online
          </span>
        </div>

        <div className="rail-community-list">
          {communityRiders.length === 0 ? (
            <div className="rail-empty-state">
              <Users size={24} color="var(--text-muted)" />
              <p>Discover riders on your next squad tour.</p>
            </div>
          ) : (
            communityRiders.slice(0, 5).map((rider) => (
              <div key={rider.id} className="rail-community-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={
                      rider.avatarUrl ||
                      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&q=80'
                    }
                    alt={rider.fullName}
                    className="rail-user-avatar-sm"
                  />
                  <div>
                    <div className="rail-community-name">{rider.fullName}</div>
                    <div className="rail-community-city">
                      {rider.city ? `${rider.city}, IN` : 'Touring Rider'}
                    </div>
                  </div>
                </div>
                <span className="rail-rider-badge">Rider</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 4: DECORATIVE PROMOTIONAL CARD */}
      <div className="rail-promo-banner">
        <div className="promo-overlay"></div>
        <div className="promo-content">
          <div className="promo-tag">
            <Sparkles size={12} color="var(--primary)" />
            <span>RIDEX EXPLORATION</span>
          </div>
          <h4 className="promo-headline">MORE ROADS. BETTER STORIES. TOGETHER.</h4>
          <p className="promo-desc">
            Keep your squad in formation with real-time radar telemetry and hysteresis proximity alerts.
          </p>
        </div>
      </div>
    </div>
  );
};
