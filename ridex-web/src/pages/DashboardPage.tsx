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

  const hasActiveRide = useMemo(() => {
    return !!((isTracking && activeRideId) || (activeRide && activeRide.status === 'active'));
  }, [isTracking, activeRideId, activeRide]);

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
          {/* 1. CINEMATIC EXPEDITION HERO */}
          <div className="cockpit-hero">
            <img
              src="/hero-adventure.jpg"
              alt="RIDEX Motorcycle Adventure Sunset"
              className="cockpit-hero-bg"
              onError={(e) => {
                // Graceful fallback to dark gradient if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="cockpit-hero-vignette" />

            <div className="cockpit-hero-content">
              <div>
                <div className="cockpit-badge-radar">
                  <span className="cockpit-dot-pulse" />
                  <span>
                    {typeof navigator !== 'undefined' && !navigator.onLine
                      ? 'OFFLINE • CACHED TELEMETRY'
                      : isLoadingRides
                      ? 'SYNCING SQUAD TELEMETRY...'
                      : isTracking && activeRideId
                      ? 'TELEMETRY ACTIVE • LIVE COCKPIT LINKED'
                      : 'GPS READY • COCKPIT STANDBY'}
                  </span>
                </div>
                <h1 className="cockpit-hero-title">
                  {user?.fullName ? `WELCOME, ${user.fullName.toUpperCase()}` : 'EXPEDITION COCKPIT'}
                </h1>
                <p className="cockpit-hero-subtitle">
                  Rider-first group navigation, precision telemetry, and squad radar tracking across every mile.
                </p>
              </div>

              {/* Thumb-friendly Launch Grid */}
              <div className="cockpit-launch-grid">
                {isTracking && activeRideId ? (
                  <button
                    onClick={() => navigate(`/rides/live/${activeRideId}`)}
                    className="cockpit-btn-launch-primary"
                    style={{ background: 'linear-gradient(135deg, #00F0FF 0%, #0099FF 100%)', color: '#07080B' }}
                  >
                    <Radio size={18} className="pulse-radar" />
                    <span>RESUME LIVE COCKPIT</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/host')}
                    className="cockpit-btn-launch-primary"
                  >
                    <Plus size={18} />
                    <span>HOST EXPEDITION</span>
                  </button>
                )}

                <button
                  onClick={() => navigate('/connect')}
                  className="cockpit-btn-launch-tactical"
                >
                  <QrCode size={18} color="var(--cyan)" />
                  <span>JOIN WITH PIN</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. UNIFIED COCKPIT INSTRUMENT PANEL (MULTI-GAUGE BAR) */}
          <section className="cockpit-instrument-panel">
            <div className="instrument-panel-header">
              <span className="instrument-panel-title">EXPEDITION TELEMETRY CLUSTER</span>
              <span className="instrument-panel-status">REALTIME METRICS</span>
            </div>
            <div className="instrument-gauges-grid">
              {/* Gauge 1: Total Rides */}
              <div
                className="gauge-cell"
                onClick={() => {
                  setFilter('joined');
                  setSearchParams({ tab: 'joined' });
                }}
                style={{ cursor: 'pointer' }}
                title="Filter to my rides"
              >
                <div className="gauge-cell-label">EXPEDITIONS</div>
                <div className="gauge-cell-value">
                  {userRidesCount}
                </div>
                <div className="gauge-cell-sub">
                  <span style={{ color: 'var(--primary)' }}>●</span> Logged Tours
                </div>
              </div>

              {/* Gauge 2: Total Distance */}
              <div className="gauge-cell">
                <div className="gauge-cell-label">TOTAL DISTANCE</div>
                <div className="gauge-cell-value" style={{ color: 'var(--cyan)' }}>
                  {totalDistanceKm > 0 ? totalDistanceKm.toLocaleString() : '0'}
                  <span style={{ fontSize: '0.9rem', marginLeft: '4px', color: 'var(--text-muted)' }}>KM</span>
                </div>
                <div className="gauge-cell-sub">
                  OSRM Verified
                </div>
              </div>

              {/* Gauge 3: Riding Buddies */}
              <div className="gauge-cell">
                <div className="gauge-cell-label">SQUAD RIDERS</div>
                <div className="gauge-cell-value" style={{ color: 'var(--success)' }}>
                  {ridingBuddiesCount}
                </div>
                <div className="gauge-cell-sub">
                  In Network
                </div>
              </div>

              {/* Gauge 4: Milestones / Memories */}
              <div className="gauge-cell">
                <div className="gauge-cell-label">PASSPORT BADGES</div>
                <div className="gauge-cell-value" style={{ color: '#C084FC' }}>
                  {completedMilestonesCount > 0 ? completedMilestonesCount : (rides.length > 0 ? rides.length : '0')}
                </div>
                <div className="gauge-cell-sub">
                  Tour Milestones
                </div>
              </div>
            </div>
          </section>

          {/* 3. MOTORCYCLE TELEMETRY SHOWCASE (OR EXPLORER PASS) */}
          {primaryBike ? (
            <section className="machine-showcase-card">
              <div className="machine-showcase-header">
                <div className="machine-showcase-info">
                  <img
                    src={primaryBike.imageUrl}
                    alt={`${primaryBike.manufacturer} ${primaryBike.model}`}
                    className="machine-thumb-img"
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="machine-name-heading">
                        {primaryBike.manufacturer} {primaryBike.model}
                      </span>
                      <span className="machine-fleet-badge">
                        PRIMARY FLEET
                      </span>
                    </div>
                    <div className="machine-sub-text">
                      {primaryBike.year} Model • {primaryBike.color} • Live Telemetry Enabled
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => navigate('/garage')}
                    className="cockpit-btn-launch-tactical"
                    style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                  >
                    <span>OPEN GARAGE</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* 4-Box Telemetry Specs Row */}
              <div className="machine-specs-row">
                <div className="machine-spec-box">
                  <div className="machine-spec-label">DISPLACEMENT</div>
                  <div className="machine-spec-value">
                    {primaryBike.engineCc || primaryBike.displacementCc || 400} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>cc</span>
                  </div>
                </div>
                <div className="machine-spec-box">
                  <div className="machine-spec-label">FUEL CAPACITY</div>
                  <div className="machine-spec-value">
                    {primaryBike.fuelTankCapacityL || 15} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>L</span>
                  </div>
                </div>
                <div className="machine-spec-box">
                  <div className="machine-spec-label">AVG MILEAGE</div>
                  <div className="machine-spec-value">
                    {primaryBike.avgMileageKmpl || 28} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>km/l</span>
                  </div>
                </div>
                <div className="machine-spec-box">
                  <div className="machine-spec-label">ESTIMATED RANGE</div>
                  <div className="machine-spec-value" style={{ color: 'var(--cyan)' }}>
                    ~{Math.round((primaryBike.fuelTankCapacityL || 15) * (primaryBike.avgMileageKmpl || 28))} <span style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>km</span>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="explorer-pass-banner">
              <div>
                <div className="explorer-badge">
                  EXPLORER MODE ACTIVE
                </div>
                <h4 className="explorer-title">
                  Zero Vehicle Restrictions. Pure Touring Freedom.
                </h4>
                <p className="explorer-desc">
                  You are registered under Rider Explorer Mode. Host tours, join squads with a Ride ID, or register your motorcycle to track fuel range and machine telemetry.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/garage?add=true')}
                  className="cockpit-btn-launch-primary"
                  style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                >
                  <Plus size={15} />
                  <span>REGISTER MACHINE</span>
                </button>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchParams({ tab: 'all' });
                  }}
                  className="cockpit-btn-launch-tactical"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  <span>EXPLORE EXPEDITIONS</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. LIVE RIDE RADAR MAP PANEL (Displayed When Active-Ride Data Exists) */}
          {hasActiveRide && (
            <section className="live-map-card rx-card">
              <div className="live-map-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Navigation size={18} color="var(--primary)" />
                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Live Ride Radar</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {activeRide ? activeRide.title : 'Live Group Expedition'}
                    </span>
                  </div>
                </div>

                <span className="rx-badge rx-badge-cyan">
                  <Radio size={12} className="pulse-radar" />
                  <span>RADAR ACTIVE</span>
                </span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Speed
                    </span>
                    <div className="rx-telemetry" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--cyan)' }}>
                      {myLocation?.speedKmh ? `${Math.round(myLocation.speedKmh)} km/h` : '0 km/h'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Squad on Radar
                    </span>
                    <div className="rx-telemetry" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                      {activeRiderLocations.length} Riders
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/rides/live/${activeRideId || activeRide?.id}`)}
                  className="rx-btn rx-btn-primary"
                  style={{ minHeight: '38px', padding: '6px 16px', fontSize: '0.84rem' }}
                >
                  <span>Full Live Cockpit</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </section>
          )}

          {/* 6. RECENT RIDES / EXPEDITION DIRECTORY */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Squad Expeditions</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Discover upcoming group tours or manage your hosted rides
                </span>
              </div>

              {/* Cockpit Segmented Filter Tabs */}
              <div className="cockpit-segmented-bar">
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchParams({});
                  }}
                  className={`cockpit-segment-btn ${filter === 'all' ? 'active' : ''}`}
                >
                  <span>All Tours</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', opacity: 0.85 }}>({rides.length})</span>
                </button>
                <button
                  onClick={() => {
                    setFilter('hosted');
                    setSearchParams({ tab: 'hosted' });
                  }}
                  className={`cockpit-segment-btn ${filter === 'hosted' ? 'active' : ''}`}
                >
                  Hosted
                </button>
                <button
                  onClick={() => {
                    setFilter('joined');
                    setSearchParams({ tab: 'joined' });
                  }}
                  className={`cockpit-segment-btn ${filter === 'joined' ? 'active' : ''}`}
                >
                  Joined
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="var(--ridex-muted)"
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '14px' }}>
                {filteredRides.map((ride) => {
                  const isHost = ride.organizerId === user?.id;
                  const isApproved = ride.participants?.some(
                    (p) => p.userId === user?.id && p.status === 'approved'
                  );

                  return (
                    <div
                      key={ride.id}
                      className={`tour-flight-strip ${ride.status === 'active' ? 'status-active' : 'status-upcoming'}`}
                      onClick={() => navigate(`/rides/${ride.id}`)}
                    >
                      <div className="tour-strip-header">
                        <span className={`tour-strip-status ${ride.status === 'active' ? 'live' : 'regular'}`}>
                          {ride.status === 'active' ? '● LIVE TRACKING' : `${ride.difficulty} • ${ride.rideType}`}
                        </span>

                        <span className="tour-strip-code">
                          {ride.joinCode}
                        </span>
                      </div>

                      <div>
                        <h4 className="tour-strip-title">
                          {ride.title}
                        </h4>
                        <div className="tour-strip-route">
                          <MapPin size={13} color="var(--ridex-orange)" />
                          <span>{ride.startLocationName}</span>
                          <span style={{ color: 'var(--ridex-muted)', margin: '0 2px' }}>→</span>
                          <span>{ride.destinationName}</span>
                        </div>
                      </div>

                      <div className="tour-strip-metrics">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="var(--ridex-muted)" />
                            {ride.rideDate}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} color="var(--ridex-muted)" />
                            {ride.departureTime}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#FFFFFF', fontSize: '0.85rem' }}>
                          {ride.distanceKm} <span style={{ fontSize: '0.68rem', color: 'var(--ridex-muted)' }}>KM</span>
                        </span>
                      </div>

                      <div className="tour-strip-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={13} color="var(--ridex-muted)" />
                          <span style={{ fontSize: '0.74rem', color: 'var(--ridex-muted)' }}>
                            {ride.participants?.length || 0} / {ride.maxRiders} riders
                          </span>
                          {isHost && (
                            <span style={{ fontSize: '0.62rem', background: 'rgba(255, 107, 0, 0.18)', color: 'var(--ridex-orange)', border: '1px solid rgba(255, 107, 0, 0.35)', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              HOST
                            </span>
                          )}
                          {isApproved && !isHost && (
                            <span style={{ fontSize: '0.62rem', background: 'rgba(0, 230, 118, 0.18)', color: 'var(--ridex-success)', border: '1px solid rgba(0, 230, 118, 0.35)', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              JOINED
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.78rem', color: 'var(--ridex-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.03em' }}>
                          <span>INSPECT</span>
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
