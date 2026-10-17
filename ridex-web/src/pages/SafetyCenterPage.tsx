/**
 * RIDEX Web — Safety Center & Emergency Command Cockpit
 * Comprehensive safety dashboard: tracking status, GPS signal freshness,
 * geodesic separation warnings, active SOS alerts with resolution, and PTT intercom.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { useActiveRideStore } from '../stores/useActiveRideStore';
import { rideService } from '../services/rideService';
import { safetyService } from '../services/safetyService';
import { TrackingHealthCard } from '../components/safety/TrackingHealthCard';
import { IntercomWidget } from '../components/safety/IntercomWidget';
import { SosModal } from '../components/safety/SosModal';
import { SeparationBanner } from '../components/live/SeparationBanner';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  PhoneCall,
  CheckCircle2,
  Users,
  Compass,
  ArrowLeft,
  HeartPulse,
  Wrench,
  Fuel,
  Info,
} from 'lucide-react';
import { SosAlert } from '../types';

export const SafetyCenterPage: React.FC = () => {
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    activeRideId,
    isTracking,
    myLocation,
    peerLocations,
    separationState,
    activeSos,
    triggerSos,
    clearSos,
  } = useActiveRideStore();

  const rideId = paramId || activeRideId || '';
  const [showSosModal, setShowSosModal] = useState(false);
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);

  // Fetch ride details if rideId is available
  const { data: ride } = useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => (rideId ? rideService.getRideById(rideId, user?.id) : Promise.resolve(null)),
    enabled: !!rideId,
  });

  // Fetch recent SOS emergency alerts for this ride
  const { data: pastAlerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['rideSosAlerts', rideId],
    queryFn: () => (rideId ? safetyService.getRideSosAlerts(rideId) : Promise.resolve([])),
    enabled: !!rideId,
  });

  // Mutation to resolve an emergency alert
  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) return false;
      return safetyService.resolveSos(alertId, rideId, user.id);
    },
    onSuccess: () => {
      clearSos();
      queryClient.invalidateQueries({ queryKey: ['rideSosAlerts', rideId] });
      setResolutionNotice('Emergency alert marked as RESOLVED.');
      setTimeout(() => setResolutionNotice(null), 3000);
    },
  });

  const isHost = ride?.organizerId === user?.id;

  return (
    <div className="desktop-wrapper" style={{ padding: '20px 16px 80px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '780px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={() => (rideId ? navigate(`/rides/live/${rideId}`) : navigate('/dashboard'))}
          className="btn btn-secondary"
          style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.82rem' }}
        >
          <ArrowLeft size={15} />
          <span>{rideId ? 'Back to Live Radar' : 'Back to Dashboard'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge" style={{ background: 'rgba(255, 59, 48, 0.15)', color: 'var(--danger)', border: '1px solid var(--danger-glow)' }}>
            <ShieldAlert size={12} />
            <span>SAFETY CENTER</span>
          </span>
          {ride?.joinCode && (
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 700 }}>
              {ride.joinCode}
            </span>
          )}
        </div>
      </div>

      {/* Resolution Toast */}
      {resolutionNotice && (
        <div style={{ background: 'rgba(0, 230, 118, 0.15)', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '10px 14px', borderRadius: '10px', color: 'var(--success)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{resolutionNotice}</span>
        </div>
      )}

      {/* Active SOS Alert Banner (High Priority) */}
      {activeSos && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.25) 0%, rgba(18, 23, 34, 0.95) 100%)',
            border: '2px solid var(--danger)',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: '0 0 30px rgba(255, 59, 48, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} color="var(--danger)" className="blink-beacon" />
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--danger)' }}>
                  ACTIVE EMERGENCY ALERT
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {activeSos.riderName} reported: {activeSos.issueType.replace('_', ' ')}
                </span>
              </div>
            </div>

            <span className="badge badge-alert">CRITICAL</span>
          </div>

          {activeSos.note && (
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#FFFFFF' }}>
              "{activeSos.note}"
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              GPS: {activeSos.latitude.toFixed(5)}, {activeSos.longitude.toFixed(5)} • Reported {new Date(activeSos.createdAt).toLocaleTimeString()}
            </span>

            {(isHost || activeSos.userId === user?.id) && (
              <button
                onClick={() => resolveMutation.mutate(activeSos.id)}
                disabled={resolveMutation.isPending}
                className="btn btn-secondary"
                style={{ minHeight: '34px', padding: '4px 14px', fontSize: '0.78rem', borderColor: 'var(--success)', color: 'var(--success)' }}
              >
                <CheckCircle2 size={14} />
                <span>Mark Alert as Resolved</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Geodesic Squad Separation Status Banner */}
      <SeparationBanner state={separationState} />

      {/* Emergency Assistance SOS Action Button */}
      <div
        className="card-glass"
        style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(18, 23, 34, 0.95) 100%)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="var(--danger)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Need Squad Assistance?</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px' }}>
            Broadcast an emergency distress beacon to all riders in this tour. Select from Mechanical, Flat Tyre, Fuel, Lost, or Medical.
          </p>
        </div>

        <button
          onClick={() => setShowSosModal(true)}
          className="btn btn-danger"
          style={{ minHeight: '46px', padding: '10px 22px', fontSize: '0.95rem', fontWeight: 800 }}
        >
          🚨 TRIGGER SOS BEACON
        </button>
      </div>

      {/* 2-Column Grid: GPS Health & Intercom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* GPS Health Component */}
        <TrackingHealthCard
          isTracking={isTracking}
          accuracyMeters={myLocation?.accuracy}
          lastUpdatedIso={myLocation?.updatedAt}
          isOnline={navigator.onLine}
        />

        {/* Squad PTT Intercom Widget */}
        <IntercomWidget
          rideId={rideId || 'tour-general'}
          userId={user?.id || 'guest-rider'}
          userName={user?.fullName || 'Rider'}
        />
      </div>

      {/* National Emergency Services Quick Tile */}
      <div
        className="card-glass"
        style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Direct Emergency Services</h4>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            If immediate ambulance, highway patrol, or fire rescue is needed:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="tel:112"
            className="btn btn-secondary"
            style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none', color: '#FFFFFF' }}
          >
            <PhoneCall size={14} color="var(--cyan)" />
            <span>Dial 112 (National Emergency)</span>
          </a>
          <a
            href="tel:108"
            className="btn btn-secondary"
            style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none', color: '#FFFFFF' }}
          >
            <HeartPulse size={14} color="var(--danger)" />
            <span>108 (Ambulance)</span>
          </a>
        </div>
      </div>

      {/* Emergency History for this tour */}
      <div className="card-glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Tour Emergency Event Log</h4>
        {pastAlerts.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No past emergency alerts recorded on this expedition. Squad is safe.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pastAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF' }}>
                    {alert.issueType.replace('_', ' ')} • {alert.riderName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(alert.createdAt).toLocaleString()} • {alert.note || 'No note attached'}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: alert.status === 'RESOLVED' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                    color: alert.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Step Confirmation SOS Modal */}
      {showSosModal && (
        <SosModal
          rideId={rideId || 'tour-general'}
          userId={user?.id || 'guest-rider'}
          riderName={user?.fullName || 'Rider'}
          currentLat={myLocation?.latitude}
          currentLng={myLocation?.longitude}
          onClose={() => setShowSosModal(false)}
          onSuccess={(alert) => triggerSos(alert)}
        />
      )}
    </div>
  );
};
