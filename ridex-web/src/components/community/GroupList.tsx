import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  MapPin,
  Check,
  LogOut,
  Loader2,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import { RiderGroup } from '../../types';
import { communityService } from '../../services/communityService';
import { useAuthStore } from '../../stores/useAuthStore';

interface GroupListProps {
  onSelectGroup?: (group: RiderGroup) => void;
}

export const GroupList: React.FC<GroupListProps> = ({ onSelectGroup }) => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<RiderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRegion, setNewGroupRegion] = useState('Western Ghats');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await communityService.getGroups(user?.id);
      setGroups(res);
    } catch (e) {
      console.error('Failed to load groups:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user?.id]);

  const handleToggleJoin = async (group: RiderGroup) => {
    if (!user) return;
    setJoiningId(group.id);
    try {
      const ok = await communityService.toggleJoinGroup(group.id, user.id, !!group.isJoinedByMe);
      if (ok) {
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === group.id) {
              const joined = !g.isJoinedByMe;
              return {
                ...g,
                isJoinedByMe: joined,
                membersCount: joined ? g.membersCount + 1 : Math.max(1, g.membersCount - 1),
                myRole: joined ? 'member' : undefined,
              };
            }
            return g;
          })
        );
      }
    } catch (e) {
      console.error('Failed toggle join group:', e);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const ok = await communityService.createGroup(user.id, {
        name: newGroupName,
        region: newGroupRegion,
        description: newGroupDesc,
      });

      if (ok) {
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
        await loadGroups();
      } else {
        setErrorMsg('Could not create chapter. Please check connection and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating group.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header controls bar */}
      <div
        className="card-glass"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Users size={18} color="var(--primary)" />
            Touring Squads & Motorcycle Clubs
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Enlist in regional riding chapters, coordinate group excursions, and ride with verified squadrons.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <Plus size={15} />
            <span>Form New Squad</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="pulse-radar" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <p style={{ fontSize: '0.84rem' }}>Loading touring squadrons & chapters...</p>
        </div>
      ) : groups.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 107, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>No Squads Registered Yet</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '380px', marginTop: '4px' }}>
              Be the first Road Captain to form a regional touring chapter in your territory.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ minHeight: '36px', padding: '6px 16px', fontSize: '0.82rem' }}
            >
              <Plus size={14} />
              <span>Create First Squad</span>
            </button>
          )}
        </div>
      ) : (
        /* Squads Grid */
        <div className="squads-grid">
          {groups.map((group) => {
            const isOwner = group.myRole === 'owner';
            const isMember = group.isJoinedByMe;

            return (
              <div key={group.id} className="squad-card card-interactive">
                {/* Banner / Cover */}
                <div className="squad-banner">
                  <img
                    src={group.coverImageUrl}
                    alt={group.name}
                    className="squad-banner-img"
                    loading="lazy"
                  />
                  <div className="squad-banner-gradient" />

                  {/* Territory Badge */}
                  <div className="squad-banner-badges">
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(8, 10, 15, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <MapPin size={11} />
                      {group.region}
                    </span>

                    {isOwner && (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(255, 107, 0, 0.25)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid var(--primary)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Shield size={11} />
                        CAPTAIN
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="squad-body">
                  <div>
                    <h4 className="squad-name">{group.name}</h4>
                    <p className="squad-desc">
                      {group.description || 'Dedicated to safe group touring and high-altitude mountain expeditions.'}
                    </p>
                  </div>

                  <div className="squad-footer">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Users size={14} color="var(--cyan)" />
                      <span>
                        {group.membersCount} {group.membersCount === 1 ? 'Rider' : 'Riders'}
                      </span>
                    </div>

                    {user && (
                      <button
                        onClick={() => handleToggleJoin(group)}
                        disabled={joiningId === group.id}
                        className={`btn ${isMember ? 'btn-secondary' : 'btn-primary'}`}
                        style={{
                          minHeight: '32px',
                          padding: '4px 12px',
                          fontSize: '0.78rem',
                          color: isMember ? 'var(--success)' : '#000000',
                          borderColor: isMember ? 'var(--success)' : 'transparent',
                        }}
                      >
                        {joiningId === group.id ? (
                          <Loader2 size={13} className="pulse-radar" />
                        ) : isMember ? (
                          <>
                            <Check size={13} />
                            <span>Enlisted</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Enlist</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form New Squad Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 107, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Shield size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>Form Touring Squad</h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Register an official RIDEX chapter</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255, 59, 48, 0.15)',
                  border: '1px solid var(--danger)',
                  borderRadius: '10px',
                  color: 'var(--danger)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Squad / Chapter Name *
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Sahyadri Ridge Riders"
                  className="form-input"
                  style={{ minHeight: '38px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Operational Territory
                </label>
                <input
                  type="text"
                  value={newGroupRegion}
                  onChange={(e) => setNewGroupRegion(e.target.value)}
                  placeholder="e.g. Pune & Western Ghats"
                  className="form-input"
                  style={{ minHeight: '38px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Mission & Touring Philosophy
                </label>
                <textarea
                  rows={3}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Describe your squadron's riding ethos, preferred route types, pace..."
                  className="form-input"
                  style={{ fontSize: '0.84rem', resize: 'none', padding: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !newGroupName.trim()}
                  className="btn btn-primary"
                  style={{ minHeight: '36px', padding: '6px 16px', fontSize: '0.82rem' }}
                >
                  {submitting ? <Loader2 size={14} className="pulse-radar" /> : <span>Register Chapter</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
