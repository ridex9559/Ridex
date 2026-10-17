/**
 * RIDEX Web — Unified Ride Participant Roster Component
 * Shared across Ride Details, Lobby, Live Radar, and Safety Center.
 * Displays rider avatar, callsign, role badges, approval status, and host action buttons.
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  Radio,
  Clock,
  Compass,
} from 'lucide-react';
import { RideParticipant } from '../../types';
import { rideService } from '../../services/rideService';

interface ParticipantRosterProps {
  rideId: string;
  participants: RideParticipant[];
  isHost: boolean;
  currentUserId?: string;
}

export const ParticipantRoster: React.FC<ParticipantRosterProps> = ({
  rideId,
  participants,
  isHost,
  currentUserId,
}) => {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return rideService.approveParticipant(rideId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return rideService.rejectParticipant(rideId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
    },
  });

  const approved = participants.filter((p) => p.status === 'approved');
  const pending = participants.filter((p) => p.status === 'pending');

  return (
    <div className="card-glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--primary)" />
          <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Squad Roster</h4>
        </div>

        <span
          className="badge"
          style={{
            background: 'rgba(0, 229, 255, 0.15)',
            color: 'var(--cyan)',
            border: '1px solid var(--border-cyan)',
          }}
        >
          {approved.length} Confirmed Riders
        </span>
      </div>

      {/* Pending Approvals (Visible to Host) */}
      {isHost && pending.length > 0 && (
        <div style={{ background: 'rgba(255, 107, 0, 0.08)', border: '1px solid var(--border-active)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800 }}>
              Pending Join Requests ({pending.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(18, 23, 34, 0.8)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={p.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                    alt={p.user?.fullName || 'Rider'}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#FFFFFF' }}>{p.user?.fullName || 'Rider'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.user?.city || 'Pune'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => approveMutation.mutate(p.userId)}
                    disabled={approveMutation.isPending}
                    className="btn btn-primary"
                    style={{ minHeight: '30px', padding: '2px 10px', fontSize: '0.74rem' }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(p.userId)}
                    disabled={rejectMutation.isPending}
                    className="btn btn-secondary"
                    style={{ minHeight: '30px', padding: '2px 8px', fontSize: '0.74rem' }}
                  >
                    <XCircle size={13} color="var(--danger)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Participants List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {approved.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No other riders confirmed yet. Share your Ride ID with fellow motorcyclists to build your squad!
          </div>
        ) : (
          approved.map((p) => {
            const isMe = p.userId === currentUserId;

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isMe ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: isMe ? '1px solid var(--border-cyan)' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={p.user?.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&q=80'}
                    alt={p.user?.fullName || 'Rider'}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#FFFFFF' }}>
                        {p.user?.fullName || 'Rider'}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: '0.62rem', background: 'rgba(0, 229, 255, 0.2)', color: 'var(--cyan)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {p.user?.city || 'Touring Rider'} • Joined {new Date(p.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: p.role === 'organizer' ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                      color: p.role === 'organizer' ? 'var(--primary)' : 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.role}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
