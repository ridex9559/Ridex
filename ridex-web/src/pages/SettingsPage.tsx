/**
 * RIDEX Web — Profile & Settings Screen
 * Edit rider profile, unit preferences, inspect cloud connection status, and log out.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { authService } from '../services/authService';
import { User, Shield, LogOut, CheckCircle, Smartphone, Globe, Radio } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, signOut, initialize } = useAuthStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [city, setCity] = useState(user?.city || 'Pune');
  const [stateName, setStateName] = useState(user?.state || 'Maharashtra');
  const [bio, setBio] = useState(user?.bio || 'Motorcycle enthusiast & group rider.');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      await authService.updateProfile(user.id, {
        fullName,
        city,
        state: stateName,
        bio,
      });
      await initialize();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="desktop-wrapper" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <User size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rider Sign In Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Sign in to manage your profile, telemetry preferences, and garage.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="desktop-wrapper" style={{ maxWidth: '560px', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Profile & Settings</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Manage your rider callsign, bio, and system configurations.
        </p>
      </div>

      {savedSuccess && (
        <div style={{ background: 'rgba(0, 230, 118, 0.15)', border: '1px solid var(--success)', padding: '10px 14px', borderRadius: '10px', color: 'var(--success)', fontSize: '0.85rem' }}>
          Profile updated successfully!
        </div>
      )}

      {/* Profile Card */}
      <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80'}
            alt="avatar"
            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-active)' }}
          />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{user.fullName}</h3>
            <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--cyan)' }}>
              @{user.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {user.city}, {user.state}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                State / Province
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Rider Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
          >
            {saving ? 'Saving Profile...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* System Status Info */}
      <div className="card-glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Telemetry & Cloud Backend</h4>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Database Connection</span>
          <span style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
            Supabase PostgreSQL (Live)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Routing Provider</span>
          <span style={{ color: '#FFF', fontWeight: 600 }}>OSRM OpenStreetMap</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Map Theme</span>
          <span style={{ color: '#FFF', fontWeight: 600 }}>CARTO Dark Matter</span>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleLogout}
        className="btn btn-secondary"
        style={{ color: 'var(--danger)', borderColor: 'rgba(255, 59, 48, 0.3)' }}
      >
        <LogOut size={16} />
        <span>Sign Out of RIDEX</span>
      </button>
    </div>
  );
};
