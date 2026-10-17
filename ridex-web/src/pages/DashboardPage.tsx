/**
 * RIDEX Web — Command Center Dashboard
 * Recreates the 3-column dark adventure-touring command center specification:
 * - Left persistent sidebar (~208px): Official RIDEX logo, brand tagline, route list, promo card
 * - Central command area: Hero header ("Welcome back, {User} 👋"), 4 metric cards,
 *   My Motorcycle card (with no-bike Explorer Pass fallback), Live Ride Map panel,
 *   Quick Actions grid, and Recent Rides expedition feed
 * - Right information rail (~340px): Upcoming Rides, Host Join Requests with approve/reject mutations,
 *   Rider Community, and scenic promo banner
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { garageService } from '../services/garageService';
import { useAuthStore } from '../stores/useAuthStore';
import { useActiveRideStore } from '../stores/useActiveRideStore';
import { Sidebar } from '../components/layout/Sidebar';
import { RightRail } from '../components/dashboard/RightRail';
import { LeafletMap } from '../components/maps/LeafletMap';
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
  Calendar,
  Clock,
  Warehouse,
  QrCode,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { isTracking, activeRideId, myLocation, peerLocations } = useActiveRideStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab filter from URL query or state
  const tabParam = searchParams.get('tab') as 'all' | 'hosted' | 'joined' | null;
  const [filter, setFilter] = useState<'all' | 'hosted' | 'joined'>(tabParam || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch group rides
  const { data: rides = [], isLoading: isLoadingRides } = useQuery({
    queryKey: ['rides'],
    queryFn: () => rideService.getRides(),
  });

  // 2. Fetch motorcycles for authenticated rider
  const { data: motorcycles = [] } = useQuery({
    queryKey: ['motorcycles', user?.id],
    queryFn: () => (user?.id ? garageService.getMotorcycles(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  // Check persistent "I don't have a bike" selection
  const storedNoBike = typeof window !== 'undefined' && localStorage.getItem('ridex_no_bike') === 'true';
  const primaryBike = motorcycles.find((b) => b.isPrimary) || motorcycles[0] || null;

  // 3. Derived Metrics (Real backend values only)
  const userRides = useMemo(() => {
    if (!user) return [];
    return rides.filter(
      (r) =>
        r.organizerId === user.id ||
        r.participants?.some((p) => p.userId === user.id && p.status === 'approved')
    );
  }, [rides, user]);

  const userRidesCount = userRides.length;

  const totalDistanceKm = useMemo(() => {
    return userRides.reduce((acc, r) => acc + (r.distanceKm || 0), 0);
  }, [userRides]);

  const ridingBuddiesCount = useMemo(() => {
    const buddies = new Set<string>();
    rides.forEach((r) => {
      r.participants?.forEach((p) => {
        if (p.userId && p.userId !== user?.id && p.status === 'approved') {
          buddies.add(p.userId);
        }
      });
      if (r.organizerId && r.organizerId !== user?.id) {
        buddies.add(r.organizerId);
      }
    });
    return buddies.size;
  }, [rides, user]);

  const completedMilestonesCount = useMemo(() => {
    return rides.filter((r) => r.status === 'completed').length;
  }, [rides]);

  // 4. Active Ride / Standby Map Coordinates
  const activeRide = useMemo(() => {
    if (activeRideId) {
      return rides.find((r) => r.id === activeRideId) || null;
    }
    return rides.find((r) => r.status === 'active') || null;
  }, [rides, activeRideId]);

  const mapStartCoord = useMemo(() => {
    if (activeRide) {
      return { latitude: activeRide.startLatitude, longitude: activeRide.startLongitude, name: activeRide.startLocationName };
    }
    if (rides.length > 0) {
      return { latitude: rides[0].startLatitude, longitude: rides[0].startLongitude, name: rides[0].startLocationName };
    }
    return { latitude: 18.5204, longitude: 73.8567, name: 'Western Ghats / Pune' };
  }, [activeRide, rides]);

  const mapDestCoord = useMemo(() => {
    if (activeRide) {
      return { latitude: activeRide.destinationLatitude, longitude: activeRide.destinationLongitude, name: activeRide.destinationName };
    }
    if (rides.length > 0) {
      return { latitude: rides[0].destinationLatitude, longitude: rides[0].destinationLongitude, name: rides[0].destinationName };
    }
    return { latitude: 18.7557, longitude: 73.4091, name: 'Lonavala Summit' };
  }, [activeRide, rides]);

  const activeRiderLocations = useMemo(() => {
    const locs = [];
    if (myLocation) locs.push(myLocation);
    Object.values(peerLocations).forEach((loc) => locs.push(loc));
    return locs;
  }, [myLocation, peerLocations]);

  // 5. Filtered Rides Feed
  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      if (filter === 'hosted' && ride.organizerId !== user?.id) return false;
      if (
        filter === 'joined' &&
        !ride.participants?.some((p) => p.userId === user?.id && p.status === 'approved')
      ) {
        return false;
      }

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
  }, [rides, filter, searchQuery, user]);

  return (
    <div className="command-center-container">
      <div className="command-center-layout">
        {/* ================================================================= */}
        {/* COLUMN 1: LEFT SIDEBAR (~208px desktop persistent)                */}
        {/* ================================================================= */}
        <Sidebar />

        {/* ================================================================= */}
        {/* COLUMN 2: CENTRAL COMMAND AREA (Fluid)                            */}
        {/* ================================================================= */}
        <main className="ridex-central-content">
          {/* 1. WELCOME HERO HEADER */}
          <div className="hero-header-card">
            <img
              src="/hero-adventure.jpg"
              alt="RIDEX Motorcycle Adventure Sunset"
              className="hero-backdrop-img"
              onError={(e) => {
                // Graceful fallback to dark gradient if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="hero-gradient-overlay" />

            <div className="hero-content">
              <div>
                <h1 className="hero-title">
                  Welcome back, {user?.fullName || 'Rider'} 👋
                </h1>
                <p className="hero-subtitle">
                  Ready for your next ride? Discover squad tours or track live on radar.
                </p>
              </div>

              {/* Top Right Quick Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {isTracking && activeRideId ? (
                  <button
                    onClick={() => navigate(`/rides/live/${activeRideId}`)}
                    className="badge badge-live card-interactive"
                    style={{ padding: '8px 14px', fontSize: '0.82rem', border: 'none' }}
                  >
                    <Radio size={14} className="pulse-radar" />
                    <span>RADAR ACTIVE</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/connect')}
                    className="btn btn-secondary"
                    style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.84rem' }}
                  >
                    <QrCode size={15} color="var(--cyan)" />
                    <span>Join with Code</span>
                  </button>
                )}

                <button
                  onClick={() => navigate('/host')}
                  className="btn btn-primary"
                  style={{ minHeight: '38px', padding: '6px 16px', fontSize: '0.84rem' }}
                >
                  <Plus size={15} />
                  <span>Host Ride</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. SUMMARY METRIC CARDS (4 Compact Tiles) */}
          <section className="metric-cards-grid">
            {/* Card 1: Total Rides */}
            <div
              className="metric-card card-interactive"
              onClick={() => {
                setFilter('joined');
                setSearchParams({ tab: 'joined' });
              }}
              title="Filter to my rides"
            >
              <div
                className="metric-icon-box"
                style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--primary)' }}
              >
                <Compass size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="metric-value">{userRidesCount}</div>
                <div className="metric-label">Total Rides</div>
              </div>
              <ArrowUpRight size={14} color="var(--text-muted)" style={{ opacity: 0.6 }} />
            </div>

            {/* Card 2: Total Distance */}
            <div className="metric-card">
              <div
                className="metric-icon-box"
                style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--cyan)' }}
              >
                <Navigation size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="metric-value">
                  {totalDistanceKm > 0 ? `${totalDistanceKm.toLocaleString()}` : '0'}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyan)', marginLeft: '3px' }}>km</span>
                </div>
                <div className="metric-label">Total Distance</div>
              </div>
            </div>

            {/* Card 3: Riding Buddies */}
            <div className="metric-card">
              <div
                className="metric-icon-box"
                style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--success)' }}
              >
                <Users size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="metric-value">{ridingBuddiesCount}</div>
                <div className="metric-label">Riding Buddies</div>
              </div>
            </div>

            {/* Card 4: Milestones / Memories */}
            <div className="metric-card">
              <div
                className="metric-icon-box"
                style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}
              >
                <Sparkles size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="metric-value">
                  {completedMilestonesCount > 0 ? completedMilestonesCount : (rides.length > 0 ? rides.length : '0')}
                </div>
                <div className="metric-label">Tour Milestones</div>
              </div>
            </div>
          </section>

          {/* 3. MOTORCYCLE GARAGE CARD (With No-Bike Explorer Mode) */}
          <section className="garage-dashboard-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>My Motorcycle</h3>
              </div>
              <button
                onClick={() => navigate('/garage')}
                className="rail-link-btn"
                style={{ fontSize: '0.8rem' }}
              >
                <span>View Garage</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {primaryBike ? (
              /* Rider has a saved motorcycle */
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={primaryBike.imageUrl}
                      alt={`${primaryBike.manufacturer} ${primaryBike.model}`}
                      style={{
                        width: '64px',
                        height: '46px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'rgba(0,0,0,0.4)',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem' }}>
                          {primaryBike.manufacturer} {primaryBike.model}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: 'rgba(255, 107, 0, 0.15)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            border: '1px solid var(--border-active)',
                          }}
                        >
                          PRIMARY FLEET
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {primaryBike.year} Model • {primaryBike.color} • Registered with Telemetry
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/garage')}
                    className="btn btn-secondary"
                    style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.8rem' }}
                  >
                    Edit Machine
                  </button>
                </div>

                {/* Telemetry Specs Grid */}
                <div className="garage-specs-grid">
                  <div className="spec-tile">
                    <div className="spec-tile-label">Displacement</div>
                    <div className="spec-tile-value">
                      {primaryBike.engineCc || primaryBike.displacementCc || 400} cc
                    </div>
                  </div>
                  <div className="spec-tile">
                    <div className="spec-tile-label">Fuel Tank</div>
                    <div className="spec-tile-value">
                      {primaryBike.fuelTankCapacityL || 15} L
                    </div>
                  </div>
                  <div className="spec-tile">
                    <div className="spec-tile-label">Avg Mileage</div>
                    <div className="spec-tile-value">
                      {primaryBike.avgMileageKmpl || 28} km/l
                    </div>
                  </div>
                  <div className="spec-tile">
                    <div className="spec-tile-label">Estimated Range</div>
                    <div className="spec-tile-value" style={{ color: 'var(--cyan)' }}>
                      ~{Math.round((primaryBike.fuelTankCapacityL || 15) * (primaryBike.avgMileageKmpl || 28))} km
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Rider selected "I don't have a bike" or has not added one */
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255, 107, 0, 0.05)',
                  border: '1px dashed rgba(255, 107, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 229, 255, 0.15)', color: 'var(--cyan)', fontWeight: 700 }}>
                      EXPLORER PASS ACTIVE
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '6px' }}>
                    Your next adventure starts here.
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '480px' }}>
                    You are riding in Explorer Mode. You can host group tours, join squads with a Ride ID, or register your motorcycle whenever you're ready.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/garage?add=true')}
                    className="btn btn-primary"
                    style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.84rem' }}
                  >
                    <Plus size={15} />
                    <span>Add Motorcycle</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilter('all');
                      setSearchParams({ tab: 'all' });
                    }}
                    className="btn btn-secondary"
                    style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.84rem' }}
                  >
                    Explore Rides
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 4. LIVE RIDE MAP PANEL (OpenStreetMap Dark Mode, Zero Watermark) */}
          <section className="live-map-card">
            <div className="live-map-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Navigation size={18} color="var(--primary)" />
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Live Ride Radar</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {activeRide ? activeRide.title : 'Standby Tactical Map'}
                  </span>
                </div>
              </div>

              {isTracking && activeRideId ? (
                <span className="badge badge-live">
                  <Radio size={12} className="pulse-radar" />
                  <span>RADAR ACTIVE</span>
                </span>
              ) : (
                <span
                  className="badge"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Radio size={12} />
                  <span>RADAR STANDBY</span>
                </span>
              )}
            </div>

            {/* Map Container */}
            <div style={{ height: '320px', width: '100%', position: 'relative' }}>
              <LeafletMap
                start={mapStartCoord}
                destination={mapDestCoord}
                riderLocations={activeRiderLocations}
                currentUserId={user?.id}
                height="320px"
                interactive={true}
              />
            </div>

            {/* Map Telemetry Footer */}
            <div className="live-map-footer">
              {isTracking && activeRideId ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Speed
                      </span>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--cyan)' }}>
                        {myLocation?.speedKmh ? `${Math.round(myLocation.speedKmh)} km/h` : '0 km/h'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Squad on Radar
                      </span>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                        {activeRiderLocations.length} Riders
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/rides/live/${activeRideId}`)}
                    className="btn btn-primary"
                    style={{ minHeight: '34px', padding: '4px 14px', fontSize: '0.8rem' }}
                  >
                    <span>Full Live Cockpit</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Standby Mode — No active ride in progress. Host a tour or join with code to activate radar.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/connect')}
                      className="btn btn-secondary"
                      style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
                    >
                      Connect Ride
                    </button>
                    <button
                      onClick={() => navigate('/host')}
                      className="btn btn-primary"
                      style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
                    >
                      Host Ride
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 5. QUICK ACTIONS (4 Prominent Cards) */}
          <section>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
              Quick Actions
            </h3>
            <div className="quick-actions-grid">
              {/* Action 1: Host Ride */}
              <div
                onClick={() => navigate('/host')}
                className="quick-action-card card-interactive"
              >
                <div
                  className="action-icon-tile"
                  style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--primary)' }}
                >
                  <Plus size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="action-title">Host Ride</div>
                  <div className="action-subtitle">Create a new tour</div>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>

              {/* Action 2: Connect Ride */}
              <div
                onClick={() => navigate('/connect')}
                className="quick-action-card card-interactive"
              >
                <div
                  className="action-icon-tile"
                  style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--cyan)' }}
                >
                  <QrCode size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="action-title">Connect Ride</div>
                  <div className="action-subtitle">Join with Ride ID</div>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>

              {/* Action 3: Plan Route */}
              <div
                onClick={() => navigate('/host')}
                className="quick-action-card card-interactive"
              >
                <div
                  className="action-icon-tile"
                  style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--success)' }}
                >
                  <MapPin size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="action-title">Plan Route</div>
                  <div className="action-subtitle">Waypoints & stops</div>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>

              {/* Action 4: View Community */}
              <div
                onClick={() => {
                  setFilter('all');
                  setSearchParams({ tab: 'community' });
                }}
                className="quick-action-card card-interactive"
              >
                <div
                  className="action-icon-tile"
                  style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}
                >
                  <Users size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="action-title">View Community</div>
                  <div className="action-subtitle">Discover riders</div>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
            </div>
          </section>

          {/* 6. RECENT RIDES / EXPEDITION DIRECTORY */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Squad Expeditions</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Discover upcoming group tours or manage your hosted rides
                </span>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(18, 23, 34, 0.8)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchParams({});
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: filter === 'all' ? 700 : 500,
                    border: 'none',
                    background: filter === 'all' ? 'var(--primary)' : 'transparent',
                    color: filter === 'all' ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  All ({rides.length})
                </button>
                <button
                  onClick={() => {
                    setFilter('hosted');
                    setSearchParams({ tab: 'hosted' });
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: filter === 'hosted' ? 700 : 500,
                    border: 'none',
                    background: filter === 'hosted' ? 'var(--primary)' : 'transparent',
                    color: filter === 'hosted' ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Hosted
                </button>
                <button
                  onClick={() => {
                    setFilter('joined');
                    setSearchParams({ tab: 'joined' });
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: filter === 'joined' ? 700 : 500,
                    border: 'none',
                    background: filter === 'joined' ? 'var(--primary)' : 'transparent',
                    color: filter === 'joined' ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Joined
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search expeditions by title, destination, or Ride ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px', minHeight: '44px', fontSize: '0.88rem' }}
              />
            </div>

            {/* Rides Grid */}
            {isLoadingRides ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading expeditions...
              </div>
            ) : filteredRides.length === 0 ? (
              <div
                className="card-glass"
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Compass size={36} color="var(--text-muted)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>No Expeditions Found</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  {searchQuery
                    ? `No tours matched "${searchQuery}". Try a different keyword.`
                    : filter === 'hosted'
                    ? "You haven't hosted any rides yet. Create your first squad tour!"
                    : "No rides in this view. Discover all expeditions or host your own."}
                </p>
                <button
                  onClick={() => navigate('/host')}
                  className="btn btn-primary"
                  style={{ minHeight: '38px', padding: '6px 16px', fontSize: '0.84rem' }}
                >
                  <Plus size={15} />
                  <span>Host New Tour</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {filteredRides.map((ride) => {
                  const isHost = ride.organizerId === user?.id;
                  const isApproved = ride.participants?.some(
                    (p) => p.userId === user?.id && p.status === 'approved'
                  );

                  return (
                    <div
                      key={ride.id}
                      className="card-glass card-interactive"
                      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                      onClick={() => navigate(`/rides/${ride.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background:
                              ride.status === 'active'
                                ? 'rgba(0, 229, 255, 0.15)'
                                : 'rgba(255, 107, 0, 0.15)',
                            color: ride.status === 'active' ? 'var(--cyan)' : 'var(--primary)',
                            border: `1px solid ${
                              ride.status === 'active' ? 'var(--border-cyan)' : 'var(--border-active)'
                            }`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {ride.status === 'active' ? 'LIVE TRACKING' : `${ride.difficulty} • ${ride.rideType}`}
                        </span>

                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                          {ride.joinCode}
                        </span>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                          {ride.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <MapPin size={13} color="var(--primary)" />
                          <span>{ride.startLocationName}</span>
                          <span>→</span>
                          <span>{ride.destinationName}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} />
                            {ride.rideDate}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} />
                            {ride.departureTime}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ride.distanceKm} km
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {ride.participants?.length || 0} / {ride.maxRiders} riders
                          </span>
                          {isHost && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 107, 0, 0.2)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              HOST
                            </span>
                          )}
                          {isApproved && !isHost && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(0, 230, 118, 0.2)', color: 'var(--success)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              JOINED
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.78rem', color: 'var(--cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>Details</span>
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* ================================================================= */}
        {/* COLUMN 3: RIGHT INFORMATION RAIL (~340px desktop)                 */}
        {/* ================================================================= */}
        <RightRail
          currentUser={user}
          rides={rides}
          onSelectFilter={(f) => {
            setFilter(f);
            setSearchParams({ tab: f });
          }}
        />
      </div>
    </div>
  );
};
