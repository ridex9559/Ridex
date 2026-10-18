/**
 * RIDEX Web — Rider Cockpit Profile & Garage Credentials
 * Displays authenticated rider telemetry, garage machines, verified stats,
 * and authenticated profile editing using the dark cockpit design system.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { authService } from '../services/authService';
import { garageService } from '../services/garageService';
import { rideService } from '../services/rideService';
import { communityService } from '../services/communityService';
import { AchievementsGrid } from '../components/community/AchievementsGrid';
import { UserProfile, Motorcycle } from '../types';
import {
  User,
  Shield,
  MapPin,
  Calendar,
  Bike,
  Compass,
  Edit3,
  Check,
  X,
  Loader2,
  AlertCircle,
  Award,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { id: paramUserId } = useParams<{ id?: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const targetUserId = paramUserId || user?.id;
  const isMyProfile = user?.id === targetUserId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bikes, setBikes] = useState<Motorcycle[]>([]);
  const [stats, setStats] = useState({
    ridesCount: 0,
    totalKm: 0,
    groupsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  const loadData = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      // 1. Profile
      const prof = await authService.getProfile(targetUserId);
      if (prof) {
        setProfile(prof);
        setFormName(prof.fullName);
        setFormUsername(prof.username);
        setFormBio(prof.bio || '');
        setFormCity(prof.city || '');
        setFormState(prof.state || '');
        setFormAvatar(prof.avatarUrl || '');
      }

      // 2. Motorcycles
      const userBikes = await garageService.getMotorcycles(targetUserId);
      setBikes(userBikes);

      // 3. Genuine Ride Stats
      const userRides = await rideService.getUserRides(targetUserId);
      const totalDistance = userRides.reduce((sum, r) => sum + (Number(r.distanceKm) || 0), 0);

      // 4. Squads
      const groups = await communityService.getGroups(targetUserId);
      const joinedGroups = groups.filter((g) => g.isJoinedByMe);

      setStats({
        ridesCount: userRides.length,
        totalKm: Math.round(totalDistance),
        groupsCount: joinedGroups.length,
      });
    } catch (e) {
      console.error('Failed to load profile data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetUserId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isMyProfile) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const ok = await authService.updateProfile(user.id, {
        fullName: formName.trim(),
        username: formUsername.trim(),
        bio: formBio.trim(),
        city: formCity.trim(),
        state: formState.trim(),
        avatarUrl: formAvatar.trim() || undefined,
      });

      if (ok) {
        setSuccessMsg('Cockpit profile updated successfully.');
        setEditing(false);
        await loadData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg('Failed to update profile. Please check connection.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="pulse-radar" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
        <p style={{ fontSize: '0.85rem' }}>Loading rider credentials & telemetry...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="community-wrapper" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div className="card-glass" style={{ padding: '36px 20px', maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <AlertCircle size={36} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Rider Profile Not Found</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            This rider handle or account does not exist or has been deactivated.
          </p>
          <button onClick={() => navigate('/community')} className="btn btn-primary">
            Return to Community
          </button>
        </div>
      </div>
    );
  }

  const primaryBike = bikes.find((b) => b.isPrimary) || bikes[0];

  return (
    <div className="community-wrapper">
      {/* Top Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/community')}
          className="btn btn-secondary"
          style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.8rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Community</span>
        </button>

        {isMyProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn btn-secondary"
            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            <Edit3 size={14} />
            <span>Edit Credentials</span>
          </button>
        )}
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(0, 230, 118, 0.12)',
            border: '1px solid var(--success)',
            borderRadius: '12px',
            color: 'var(--success)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(255, 59, 48, 0.15)',
            border: '1px solid var(--danger)',
            borderRadius: '12px',
            color: 'var(--danger)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Header Hero Card */}
      <div className="profile-hero-card">
        {/* Cover Graphic */}
        <div className="profile-banner-cover">
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(8, 10, 15, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 107, 0, 0.4)',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--primary)',
            }}
          >
            VERIFIED EXPEDITION RIDER
          </div>
        </div>

        {/* Avatar & Identification */}
        <div className="profile-avatar-container">
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80'}
            alt={profile.fullName}
            className="profile-large-avatar"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '6px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {profile.fullName}
            </h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
              @{profile.username}
            </div>
          </div>
        </div>

        {/* Bio & Details Area */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {editing ? (
            /* In-Place Credentials Editor */
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="form-input"
                    style={{ minHeight: '38px', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Callsign / Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="form-input"
                    style={{ minHeight: '38px', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    City / Base Territory
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="form-input"
                    style={{ minHeight: '38px', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="form-input"
                    style={{ minHeight: '38px', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="https://..."
                  className="form-input"
                  style={{ minHeight: '38px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Rider Bio & Touring Style
                </label>
                <textarea
                  rows={3}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Tell your squad about your touring background, preferred passes..."
                  className="form-input"
                  style={{ fontSize: '0.84rem', resize: 'none', padding: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn btn-secondary"
                  style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ minHeight: '36px', padding: '6px 18px', fontSize: '0.82rem' }}
                >
                  {saving ? <Loader2 size={14} className="pulse-radar" /> : <span>Save Credentials</span>}
                </button>
              </div>
            </form>
          ) : (
            <>
              <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.55 }}>
                {profile.bio || 'Motorcycle touring enthusiast. Exploring mountain routes, coastal highways, and scenic group expeditions.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {(profile.city || profile.state) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} color="var(--cyan)" />
                    <span>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {profile.createdAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>Enlisted {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="profile-stats-row">
        <div className="profile-stat-box card-interactive" onClick={() => navigate('/history')}>
          <div className="profile-stat-label">Verified Distance</div>
          <div className="profile-stat-value" style={{ color: 'var(--primary)' }}>
            {stats.totalKm} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>KM</span>
          </div>
        </div>

        <div className="profile-stat-box card-interactive" onClick={() => navigate('/history')}>
          <div className="profile-stat-label">Expeditions</div>
          <div className="profile-stat-value">
            {stats.ridesCount}
          </div>
        </div>

        <div className="profile-stat-box">
          <div className="profile-stat-label">Touring Squads</div>
          <div className="profile-stat-value" style={{ color: 'var(--cyan)' }}>
            {stats.groupsCount}
          </div>
        </div>
      </div>

      {/* Primary Motorcycle Card */}
      <div className="rx-cockpit-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 107, 0, 0.12)',
                border: '1px solid rgba(255, 107, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Bike size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>Primary Motorcycle Machine</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Configured touring telemetry from Garage</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/garage')}
            className="btn btn-secondary"
            style={{ minHeight: '34px', padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <span>Garage</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {primaryBike ? (
          <div
            style={{
              background: 'rgba(11, 14, 20, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                    {primaryBike.year} {primaryBike.manufacturer} {primaryBike.model}
                  </span>
                  <span className="badge" style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--success)', border: '1px solid rgba(0, 230, 118, 0.3)' }}>
                    PRIMARY MACHINE
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {primaryBike.color} touring setup
                </p>
              </div>

              {primaryBike.registrationNumber && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan)', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)', padding: '4px 10px', borderRadius: '6px' }}>
                  {primaryBike.registrationNumber}
                </div>
              )}
            </div>

            {/* 4-Box Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
              <div className="machine-spec-box">
                <span className="machine-spec-label">Displacement</span>
                <span className="machine-spec-val" style={{ color: 'var(--primary)' }}>
                  {primaryBike.displacementCc} CC
                </span>
              </div>
              <div className="machine-spec-box">
                <span className="machine-spec-label">Fuel Tank</span>
                <span className="machine-spec-val">
                  {primaryBike.fuelTankCapacityL} L
                </span>
              </div>
              <div className="machine-spec-box">
                <span className="machine-spec-label">Avg Mileage</span>
                <span className="machine-spec-val">
                  {primaryBike.fuelEfficiencyKmpl ? `${primaryBike.fuelEfficiencyKmpl} KM/L` : '—'}
                </span>
              </div>
              <div className="machine-spec-box">
                <span className="machine-spec-label">Safe Range</span>
                <span className="machine-spec-val" style={{ color: 'var(--cyan)' }}>
                  {primaryBike.fuelTankCapacityL && primaryBike.fuelEfficiencyKmpl
                    ? `~${Math.round(primaryBike.fuelTankCapacityL * primaryBike.fuelEfficiencyKmpl * 0.9)} KM`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(11, 14, 20, 0.6)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.08)' }}>
            <p style={{ fontSize: '0.82rem' }}>No motorcycle configured in digital garage yet.</p>
            <button
              onClick={() => navigate('/garage')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', marginTop: '8px' }}
            >
              Configure Bike in Garage →
            </button>
          </div>
        )}
      </div>

      {/* Verified Milestones & Achievements */}
      <AchievementsGrid userId={targetUserId} />
    </div>
  );
};
