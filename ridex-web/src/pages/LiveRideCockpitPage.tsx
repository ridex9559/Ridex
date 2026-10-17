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
    <div className="desktop-wrapper" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate(`/rides/${id}`)}
          className="btn btn-secondary"
          style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.8rem' }}
        >
          <ArrowLeft size={14} />
          <span>Ride Overview</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-live">
            <Radio size={12} className="pulse-radar" />
            <span>RADAR ACTIVE</span>
          </span>
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 700 }}>
            {ride?.joinCode}
          </span>
        </div>
      </div>

      {/* Geodesic Separation State Banner */}
      <SeparationBanner state={separationState} />

      {/* Active SOS Warning Alert */}
      {activeSos && (
        <div
          style={{
            background: 'rgba(255, 59, 48, 0.25)',
            border: '2px solid var(--danger)',
            borderRadius: '12px',
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
            style={{ minHeight: '30px', padding: '2px 8px', fontSize: '0.75rem' }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* GPS Error Alert */}
      {gpsError && (
        <div style={{ background: 'rgba(255, 176, 32, 0.15)', border: '1px solid var(--gold)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--gold)' }}>
          {gpsError}
        </div>
      )}

      {/* Full Map Canvas with Road-Following Route and Turn-by-Turn HUD */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Turn-by-Turn Navigation Instruction Overlay */}
        {maneuvers.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              background: 'rgba(8, 10, 15, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-cyan)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 500,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid var(--border-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CornerUpRight size={20} color="var(--cyan)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#FFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {maneuvers[0]?.instruction || 'Follow planned road route'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '10px' }}>
                <span className="mono" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
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
          height="420px"
        />

        {/* Floating Cockpit HUD Metrics */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(8, 10, 15, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-card)',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 500,
          }}
        >
          {/* Speedometer */}
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              SPEED
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, color: isTracking ? 'var(--cyan)' : 'var(--text-muted)' }}>
              {isTracking ? (myLocation?.speed !== undefined ? myLocation.speed : 0) : '—'}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
                {isTracking ? 'km/h' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              HEADING
            </div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1, color: '#FFF' }}>
              {isTracking && myLocation?.heading !== undefined
                ? `${Math.round(myLocation.heading)}° ${getCardinalDirection(myLocation.heading)}`
                : '—'}
            </div>
          </div>

          {/* Active Squad Radar */}
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              SQUAD ON RADAR
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
              {allRiderMarkers.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tracking & Safety Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px' }}>
        <button
          onClick={handleToggleTracking}
          className={`btn ${isTracking ? 'btn-danger' : 'btn-primary'}`}
          style={{ padding: '12px 10px', fontSize: '0.85rem' }}
        >
          {isTracking ? <Square size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" />}
          <span>{isTracking ? 'Stop GPS' : 'Start GPS'}</span>
        </button>

        <button
          onClick={() => navigate(`/safety/${id}`)}
          className="btn btn-secondary"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700, padding: '12px 8px', fontSize: '0.82rem' }}
        >
          <ShieldAlert size={16} />
          <span>Safety & Voice</span>
        </button>

        <button
          onClick={() => setShowSosModal(true)}
          className="btn btn-secondary"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', fontWeight: 800, padding: '12px 8px', fontSize: '0.82rem' }}
        >
          <AlertTriangle size={16} />
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
