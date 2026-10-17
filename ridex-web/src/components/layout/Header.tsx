/**
 * RIDEX Web — Cockpit Top Header
 * Mobile-first adventure navigation header with brand mark, connection status, and rider avatar.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useActiveRideStore } from '../../stores/useActiveRideStore';
import { Radio, Compass, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { isTracking, activeRideId } = useActiveRideStore();
  const navigate = useNavigate();

  return (
    <header
      style={{
        paddingTop: 'calc(12px + var(--sat))',
        background: 'rgba(8, 10, 15, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-card)',
        position: 'sticky',
        top: 0,
        zIndex: 900,
      }}
      className="px-4 py-3"
    >
      <div className="desktop-wrapper flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Mark */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img
            src="/ridex-logo.png"
            alt="RIDEX"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(255, 107, 0, 0.3)',
            }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
              RIDE<span style={{ color: 'var(--primary)' }}>X</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              Group Touring
            </div>
          </div>
        </Link>

        {/* Live Telemetry Status & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isTracking && activeRideId && (
            <Link
              to={`/rides/live/${activeRideId}`}
              className="badge badge-live card-interactive"
              style={{ textDecoration: 'none', padding: '6px 12px' }}
            >
              <Radio size={14} className="pulse-radar" />
              <span>LIVE COCKPIT</span>
            </Link>
          )}

          {user ? (
            <Link
              to="/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
              }}
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80'}
                alt={user.fullName}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border-active)',
                }}
              />
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
                style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.85rem' }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary"
                style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.85rem' }}
              >
                Join
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
