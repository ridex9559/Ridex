/**
 * RIDEX Web — Ride Details & Squad Roster Screen
 * Shows full tour map, persisted waypoints, unique Ride ID, participant approval management, and live launch.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { realtimeService } from '../services/realtimeService';
import { mapService } from '../services/mapService';
import { useAuthStore } from '../stores/useAuthStore';
import { LeafletMap } from '../components/maps/LeafletMap';
import {
  Compass,
  Copy,
  Check,
  Radio,
  Users,
  MapPin,
  Calendar,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Share2,
  ShieldAlert,
} from 'lucide-react';

export const RideDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  const { data: ride, isLoading, refetch } = useQuery({
    queryKey: ['ride', id, user?.id],
    queryFn: () => (id ? rideService.getRideById(id, user?.id) : Promise.resolve(null)),
    enabled: !!id,
  });

  // Calculate genuine road-following route using OSRM
  useEffect(() => {
    if (!ride) return;
    const waypointsList = ride.checkpoints || [];
    const allPoints = [
      { latitude: ride.startLatitude, longitude: ride.startLongitude },
      ...waypointsList.map((w) => ({ latitude: w.latitude, longitude: w.longitude })),
      { latitude: ride.destinationLatitude, longitude: ride.destinationLongitude },
    ];

    mapService
      .calculateRoute(allPoints)
      .then((res) => {
        if (res.coordinates && res.coordinates.length > 0) {
          setRouteCoordinates(res.coordinates);
        }
      })
      .catch((err) => console.warn('[RideDetailsPage] calculateRoute error:', err));
  }, [ride]);

  // Subscribe to real-time events for this ride
  useEffect(() => {
    if (!id) return;

    const channel = realtimeService.subscribeToRide(id, {
      onJoinRequest: () => {
        refetch();
      },
      onApprovalStatus: () => {
        refetch();
      },
      onRideStatus: () => {
        refetch();
      },
    });

    return () => {
      realtimeService.unsubscribeFromRide(id);
    };
  }, [id, refetch]);

  const isOrganizer = user?.id && ride?.organizerId === user.id;
  const isApprovedParticipant =
    ride?.userParticipationStatus === 'approved' || isOrganizer;
  const isPendingParticipant = ride?.userParticipationStatus === 'pending';

  const handleCopyCode = () => {
    if (ride?.joinCode) {
      navigator.clipboard.writeText(ride.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinRequest = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;

    setActionLoading(true);
    setFeedbackMsg('');

    try {
      const success = await rideService.requestToJoinRide(id, user.id);
      if (success) {
        setFeedbackMsg('Join request submitted to Road Captain.');
        await realtimeService.broadcastJoinRequest(id, {
          userId: user.id,
          riderName: user.fullName,
          requestedAt: new Date().toISOString(),
        });
        refetch();
      }
    } catch (e: any) {
      setFeedbackMsg(e.message || 'Failed to submit join request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await rideService.approveParticipant(id, userId);
      await realtimeService.broadcastApproval(id, {
        userId,
        status: 'APPROVED',
      });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await rideService.rejectParticipant(id, userId);
      await realtimeService.broadcastApproval(id, {
        userId,
        status: 'REJECTED',
      });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await rideService.startLiveRide(id);
      await realtimeService.broadcastRideStatus(id, 'active');
      refetch();
      navigate(`/rides/live/${id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndRide = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await rideService.endLiveRide(id);
      await realtimeService.broadcastRideStatus(id, 'completed');
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="desktop-wrapper" style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Radio size={36} className="pulse-radar" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--primary)' }} />
        <span>Loading tour route and squad roster...</span>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="desktop-wrapper" style={{ padding: '64px 16px', textAlign: 'center' }}>
        <Compass size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Ride Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          This tour might have been cancelled or the ID is invalid.
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isLive = ride.status === 'active';
  const waypoints = ride.checkpoints || [];
  const participants = ride.participants || [];
  const pendingParticipants = participants.filter((p) => p.status === 'pending');
  const approvedParticipants = participants.filter((p) => p.status === 'approved');

  return (
    <div className="desktop-wrapper" style={{ maxWidth: '820px', padding: '20px 16px calc(84px + var(--sab))', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="rx-btn rx-btn-secondary"
          style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.82rem' }}
        >
          <ArrowLeft size={15} />
          <span>All Rides</span>
        </button>

        {isApprovedParticipant && (
          <button
            onClick={() => navigate(`/rides/live/${ride.id}`)}
            className={isLive ? "rx-btn rx-btn-cyan" : "rx-btn rx-btn-primary"}
            style={{ minHeight: '38px', padding: '6px 16px', fontSize: '0.85rem' }}
          >
            <Radio size={16} className={isLive ? "pulse-radar" : ""} />
            <span>{isLive ? 'Enter Live Cockpit' : 'Enter Squad Lobby'}</span>
          </button>
        )}
      </div>

      {feedbackMsg && (
        <div style={{ background: 'rgba(0, 229, 255, 0.15)', border: '1px solid var(--border-cyan)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>
          {feedbackMsg}
        </div>
      )}

      {/* Hero Header & Unique Ride ID */}
      <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${isLive ? 'badge-live' : 'badge-upcoming'}`}>
                {ride.status.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {ride.difficulty} • {ride.rideType}
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{ride.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              {ride.description}
            </p>
          </div>

          {/* Unique Ride ID Share Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-cyan)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              SQUAD RIDE ID
            </span>
            <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cyan)', letterSpacing: '0.05em' }}>
              {ride.joinCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="btn btn-secondary"
              style={{ minHeight: '30px', padding: '4px 10px', fontSize: '0.75rem', width: '100%' }}
            >
              {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              <span>{copied ? 'Copied ID!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            padding: '12px',
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            fontSize: '0.8rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Distance</span>
            <span className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
              {ride.distanceKm} km
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Date</span>
            <span style={{ fontWeight: 600, color: '#FFF' }}>{ride.rideDate}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Briefing</span>
            <span style={{ fontWeight: 600, color: '#FFF' }}>{ride.meetupTime}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Squad</span>
            <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>
              {approvedParticipants.length}/{ride.maxRiders}
            </span>
          </div>
        </div>

        {/* Organizer Host Actions */}
        {isOrganizer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
              Road Captain Controls:
            </span>
            {!isLive ? (
              <button
                onClick={handleStartRide}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <Play size={14} fill="#FFF" />
                <span>Start Live Tour</span>
              </button>
            ) : (
              <button
                onClick={handleEndRide}
                disabled={actionLoading}
                className="btn btn-danger"
                style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <span>Conclude Tour</span>
              </button>
            )}

            <button
              onClick={() => navigate(`/safety/${ride.id}`)}
              className="btn btn-secondary"
              style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              <ShieldAlert size={14} color="var(--gold)" />
              <span>Safety Center</span>
            </button>
          </div>
        )}
      </div>

      {/* Map Preview */}
      <div className="card-glass" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Route & Sequential Checkpoints</h3>
        <LeafletMap
          start={{ name: ride.startLocationName, latitude: ride.startLatitude, longitude: ride.startLongitude }}
          destination={{ name: ride.destinationName, latitude: ride.destinationLatitude, longitude: ride.destinationLongitude }}
          waypoints={waypoints}
          routeCoordinates={routeCoordinates}
          height="320px"
        />
      </div>

      {/* Persistent Waypoints List */}
      <div className="card-glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Intermediate Stops ({waypoints.length})</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Strict sequential order preserved
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Start Point */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--success)', color: '#080A0F', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              A
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{ride.startLocationName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Origin Rendezvous • Kickstands up {ride.departureTime}</div>
            </div>
          </div>

          {/* Sequential Waypoints */}
          {waypoints.map((wp, idx) => (
            <div
              key={wp.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#FFB020', color: '#080A0F', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{wp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {wp.type} • {wp.estimatedStopMinutes}m stop
                  </div>
                </div>
              </div>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)}
              </span>
            </div>
          ))}

          {/* Destination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--danger)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              B
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{ride.destinationName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Destination Point</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval Requests (Organizer View) */}
      {isOrganizer && pendingParticipants.length > 0 && (
        <div className="card-glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--gold)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold)' }}>
              Pending Join Requests ({pendingParticipants.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingParticipants.map((part) => (
              <div
                key={part.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={part.user?.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80'}
                    alt="avatar"
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{part.user?.fullName || 'Rider'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{part.user?.username || 'rider'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApprove(part.userId)}
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.8rem' }}
                  >
                    <CheckCircle size={14} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(part.userId)}
                    disabled={actionLoading}
                    className="btn btn-secondary"
                    style={{ minHeight: '32px', padding: '4px 10px', fontSize: '0.8rem', color: 'var(--danger)' }}
                  >
                    <XCircle size={14} />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Squad Participant Roster */}
      <div className="card-glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Squad Members ({approvedParticipants.length}/{ride.maxRiders})
          </h3>

          {!isApprovedParticipant && !isPendingParticipant && (
            <button
              onClick={handleJoinRequest}
              disabled={actionLoading}
              className="btn btn-primary"
              style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              Request to Join Squad
            </button>
          )}

          {isPendingParticipant && (
            <span className="badge badge-upcoming">
              <span>AWAITING APPROVAL</span>
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {approvedParticipants.map((part) => {
            const isRoadCaptain = part.role === 'organizer' || part.userId === ride.organizerId;
            return (
              <div
                key={part.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: isRoadCaptain ? '1px solid rgba(255, 176, 32, 0.4)' : '1px solid var(--border-subtle)',
                }}
              >
                <img
                  src={part.user?.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80'}
                  alt="avatar"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {part.user?.fullName || 'Squad Rider'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isRoadCaptain ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {isRoadCaptain ? '★ ROAD CAPTAIN' : 'RIDER'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
