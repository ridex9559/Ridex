/**
 * RIDEX Web — Mobile Cockpit Bottom Navigation Bar
 * Persistent five-item bottom navigation: Garage, Dashboard, Host Ride, Safety Center, and Community.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Warehouse, ShieldAlert, Users, Plus } from 'lucide-react';
import { useActiveRideStore } from '../../stores/useActiveRideStore';

export const BottomNav: React.FC = () => {
  const { activeSos } = useActiveRideStore();

  return (
    <nav className="bottom-nav" aria-label="Bottom Cockpit Navigation">
      {/* 1. Garage */}
      <NavLink
        to="/garage"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        aria-label="Garage"
      >
        <Warehouse size={20} />
        <span>Garage</span>
      </NavLink>

      {/* 2. Dashboard / Radar */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        aria-label="Dashboard"
      >
        <Compass size={20} />
        <span>Dashboard</span>
      </NavLink>

      {/* 3. Host Ride (Elevated Center Quick Action) */}
      <NavLink
        to="/host"
        className={({ isActive }) => `nav-item nav-item-host ${isActive ? 'active' : ''}`}
        aria-label="Host Ride"
      >
        <div className="host-trigger-circle">
          <Plus size={22} strokeWidth={2.8} />
        </div>
        <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em' }}>HOST</span>
      </NavLink>

      {/* 4. Safety Center */}
      <NavLink
        to="/safety"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        aria-label="Safety Center"
      >
        <ShieldAlert size={21} color={activeSos ? 'var(--danger)' : undefined} className={activeSos ? 'blink-beacon' : ''} />
        <span style={activeSos ? { color: 'var(--danger)', fontWeight: 800 } : undefined}>Safety</span>
      </NavLink>

      {/* 5. Community */}
      <NavLink
        to="/community"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        aria-label="Community"
      >
        <Users size={20} />
        <span>Community</span>
      </NavLink>
    </nav>
  );
};

