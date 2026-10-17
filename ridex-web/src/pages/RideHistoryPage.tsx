/**
 * RIDEX Web — Ride History & Verified Touring Logbook
 * Lists completed, ongoing, and hosted motorcycle expeditions with authentic metrics.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { rideService } from '../services/rideService';
import { RideEvent } from '../types';
import {
  History,
  Compass,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Shield,
  Loader2,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  Plus,
} from 'lucide-react';

export const RideHistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [rides, setRides] = useState<RideEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'hosted'>('all');

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await rideService.getUserRides(user.id);
        setRides(data);
      } catch (e) {
        console.error('Failed to load user ride history:', e);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  const filteredRides = rides.filter((r) => {
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'active') return r.status === 'in_progress' || r.status === 'published';
    if (filter === 'hosted') return r.organizerId === user?.id;
    return true;
  });

  // Calculate genuine statistics
  const totalKm = rides.reduce((acc, r) => acc + (r.distanceKm || 0), 0);
  const completedCount = rides.filter((r) => r.status === 'completed').length;
  const hostedCount = rides.filter((r) => r.organizerId === user?.id).length;

  return (
    <div className="community-wrapper">
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/community')}
            className="btn btn-secondary"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} />
            <span>Community</span>
          </button>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="var(--primary)" />
              Touring History Logbook
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Verified records of your motorcycle expeditions and mountain passes.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/host')}
          className="btn btn-primary"
          style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.82rem' }}
        >
          <Plus size={14} />
          <span>Plan Tour</span>
        </button>
      </div>

      {/* Verified Stat Counters (4 Tiles) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div className="profile-stat-box">
          <div className="profile-stat-label">Total Distance</div>
          <div className="profile-stat-value" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>
            {Math.round(totalKm)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>KM</span>
          </div>
        </div>

        <div className="profile-stat-box">
          <div className="profile-stat-label">Total Tours</div>
          <div className="profile-stat-value" style={{ fontSize: '1.4rem' }}>
            {rides.length}
          </div>
        </div>

        <div className="profile-stat-box">
          <div className="profile-stat-label">Completed</div>
          <div className="profile-stat-value" style={{ color: 'var(--success)', fontSize: '1.4rem' }}>
            {completedCount}
          </div>
        </div>

        <div className="profile-stat-box">
          <div className="profile-stat-label">Road Captain</div>
          <div className="profile-stat-value" style={{ color: 'var(--cyan)', fontSize: '1.4rem' }}>
            {hostedCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', overflowX: 'auto' }}>
        <button
          onClick={() => setFilter('all')}
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
        >
          All Tours ({rides.length})
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
        >
          Completed ({completedCount})
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
        >
          Active / Scheduled
        </button>

        <button
          onClick={() => setFilter('hosted')}
          className={`btn ${filter === 'hosted' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
        >
          Hosted as Captain ({hostedCount})
        </button>
      </div>

      {/* Rides List */}
      {loading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="pulse-radar" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <p style={{ fontSize: '0.84rem' }}>Loading touring logbook...</p>
        </div>
      ) : filteredRides.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Compass size={36} color="var(--text-muted)" />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>No Expeditions Found</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
            No motorcycle tours matching this category were found in your touring history.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Explore Active Rides
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRides.map((ride) => {
            const isHost = ride.organizerId === user?.id;
            const isCompleted = ride.status === 'completed';
            const isActive = ride.status === 'in_progress';

            return (
              <div
                key={ride.id}
                onClick={() => navigate(`/rides/${ride.id}`)}
                className="card-glass card-interactive"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      className="badge"
                      style={{
                        background: isCompleted ? 'rgba(0, 230, 118, 0.15)' : isActive ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: isCompleted ? 'var(--success)' : isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                        border: isCompleted ? '1px solid var(--success)' : isActive ? '1px solid var(--border-cyan)' : '1px solid var(--border-subtle)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      {isCompleted ? 'COMPLETED' : isActive ? 'LIVE NOW' : ride.status.toUpperCase()}
                    </span>

                    {isHost && (
                      <span className="badge" style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                        <Shield size={11} />
                        CAPTAIN
                      </span>
                    )}

                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      #{ride.joinCode}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ride.title}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="var(--text-muted)" />
                      {ride.startLocationName}
                    </span>
                    <span>→</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{ride.destinationName}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {ride.rideDate}
                    </span>
                    <span>
                      Planned: <strong style={{ color: 'var(--primary)' }}>{ride.distanceKm} km</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', display: 'none' }} className="sm-block">
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      {ride.distanceKm} KM
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Logged Route</div>
                  </div>

                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
