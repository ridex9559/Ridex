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
    <div className="desktop-wrapper" style={{ padding: '20px 16px calc(84px + var(--sab))', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '780px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={() => (rideId ? navigate(`/rides/live/${rideId}`) : navigate('/dashboard'))}
          className="btn btn-secondary"
          style={{ minHeight: '40px', padding: '8px 16px', fontSize: '0.82rem' }}
        >
          <ArrowLeft size={16} />
          <span>{rideId ? 'Back to Live Radar' : 'Back to Dashboard'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="rx-badge rx-badge-danger">
            <ShieldAlert size={12} />
            <span>SAFETY CENTER</span>
          </span>
          {ride?.joinCode && (
            <span className="rx-telemetry" style={{ fontSize: '0.82rem', color: 'var(--cyan)', fontWeight: 700 }}>
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
            background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.2) 0%, rgba(18, 23, 34, 0.98) 100%)',
            border: '1.5px solid var(--danger)',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: '0 8px 32px rgba(255, 59, 48, 0.25)',
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
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 59, 48, 0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#FFFFFF' }}>
              "{activeSos.note}"
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              GPS: {activeSos.latitude.toFixed(5)}, {activeSos.longitude.toFixed(5)} • Reported {new Date(activeSos.createdAt).toLocaleTimeString()}
            </span>

            {(isHost || activeSos.userId === user?.id) && (
              <button
                onClick={() => resolveMutation.mutate(activeSos.id)}
                disabled={resolveMutation.isPending}
                className="btn btn-secondary"
                style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.78rem', borderColor: 'var(--success)', color: 'var(--success)' }}
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
      <div className="safety-beacon-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="var(--danger)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>Need Squad Assistance?</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '440px', lineHeight: 1.45 }}>
            Broadcast an emergency distress beacon to all riders in this tour. Select from Mechanical, Flat Tyre, Fuel, Lost, or Medical.
          </p>
        </div>

        <button
          onClick={() => setShowSosModal(true)}
          className="btn btn-danger"
          style={{ minHeight: '46px', padding: '10px 22px', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Radio size={16} className="blink-beacon" />
          <span>TRIGGER SOS BEACON</span>
        </button>
      </div>

      {/* 2-Column Grid: GPS Health & Intercom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
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
        className="rx-cockpit-panel"
        style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}
      >
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Direct Emergency Services</h4>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            If immediate ambulance, highway patrol, or fire rescue is needed:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="tel:112"
            className="btn btn-tactical"
            style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none', color: '#FFFFFF' }}
          >
            <PhoneCall size={14} color="var(--cyan)" />
            <span>Dial 112 (National Emergency)</span>
          </a>
          <a
            href="tel:108"
            className="btn btn-tactical"
            style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none', color: '#FFFFFF' }}
          >
            <HeartPulse size={14} color="var(--danger)" />
            <span>108 (Ambulance)</span>
          </a>
        </div>
      </div>

      {/* Emergency History for this tour */}
      <div className="rx-cockpit-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>Tour Emergency Event Log</h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {pastAlerts.length} INCIDENTS
          </span>
        </div>
        {pastAlerts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '10px' }}>
            No past emergency alerts recorded on this expedition. Squad is safe.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pastAlerts.map((alert) => (
              <div key={alert.id} className="safety-incident-item">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF' }}>
                    {alert.issueType.replace('_', ' ')} • {alert.riderName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {new Date(alert.createdAt).toLocaleString()} • {alert.note || 'No note attached'}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.04em',
                    background: alert.status === 'RESOLVED' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                    color: alert.status === 'RESOLVED' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${alert.status === 'RESOLVED' ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
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
