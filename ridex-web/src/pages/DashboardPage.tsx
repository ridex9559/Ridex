/**
 * RIDEX Web — Rider Dashboard & Tour Directory
 * Lists upcoming motorcycle group rides, filters by membership, search discovery, and active status.
 * Styled with modern adventure cockpit surfaces, quick motorcycle fleet status, and responsive cards.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { garageService } from '../services/garageService';
import { useAuthStore } from '../stores/useAuthStore';
import {
  Compass,
  MapPin,
  Users,
  Plus,
  Radio,
  ArrowRight,
  Search,
  Bike,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'hosted' | 'joined'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch rides
  const { data: rides = [], isLoading } = useQuery({
    queryKey: ['rides'],
    queryFn: () => rideService.getRides(),
  });

  // 2. Fetch primary motorcycle for quick telemetry widget
  const { data: motorcycles = [] } = useQuery({
    queryKey: ['motorcycles', user?.id],
    queryFn: () => (user?.id ? garageService.getMotorcycles(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  const primaryBike = motorcycles.find((b) => b.isPrimary) || motorcycles[0];

  const filteredRides = rides.filter((ride) => {
    // Tab filter
    if (filter === 'hosted' && ride.organizerId !== user?.id) return false;
    if (
      filter === 'joined' &&
      !ride.participants?.some((p) => p.userId === user?.id && p.status === 'approved')
    )
      return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ride.title.toLowerCase().includes(q);
      const matchStart = ride.startLocationName.toLowerCase().includes(q);
      const matchDest = ride.destinationName.toLowerCase().includes(q);
      const matchCode = ride.joinCode.toLowerCase().includes(q);
      if (!matchTitle && !matchStart && !matchDest && !matchCode) return false;
    }

    return true;
  });

  return (
    <div
      className="desktop-wrapper"
      style={{
        padding: '24px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1100px',
      }}
    >
      {/* Top Banner / Hero Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Squad Tours</h1>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(0, 229, 255, 0.15)',
                color: 'var(--cyan)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {rides.length} Active
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Discover group rides, join squads with a Ride ID, or host your own tour.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/connect')}
            className="btn btn-secondary"
            style={{ minHeight: '42px', padding: '8px 16px', fontSize: '0.88rem', borderColor: 'var(--border-cyan)' }}
          >
            <Radio size={16} color="var(--cyan)" />
            <span>Join by Code</span>
          </button>
          <button
            onClick={() => navigate('/host')}
            className="btn btn-primary"
            style={{ minHeight: '42px', padding: '8px 18px', fontSize: '0.88rem' }}
          >
            <Plus size={16} />
            <span>Host Tour</span>
          </button>
        </div>
      </div>

      {/* Quick Rider Status Bar */}
      {user && (
        <div
          className="card-glass"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            border: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, rgba(26, 34, 52, 0.8) 0%, rgba(18, 23, 34, 0.95) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 107, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bike size={20} color="var(--primary)" />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Machine
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
                {primaryBike ? `${primaryBike.manufacturer} ${primaryBike.model}` : 'No Bike Selected (Explorer Mode)'}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/garage')}
            className="btn btn-secondary"
            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.8rem', gap: '6px' }}
          >
            <span>Manage Garage</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search tours by destination, title, or Ride ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '44px', minHeight: '46px' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? 'var(--primary)' : 'var(--bg-card)',
              color: filter === 'all' ? '#FFF' : 'var(--text-secondary)',
              border: filter === 'all' ? '1px solid var(--primary)' : '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
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
                  background: filter === 'hosted' ? 'var(--primary)' : 'var(--bg-card)',
                  color: filter === 'hosted' ? '#FFF' : 'var(--text-secondary)',
                  border: filter === 'hosted' ? '1px solid var(--primary)' : '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                }}
              >
                Hosted by Me
              </button>

              <button
                onClick={() => setFilter('joined')}
                style={{
                  background: filter === 'joined' ? 'var(--primary)' : 'var(--bg-card)',
                  color: filter === 'joined' ? '#FFF' : 'var(--text-secondary)',
                  border: filter === 'joined' ? '1px solid var(--primary)' : '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                }}
              >
                Joined Squads
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tours Grid */}
      {isLoading ? (
        <div className="card-glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Compass size={24} className="pulse-radar" color="var(--primary)" style={{ margin: '0 auto 10px' }} />
          <span>Scanning for active tours...</span>
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
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(255, 107, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={32} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>No Tours Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '380px' }}>
            {searchQuery
              ? `No tours matched "${searchQuery}". Try searching for another destination or Ride ID.`
              : 'There are no active tours in this view. Host a new ride and share the Ride ID with your squad!'}
          </p>
          <button onClick={() => navigate('/host')} className="btn btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={16} />
            <span>Host First Tour</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredRides.map((ride) => {
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
                  border: isLive ? '1.5px solid var(--border-cyan)' : '1px solid var(--border-card)',
                  cursor: 'pointer',
                }}
              >
                {/* Header: Title & Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, lineHeight: 1.25 }}>{ride.title}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Road Captain: {ride.organizer?.fullName || 'Captain'}
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
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 800 }}>
                      {ride.joinCode}
                    </span>
                  </div>
                </div>

                {/* Route Endpoints */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ride.startLocationName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ride.destinationName}
                    </span>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>DISTANCE</span>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>
                      {ride.distanceKm} km
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>DATE</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ride.rideDate}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>SQUAD</span>
                    <span style={{ fontWeight: 800, color: 'var(--cyan)' }}>
                      {ride.currentParticipantCount || 1}/{ride.maxRiders}
                    </span>
                  </div>
                </div>

                {/* Footer link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Departure: {ride.departureTime}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700 }}>
                    <span>Ride Details</span>
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

export default DashboardPage;
