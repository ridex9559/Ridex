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

        {/* Live Telemetry Status, Safety Quick Access & Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Active Live Cockpit Beacon */}
          {isTracking && activeRideId && (
            <Link
              to={`/rides/live/${activeRideId}`}
              className="badge badge-live card-interactive"
              style={{ textDecoration: 'none', padding: '6px 12px' }}
            >
              <Radio size={14} className="pulse-radar" />
              <span className="hidden sm:inline">LIVE COCKPIT</span>
            </Link>
          )}

          {/* Safety Center Quick Link */}
          <Link
            to={activeRideId ? `/safety/${activeRideId}` : '/safety'}
            className="card-interactive"
            title="Safety Center & Emergency Intercom"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '10px',
              background: activeSos ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: activeSos ? '1px solid var(--danger)' : '1px solid var(--border-card)',
              color: activeSos ? 'var(--danger)' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <ShieldAlert size={16} color={activeSos ? 'var(--danger)' : 'var(--gold)'} />
            <span className="hidden md:inline">Safety</span>
          </Link>

          {/* Notifications Bell */}
          {user && (
            <Link
              to="/notifications"
              className="card-interactive"
              title="Notifications"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--primary)',
                    color: '#000',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
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
