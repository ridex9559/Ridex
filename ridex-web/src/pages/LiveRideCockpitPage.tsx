/**
 * RIDEX Web — Live Ride Cockpit & Telemetry HUD
 * Real-time map, peer rider radar beacons, GPS tracking engine, separation warnings, and SOS trigger.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../services/rideService';
import { realtimeService } from '../services/realtimeService';
import { useAuthStore } from '../stores/useAuthStore';
import { useActiveRideStore } from '../stores/useActiveRideStore';
import { LeafletMap } from '../components/maps/LeafletMap';
import { SeparationBanner } from '../components/live/SeparationBanner';
import { LiveRiderLocation, SosAlert } from '../types';
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
} from 'lucide-react';

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
    startTracking,
    stopTracking,
    updateMyLocation,
    updatePeerLocation,
    triggerSos,
    clearSos,
  } = useActiveRideStore();

  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosType, setSosType] = useState<'FLAT_TYRE' | 'MECHANICAL' | 'OUT_OF_FUEL' | 'MEDICAL' | 'LOST'>('MECHANICAL');
  const [sosNote, setSosNote] = useState('');

  const { data: ride } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => (id ? rideService.getRideById(id, user?.id) : Promise.resolve(null)),
    enabled: !!id,
  });

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

  const handleSendSos = async () => {
    if (!id || !user) return;
    const alert: SosAlert = {
      id: `sos-${Date.now()}`,
      rideId: id,
      userId: user.id,
      riderName: user.fullName,
      issueType: sosType,
      latitude: myLocation?.latitude || 18.5204,
      longitude: myLocation?.longitude || 73.8567,
      note: sosNote.trim() || undefined,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    triggerSos(alert);
    await realtimeService.broadcastSos(id, alert);
    setShowSosModal(false);
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

      {/* Full Map Canvas */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
        <LeafletMap
          start={ride ? { name: ride.startLocationName, latitude: ride.startLatitude, longitude: ride.startLongitude } : null}
          destination={ride ? { name: ride.destinationName, latitude: ride.destinationLatitude, longitude: ride.destinationLongitude } : null}
          waypoints={ride?.checkpoints || []}
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
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, color: 'var(--cyan)' }}>
              {myLocation?.speed || 0}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
                km/h
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              HEADING
            </div>
            <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1, color: '#FFF' }}>
              {myLocation?.heading ? `${Math.round(myLocation.heading)}°` : '—'}
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

      {/* Tracking Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <button
          onClick={handleToggleTracking}
          className={`btn ${isTracking ? 'btn-danger' : 'btn-primary'}`}
          style={{ padding: '14px', fontSize: '1rem' }}
        >
          {isTracking ? <Square size={18} fill="#FFF" /> : <Play size={18} fill="#FFF" />}
          <span>{isTracking ? 'Stop Live GPS Broadcast' : 'Start Live GPS Tracking'}</span>
        </button>

        <button
          onClick={() => setShowSosModal(true)}
          className="btn btn-secondary"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', fontWeight: 800 }}
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

      {/* SOS Modal */}
      {showSosModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '2px solid var(--danger)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} color="var(--danger)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>
                Trigger Squad SOS Alert
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Broadcasts your exact live coordinates and issue classification to all squad members immediately.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Emergency Issue</label>
              <select
                value={sosType}
                onChange={(e) => setSosType(e.target.value as any)}
                className="form-input"
              >
                <option value="FLAT_TYRE">FLAT TYRE / PUNCTURE</option>
                <option value="MECHANICAL">MECHANICAL BREAKDOWN</option>
                <option value="OUT_OF_FUEL">OUT OF FUEL</option>
                <option value="MEDICAL">MEDICAL ASSISTANCE NEEDED</option>
                <option value="LOST">SEPARATED / LOST TRAIL</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Note to Squad (optional)</label>
              <input
                type="text"
                placeholder="e.g. Near milestone 42 on the left shoulder"
                value={sosNote}
                onChange={(e) => setSosNote(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendSos}
                className="btn btn-danger"
              >
                Broadcast Emergency SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
