/**
 * RIDEX Web — Rider Dashboard & Tour Directory
 * Lists upcoming motorcycle group rides, filters by membership, and shows active status.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { useAuthStore } from '../stores/useAuthStore';
import { Compass, Calendar, MapPin, Users, Plus, Radio, ArrowRight, Shield, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'hosted' | 'joined'>('all');

  const { data: rides = [], isLoading, refetch } = useQuery({
    queryKey: ['rides'],
    queryFn: () => rideService.getRides(),
  });

  const filteredRides = rides.filter((ride) => {
    if (filter === 'hosted') return ride.organizerId === user?.id;
    if (filter === 'joined') return ride.participants?.some((p) => p.userId === user?.id && p.status === 'approved');
    return true;
  });

  return (
    <div className="desktop-wrapper" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Motorcycle Tours</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Discover group rides, join squads, or plan your next mountain journey.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/connect')}
            className="btn btn-secondary"
            style={{ minHeight: '42px', padding: '8px 16px', fontSize: '0.9rem', borderColor: 'var(--border-cyan)' }}
          >
            <Radio size={16} color="var(--cyan)" />
            <span>Join by Code</span>
          </button>
          <button
            onClick={() => navigate('/host')}
            className="btn btn-primary"
            style={{ minHeight: '42px', padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <Plus size={16} />
            <span>Host Tour</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? 'var(--primary)' : 'transparent',
            color: filter === 'all' ? '#FFF' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          All Tours ({rides.length})
        </button>

        {user && (
          <>
            <button
              onClick={() => setFilter('hosted')}
              style={{
                background: filter === 'hosted' ? 'var(--primary)' : 'transparent',
                color: filter === 'hosted' ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              My Hosted Tours
            </button>
            <button
              onClick={() => setFilter('joined')}
              style={{
                background: filter === 'joined' ? 'var(--primary)' : 'transparent',
                color: filter === 'joined' ? '#FFF' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              Joined Squads
            </button>
          </>
        )}
      </div>

      {/* Rides List */}
      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Radio size={32} className="pulse-radar" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--primary)' }} />
          <span>Scanning for group rides...</span>
        </div>
      ) : filteredRides.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Compass size={40} color="var(--primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No tours found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px' }}>
            Be the first to create an adventure tour or enter a squad Ride ID from another Road Captain.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <Link to="/host" className="btn btn-primary">
              Host a Ride
            </Link>
            <Link to="/connect" className="btn btn-secondary">
              Connect Ride ID
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredRides.map((ride) => {
            const isHost = ride.organizerId === user?.id;
            const isLive = ride.status === 'active';

            return (
              <div
                key={ride.id}
                onClick={() => navigate(`/rides/${ride.id}`)}
                className="card-glass card-interactive"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: isLive ? '1px solid var(--border-cyan)' : '1px solid var(--border-card)',
                }}
              >
                {/* Header: Title & Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.2 }}>{ride.title}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Hosted by {ride.organizer?.fullName || 'Road Captain'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {isLive ? (
                      <span className="badge badge-live">
                        <Radio size={12} className="pulse-radar" />
                        <span>LIVE NOW</span>
                      </span>
                    ) : (
                      <span className="badge badge-upcoming">
                        <span>{ride.status.toUpperCase()}</span>
                      </span>
                    )}
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700 }}>
                      {ride.joinCode}
                    </span>
                  </div>
                </div>

                {/* Route Endpoints */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                    <span>{ride.startLocationName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></div>
                    <span>{ride.destinationName}</span>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Distance</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {ride.distanceKm} km
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Date</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ride.rideDate}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Squad</span>
                    <span style={{ fontWeight: 600, color: 'var(--cyan)' }}>
                      {ride.currentParticipantCount || 1}/{ride.maxRiders}
                    </span>
                  </div>
                </div>

                {/* Footer link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Departure: {ride.departureTime}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>View Ride</span>
                    <ArrowRight size={14} />
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
