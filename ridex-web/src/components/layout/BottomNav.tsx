/**
 * RIDEX Web — Mobile Cockpit Bottom Navigation Bar
 * Fast tab switching between Dashboard, Garage, Host Ride, Connect Ride, and Settings.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Warehouse, ShieldAlert, Users, User } from 'lucide-react';
import { useActiveRideStore } from '../../stores/useActiveRideStore';

export const BottomNav: React.FC = () => {
  const { activeSos } = useActiveRideStore();

  return (
    <nav className="bottom-nav">
      <NavLink
        to="/garage"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Warehouse size={20} />
        <span>Garage</span>
      </NavLink>

      <NavLink
        to="/dashboard"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Compass size={20} />
        <span>Rides</span>
      </NavLink>

      <NavLink
        to="/safety"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <ShieldAlert size={22} color={activeSos ? 'var(--danger)' : 'var(--primary)'} />
        <span style={{ color: activeSos ? 'var(--danger)' : 'var(--primary)', fontWeight: 700 }}>Safety</span>
      </NavLink>

      <NavLink
        to="/community"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Users size={20} />
        <span>Community</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
