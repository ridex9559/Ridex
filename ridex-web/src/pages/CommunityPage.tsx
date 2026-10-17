/**
 * RIDEX Web — Rider Community & Syndicate Hub
 * Features:
 * - Community social feed (posts, media, rider updates, likes, comments)
 * - Squadrons & regional riding chapters (group discovery, creation, join/leave)
 * - Authentic verified milestones & achievements
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Award,
  History,
  Bell,
  Shield,
  Compass,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { CommunityFeed } from '../components/community/CommunityFeed';
import { GroupList } from '../components/community/GroupList';
import { AchievementsGrid } from '../components/community/AchievementsGrid';
import { useAuthStore } from '../stores/useAuthStore';

type TabType = 'feed' | 'groups' | 'achievements';

export const CommunityPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  return (
    <div className="community-wrapper">
      {/* 1. Cinematic Adventure Hero Banner */}
      <div className="community-hero-card">
        <div className="community-hero-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="community-tagline-badge">
                <Flame size={13} />
                Rider Community & Syndicate
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                • Official Touring Network
              </span>
            </div>

            <h1 className="community-title">
              Touring Syndicate & Squadrons
            </h1>

            <p className="community-subtitle">
              Connect with verified riders, coordinate group expeditions across high-altitude passes, and celebrate authentic touring milestones.
            </p>
          </div>

          {/* Quick Route Navigators */}
          <div className="community-quick-actions">
            <button
              onClick={() => navigate('/history')}
              className="btn btn-secondary"
              style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <History size={14} color="var(--primary)" />
              <span>Tour History</span>
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="btn btn-secondary"
              style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Bell size={14} color="var(--cyan)" />
              <span>Notifications</span>
            </button>

            {user && (
              <button
                onClick={() => navigate('/profile')}
                className="btn btn-primary"
                style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <Shield size={14} />
                <span>My Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Glowing Nav Tabs */}
      <div className="community-nav-tabs">
        <button
          onClick={() => setActiveTab('feed')}
          className={`community-nav-tab ${activeTab === 'feed' ? 'active' : ''}`}
        >
          <MessageSquare size={16} />
          <span>Expedition Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`community-nav-tab ${activeTab === 'groups' ? 'active' : ''}`}
        >
          <Users size={16} />
          <span>Clubs & Squadrons</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`community-nav-tab ${activeTab === 'achievements' ? 'active' : ''}`}
        >
          <Award size={16} />
          <span>Verified Milestones</span>
        </button>
      </div>

      {/* 3. Tab Body Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeTab === 'feed' && <CommunityFeed currentUserId={user?.id} />}

        {activeTab === 'groups' && <GroupList />}

        {activeTab === 'achievements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="card-glass"
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 176, 32, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold)',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Anti-Fabrication Guarantee
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  All milestones are verified against genuine GPS logs, hosted squad expeditions, and verified odometer distances. Zero mock data.
                </p>
              </div>
            </div>

            <AchievementsGrid userId={user?.id} />
          </div>
        )}
      </div>
    </div>
  );
};
