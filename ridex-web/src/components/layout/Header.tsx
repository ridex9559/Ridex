/**
 * RIDEX Web — Cockpit Top Header
 * Mobile-first adventure navigation header with brand mark, connection status, and rider avatar.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useActiveRideStore } from '../../stores/useActiveRideStore';
import { Radio, Compass, ShieldAlert, Bell, Users } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { isTracking, activeRideId, activeSos } = useActiveRideStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user?.id) return;
    notificationService.getNotifications(user.id).then(notifs => {
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });

    const unsubscribe = notificationService.subscribeToNotifications(user.id, () => {
      setUnreadCount(prev => prev + 1);
    });
    return () => unsubscribe();
  }, [user?.id]);

  return (
    <header
      style={{
        paddingTop: 'calc(10px + var(--sat))',
        paddingBottom: '10px',
        background: 'rgba(8, 10, 14, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-card)',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        width: '100%',
        boxSizing: 'border-box',
      }}
      className="px-3 sm:px-4"
    >
      <div
        className="desktop-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '1536px',
          margin: '0 auto',
          gap: '8px',
        }}
      >
        {/* Brand Mark & Wordmark */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}
          aria-label="RIDEX Home"
        >
          <img
            src="/ridex-logo.png"
            alt="RIDEX"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(255, 107, 0, 0.25)',
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 850,
                fontSize: '1.2rem',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'baseline',
              }}
            >
              <span style={{ color: '#FFFFFF' }}>RIDE</span>
              <span style={{ color: 'var(--ridex-orange)' }}>X</span>
              <span style={{ color: 'var(--ridex-purple)', fontSize: '0.9rem', marginLeft: '3px' }}>●</span>
            </div>
            <div
              style={{
                fontSize: '0.6rem',
                color: 'var(--ridex-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 700,
                lineHeight: 1.1,
                marginTop: '1px',
              }}
            >
              Group Touring
            </div>
          </div>
        </Link>

        {/* Live Telemetry Status, Safety Shortcut, Notifications & Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.8vw, 10px)', flexShrink: 0 }}>
          {/* Active Live Cockpit Beacon */}
          {isTracking && activeRideId && (
            <Link
              to={`/rides/live/${activeRideId}`}
              className="badge badge-live card-interactive"
              style={{ textDecoration: 'none', padding: '5px 10px', fontSize: '0.72rem' }}
              aria-label="Resume Live Cockpit"
            >
              <Radio size={13} className="pulse-radar" />
              <span className="hidden sm:inline">LIVE COCKPIT</span>
            </Link>
          )}

          {/* Safety Center Quick Link */}
          <Link
            to={activeRideId ? `/safety/${activeRideId}` : '/safety'}
            className="card-interactive"
            title="Safety Center & Emergency Intercom"
            aria-label="Safety Center & Emergency Intercom"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 9px',
              borderRadius: '9px',
              background: activeSos ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: activeSos ? '1px solid var(--ridex-danger)' : '1px solid var(--border-card)',
              color: activeSos ? 'var(--ridex-danger)' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.76rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={15} color={activeSos ? 'var(--ridex-danger)' : 'var(--gold)'} />
            <span className="hidden md:inline">Safety</span>
          </Link>

          {/* Notifications Bell */}
          {user && (
            <Link
              to="/notifications"
              className="card-interactive"
              title="Notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--ridex-orange)',
                    color: '#000',
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <Link
              to="/profile"
              title="Rider Profile"
              aria-label={`Rider Profile: ${user.fullName || 'User'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80'}
                alt={user.fullName || 'Rider Avatar'}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--border-active)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                }}
              />
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
                style={{ minHeight: '34px', padding: '5px 12px', fontSize: '0.82rem' }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary"
                style={{ minHeight: '34px', padding: '5px 12px', fontSize: '0.82rem' }}
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
