/**
 * RIDEX Web — Desktop Left Navigation Sidebar (~208px)
 * Displays official RIDEX helmet-mountain brand mark, active route indicators,
 * real route navigation, and decorative adventure touring card.
 */

import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Warehouse,
  PlusCircle,
  QrCode,
  Compass,
  Radio,
  Users,
  MapPin,
  Fuel,
  Globe,
  User,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useActiveRideStore } from '../../stores/useActiveRideStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isTracking, activeRideId } = useActiveRideStore();

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab');

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      isActive: location.pathname === '/dashboard' && !activeTab,
    },
    {
      label: 'Garage',
      to: '/garage',
      icon: Warehouse,
      isActive: location.pathname === '/garage',
    },
    {
      label: 'Host Ride',
      to: '/host',
      icon: PlusCircle,
      isActive: location.pathname === '/host',
      highlight: true,
    },
    {
      label: 'Connect Ride',
      to: '/connect',
      icon: QrCode,
      isActive: location.pathname === '/connect',
    },
    {
      label: 'My Rides',
      to: '/dashboard?tab=joined',
      icon: Compass,
      isActive: location.pathname === '/dashboard' && activeTab === 'joined',
    },
    {
      label: 'Live Ride',
      to: isTracking && activeRideId ? `/rides/live/${activeRideId}` : '/dashboard?tab=live',
      icon: Radio,
      isActive: location.pathname.startsWith('/rides/live') || (location.pathname === '/dashboard' && activeTab === 'live'),
      badge: isTracking ? 'LIVE' : undefined,
    },
    {
      label: 'Riders',
      to: '/dashboard?tab=riders',
      icon: Users,
      isActive: location.pathname === '/dashboard' && activeTab === 'riders',
    },
    {
      label: 'Routes',
      to: '/dashboard?tab=routes',
      icon: MapPin,
      isActive: location.pathname === '/dashboard' && activeTab === 'routes',
    },
    {
      label: 'Fuel & Expenses',
      to: '#',
      icon: Fuel,
      isActive: false,
      comingSoon: true,
    },
    {
      label: 'Community',
      to: '/dashboard?tab=community',
      icon: Globe,
      isActive: location.pathname === '/dashboard' && activeTab === 'community',
    },
    {
      label: 'Profile',
      to: '/settings',
      icon: User,
      isActive: location.pathname === '/settings',
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: Settings,
      isActive: location.pathname === '/settings',
    },
  ];

  return (
    <aside className="ridex-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
        <img
          src="/ridex-logo.png"
          alt="RIDEX Official Logo"
          className="sidebar-logo"
        />
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">
            RIDE<span style={{ color: 'var(--primary)' }}>X</span>
          </div>
          <div className="sidebar-brand-tagline">
            RIDE CONNECTED.<br />EXPLORE FURTHER.
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          const Icon = item.icon;

          if (item.comingSoon) {
            return (
              <div
                key={idx}
                className="sidebar-link disabled"
                title="Telemetry fuel tracking coming in next update"
              >
                <Icon size={18} className="sidebar-icon" />
                <span className="sidebar-link-text">{item.label}</span>
                <span className="sidebar-soon-badge">SOON</span>
              </div>
            );
          }

          return (
            <NavLink
              key={idx}
              to={item.to}
              className={`sidebar-link ${item.isActive ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
            >
              <Icon size={18} className="sidebar-icon" />
              <span className="sidebar-link-text">{item.label}</span>
              {item.badge && (
                <span className="sidebar-live-pill">{item.badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Decorative Bottom Adventure Banner */}
      <div className="sidebar-promo-card">
        <div className="promo-glow"></div>
        <div className="promo-badge">
          <Sparkles size={11} color="var(--primary)" />
          <span>RIDEX EXPEDITION</span>
        </div>
        <div className="promo-title">MORE ROADS. BETTER STORIES.</div>
        <div className="promo-subtitle">
          Realtime group radar, separation alerts and offline GPS.
        </div>
      </div>
    </aside>
  );
};
