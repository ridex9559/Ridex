/**
 * RIDEX Web — Mobile Cockpit Bottom Navigation Bar
 * Fast tab switching between Dashboard, Garage, Host Ride, Connect Ride, and Settings.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Warehouse, PlusCircle, QrCode, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/garage"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Warehouse size={22} />
        <span>Garage</span>
      </NavLink>

      <NavLink
        to="/dashboard"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Compass size={22} />
        <span>Rides</span>
      </NavLink>

      <NavLink
        to="/host"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <PlusCircle size={24} color="var(--primary)" />
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Host Ride</span>
      </NavLink>

      <NavLink
        to="/connect"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <QrCode size={22} />
        <span>Connect</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
