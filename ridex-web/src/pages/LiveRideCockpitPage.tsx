/**
 * RIDEX Web — Live Ride Cockpit & Telemetry HUD
 * Real-time map, peer rider radar beacons, GPS tracking engine, separation warnings, and SOS trigger.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { realtimeService } from '../services/realtimeService';
import { mapService } from '../services/mapService';
import { useAuthStore } from '../stores/useAuthStore';
import { useActiveRideStore } from '../stores/useActiveRideStore';
import { LeafletMap } from '../components/maps/LeafletMap';
import { SeparationBanner } from '../components/live/SeparationBanner';
import { LiveRiderLocation, SosAlert, RouteManeuver } from '../types';
import { SosModal } from '../components/safety/SosModal';
import {
  Compass,
  Radio,
  Play,
  Square,
  AlertTriangle,
  Shield,
  Navigation,
  ArrowLeft,
  Battery,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  CornerUpRight,
} from 'lucide-react';

function getCardinalDirection(heading?: number): string {
  if (heading === undefined || heading === null) return '';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading %= 360) < 0 ? heading + 360 : heading) / 45) % 8;
  return directions[index];
}

export const LiveRideCockpitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    isTracking,
    myLocation,
    peerLocations,
    separationState,
    activeSos,
    setActiveRideId,
    startTracking,
    stopTracking,
    updateMyLocation,
    updatePeerLocation,
    setPeerLocations,
    triggerSos,
    clearSos,
  } = useActiveRideStore();

  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [maneuvers, setManeuvers] = useState<RouteManeuver[]>([]);

  const { data: ride } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => (id ? rideService.getRideById(id, user?.id) : Promise.resolve(null)),
    enabled: !!id,
  });

  // Cold-start initialization: load existing active peer locations and clear stale SOS
  useEffect(() => {
    if (!id) return;
    setActiveRideId(id);

    // Initial fetch of active squad locations already published to Supabase
    rideService.getRideLiveLocations(id).then((locations) => {
      if (locations && locations.length > 0) {
        setPeerLocations(locations);
      }
    });

    // Check if an unresolved SOS emergency exists for this specific ride
    rideService.getRideActiveSos(id).then((activeAlert) => {
      if (activeAlert) {
        triggerSos(activeAlert);
      } else {
        clearSos();
      }
    });
  }, [id, setActiveRideId, setPeerLocations, triggerSos, clearSos]);

  // Calculate genuine road-following route and turn-by-turn maneuvers via OSRM
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
        if (res.maneuvers && res.maneuvers.length > 0) {
          setManeuvers(res.maneuvers);
        }
      })
      .catch((err) => console.warn('[LiveCockpit] calculateRoute error:', err));
  }, [ride]);

  // Subscribe to real-time telemetry channel
  useEffect(() => {
    if (!id) return;

    const channel = realtimeService.subscribeToRide(id, {
      onLocationUpdate: (loc) => {
        if (loc.userId !== user?.id) {
          updatePeerLocation(loc);
        }
      },
      onSosAlert: (alert) => {
        triggerSos(alert);
      },
    });

    return () => {
      realtimeService.unsubscribeFromRide(id);
    };
  }, [id, user?.id]);

  // Start / Stop Hardware Geolocation
  const handleToggleTracking = () => {
    if (isTracking) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      stopTracking();
    } else {
      if (!('geolocation' in navigator)) {
        setGpsError('Geolocation is not supported by your browser.');
        return;
      }

      setGpsError('');
      const idNum = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: LiveRiderLocation = {
            userId: user?.id || 'guest-rider',
            riderName: user?.fullName || 'Rider',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0, // m/s to km/h
            accuracy: Math.round(pos.coords.accuracy),
            updatedAt: new Date().toISOString(),
          };

          updateMyLocation(loc);

          if (id) {
            realtimeService.broadcastLocation(id, loc);
          }
        },
        (err) => {
          console.warn('[LiveCockpit] GPS error:', err);
          setGpsError(err.message || 'GPS location permission denied or unavailable.');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000,
        }
      );

      setWatchId(idNum);
      if (id) {
        startTracking(id);
      }
    }
  };

  const allRiderMarkers = myLocation
    ? [myLocation, ...Object.values(peerLocations)]
    : Object.values(peerLocations);

  return (
    <div className="cockpit-screen-wrap">
      {/* 1. Cockpit Top Aerospace Bar */}
      <div className="cockpit-top-bar">
        <button
          onClick={() => navigate(`/rides/${id}`)}
          className="btn btn-secondary"
          style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.82rem', borderRadius: '10px' }}
        >
          <ArrowLeft size={15} />
          <span>Manifest</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>TRANSMITTER:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
              {user?.fullName || 'Rider'}
            </span>
          </div>

          <span className="rx-badge rx-badge-cyan">
            <Radio size={12} className="pulse-radar" />
            <span>RADAR ACTIVE</span>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--cyan)', fontWeight: 800 }}>
            {ride?.joinCode}
          </span>
        </div>
      </div>

      {/* 2. Geodesic Separation State Banner */}
      <SeparationBanner state={separationState} />

      {/* 3. Active SOS Warning Alert */}
      {activeSos && (
        <div
          className="rx-card"
          style={{
            background: 'rgba(255, 59, 48, 0.22)',
            border: '2px solid var(--danger)',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 0 24px rgba(255, 59, 48, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={24} color="var(--danger)" className="blink-beacon" />
            <div>
              <div style={{ fontWeight: 800, color: '#FFF', fontSize: '0.95rem' }}>
                EMERGENCY SOS: {activeSos.issueType}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#FFA39E' }}>
                {activeSos.riderName} triggered assistance! {activeSos.note && `("${activeSos.note}")`}
              </div>
            </div>
          </div>
          <button
            onClick={clearSos}
            className="btn btn-secondary"
            style={{ minHeight: '34px', padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* 4. GPS Error Alert */}
      {gpsError && (
        <div style={{ background: 'rgba(255, 176, 32, 0.15)', border: '1px solid var(--gold)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--gold)' }}>
          {gpsError}
        </div>
      )}

      {/* 5. Full Map Canvas with Road-Following Route and Turn-by-Turn HUD */}
      <div className="cockpit-map-viewport">
        {/* Turn-by-Turn Navigation Instruction Overlay */}
        {maneuvers.length > 0 && (
          <div className="cockpit-turn-hud">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid var(--border-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CornerUpRight size={22} color="var(--cyan)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#FFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '0.01em',
                }}
              >
                {maneuvers[0]?.instruction || 'Follow planned road route'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 800 }}>
                  In {maneuvers[0]?.distanceMeters ? `${maneuvers[0].distanceMeters} m` : '500 m'}
                </span>
                {ride?.checkpoints && ride.checkpoints.length > 0 && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    • Next Stop: {ride.checkpoints[0].name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <LeafletMap
          start={ride ? { name: ride.startLocationName, latitude: ride.startLatitude, longitude: ride.startLongitude } : null}
          destination={ride ? { name: ride.destinationName, latitude: ride.destinationLatitude, longitude: ride.destinationLongitude } : null}
          waypoints={ride?.checkpoints || []}
          routeCoordinates={routeCoordinates}
          riderLocations={allRiderMarkers}
          currentUserId={user?.id}
          height="min(60vh, 520px)"
        />

        {/* Floating Cockpit HUD Metrics (High-Contrast Automotive Telemetry) */}
        <div className="cockpit-tft-cluster">
          {/* Speedometer */}
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
              SPEED
            </div>
            <div className="cockpit-speed-readout" style={{ color: isTracking ? 'var(--cyan)' : 'var(--text-muted)' }}>
              {isTracking ? (myLocation?.speed !== undefined ? myLocation.speed : 0) : '—'}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>
                {isTracking ? 'KM/H' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
              HEADING
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1, color: '#FFF' }}>
              {isTracking && myLocation?.heading !== undefined
                ? `${Math.round(myLocation.heading)}° ${getCardinalDirection(myLocation.heading)}`
                : '—'}
            </div>
          </div>

          {/* Active Squad Radar */}
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, textAlign: 'right' }}>
              SQUAD ON RADAR
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)', textAlign: 'right' }}>
              {allRiderMarkers.length} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RIDERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Ergonomic Touch Actions (52px Touch Targets) */}
      <div className="cockpit-action-cluster">
        <button
          onClick={handleToggleTracking}
          className={`cockpit-btn-gps ${isTracking ? 'active' : 'inactive'}`}
        >
          {isTracking ? <Square size={18} fill="#FFF" /> : <Play size={18} fill="#07080B" />}
          <span>{isTracking ? 'STOP GPS' : 'START GPS'}</span>
        </button>

        <button
          onClick={() => navigate(`/safety/${id}`)}
          className="cockpit-btn-tactical"
        >
          <ShieldAlert size={18} color="var(--primary)" />
          <span>SAFETY</span>
        </button>

        <button
          onClick={() => setShowSosModal(true)}
          className="cockpit-btn-sos"
        >
          <AlertTriangle size={18} />
          <span>SOS</span>
        </button>
      </div>

      {/* Honest Browser Limitation Advice */}
      <div
        className="card-glass"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <HelpCircle size={18} color="var(--cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <b style={{ color: 'var(--text-primary)' }}>Browser Geolocation Note:</b> Modern mobile browsers (iPhone Safari & Android Chrome) aggressively throttle background GPS when the screen is locked or tab is minimized. Keep this tab active or display unlocked for continuous squad radar synchronization.
        </div>
      </div>

      {/* SOS Modal with 2-Step Confirmation & Offline Guidance */}
      {showSosModal && (
        <SosModal
          isOpen={showSosModal}
          rideId={id || ''}
          userId={user?.id || 'guest-rider'}
          riderName={user?.fullName || 'Rider'}
          currentLat={myLocation?.latitude}
          currentLng={myLocation?.longitude}
          onClose={() => setShowSosModal(false)}
          onSuccess={(alert) => {
            triggerSos(alert);
            setShowSosModal(false);
          }}
        />
      )}
    </div>
  );
};
