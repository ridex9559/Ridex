/**
 * RIDEX Web — Tracking & GPS Signal Health Telemetry Widget
 * Displays GPS permission, accuracy, freshness, and honest browser foreground warnings.
 */

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Radio,
  Clock,
  Compass,
  Wifi,
  WifiOff,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { safetyService } from '../../services/safetyService';

interface TrackingHealthProps {
  isTracking: boolean;
  accuracyMeters?: number;
  lastUpdatedIso?: string;
  isOnline: boolean;
  permissionStatus?: 'granted' | 'denied' | 'prompt';
}

export const TrackingHealthCard: React.FC<TrackingHealthProps> = ({
  isTracking,
  accuracyMeters,
  lastUpdatedIso,
  isOnline,
  permissionStatus = 'granted',
}) => {
  const freshness = safetyService.evaluateLocationFreshness(lastUpdatedIso);

  return (
    <div className="rx-cockpit-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color={isTracking && !freshness.isStale ? 'var(--success)' : 'var(--primary)'} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Telemetry & GPS Health</h4>
        </div>

        <span
          className="badge"
          style={{
            background: isTracking && !freshness.isStale ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 176, 32, 0.15)',
            color: isTracking && !freshness.isStale ? 'var(--success)' : 'var(--gold)',
            border: `1px solid ${isTracking && !freshness.isStale ? 'rgba(0, 230, 118, 0.3)' : 'var(--gold-glow)'}`,
            fontSize: '0.7rem',
          }}
        >
          <Radio size={11} className={isTracking ? 'pulse-radar' : ''} />
          <span>{isTracking ? freshness.statusText.toUpperCase() : 'TRACKING IDLE'}</span>
        </span>
      </div>

      {/* Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {/* GPS Accuracy */}
        <div style={{ background: 'rgba(18, 23, 34, 0.7)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            GPS Accuracy
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', marginTop: '2px' }}>
            {accuracyMeters ? `±${accuracyMeters}m` : 'Standby'}
          </div>
        </div>

        {/* Realtime WebSocket Network */}
        <div style={{ background: 'rgba(18, 23, 34, 0.7)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Squad Network
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            {isOnline ? (
              <>
                <Wifi size={14} color="var(--success)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={14} color="var(--danger)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)' }}>Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Freshness Alert (if stale) */}
      {isTracking && freshness.isStale && (
        <div style={{ background: 'rgba(255, 176, 32, 0.12)', border: '1px solid var(--gold-glow)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={15} color="var(--gold)" />
          <span style={{ fontSize: '0.74rem', color: 'var(--gold)' }}>
            Location update delayed ({freshness.secondsAgo}s ago). GPS signal may be obstructed by terrain or tunnels.
          </span>
        </div>
      )}

      {/* Honest Mobile Browser Background GPS Limitation Notice */}
      <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid var(--border-cyan)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Info size={14} color="var(--cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
          <strong>Foreground Tracking Notice:</strong> Mobile browsers (iPhone Safari & Android Chrome) throttle background GPS when locked. Keep this tab active while riding or use the RIDEX Expo native app for background tracking.
        </span>
      </div>
    </div>
  );
};
