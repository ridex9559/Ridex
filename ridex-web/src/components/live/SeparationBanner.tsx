/**
 * RIDEX Web — Squad Separation & Telemetry Status Banner
 * Real-time geodesic warnings with hysteresis recovery thresholds.
 */

import React from 'react';
import { GroupSeparationState } from '../../types';
import { AlertTriangle, ShieldCheck, Radio } from 'lucide-react';

interface SeparationBannerProps {
  state: GroupSeparationState;
}

export const SeparationBanner: React.FC<SeparationBannerProps> = ({ state }) => {
  if (state.status === 'TOGETHER') {
    return (
      <div
        style={{
          background: 'rgba(0, 230, 118, 0.12)',
          border: '1px solid rgba(0, 230, 118, 0.3)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <ShieldCheck size={20} color="var(--success)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>
            Squad Formation Secure
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {state.activeRidersCount} riders tracking • {state.maxSpreadMeters}m max cluster spread
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'SPREAD') {
    return (
      <div
        style={{
          background: 'rgba(255, 176, 32, 0.14)',
          border: '1px solid var(--gold)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <AlertTriangle size={20} color="var(--gold)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>
            Squad Stretching Out ({state.maxSpreadMeters}m gap)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Advise Road Captain to moderate cruising pace.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(255, 59, 48, 0.18)',
        border: '1px solid var(--danger)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: '0 0 20px rgba(255, 59, 48, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={20} color="var(--danger)" className="blink-beacon" />
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--danger)' }}>
          ⚠️ SQUAD SEPARATION WARNING
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
        Rider(s) detached by &gt; 1.0 km from the group leader!
      </div>
      {state.separatedRiders.map((sr, idx) => (
        <div
          key={idx}
          style={{
            fontSize: '0.75rem',
            color: '#FFA39E',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px 8px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{sr.riderName}</span>
          <span className="mono">{(sr.distanceMeters / 1000).toFixed(1)} km behind</span>
        </div>
      ))}
    </div>
  );
};
