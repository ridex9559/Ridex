/**
 * RIDEX Web — Verified Achievements & Milestones Grid
 * Displays genuine milestones earned from verified ride history, hosted tours, and garage records.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  Shield,
  Navigation,
  Bike,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import { Achievement } from '../../types';

interface AchievementsGridProps {
  userId?: string;
}

export const AchievementsGrid: React.FC<AchievementsGridProps> = ({ userId }) => {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => (userId ? communityService.getRiderAchievements(userId) : Promise.resolve([])),
    enabled: !!userId,
  });

  const getIcon = (iconName: string, isEarned: boolean) => {
    const color = isEarned ? 'var(--primary)' : 'var(--text-muted)';
    switch (iconName) {
      case 'Compass':
        return <Compass size={22} color={color} />;
      case 'Shield':
        return <Shield size={22} color={color} />;
      case 'Navigation':
        return <Navigation size={22} color={color} />;
      case 'Bike':
        return <Bike size={22} color={color} />;
      default:
        return <Sparkles size={22} color={color} />;
    }
  };

  const earnedCount = achievements.filter((a) => a.isEarned).length;

  return (
    <div className="card-glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="var(--primary)" />
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Touring Milestones</h4>
        </div>

        <span
          className="badge"
          style={{
            background: 'rgba(255, 107, 0, 0.15)',
            color: 'var(--primary)',
            border: '1px solid var(--border-active)',
          }}
        >
          {earnedCount} / {achievements.length} Unlocked
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Calculating verified milestones...
          </div>
        ) : (
          achievements.map((ach) => (
            <div
              key={ach.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: ach.isEarned ? 'rgba(255, 107, 0, 0.06)' : 'rgba(18, 23, 34, 0.6)',
                border: ach.isEarned ? '1px solid rgba(255, 107, 0, 0.25)' : '1px solid var(--border-subtle)',
                position: 'relative',
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: ach.isEarned ? 'rgba(255, 107, 0, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getIcon(ach.icon, ach.isEarned)}
              </div>

              {/* Text Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: ach.isEarned ? '#FFFFFF' : 'var(--text-secondary)' }}>
                    {ach.title}
                  </span>
                  {ach.isEarned ? (
                    <CheckCircle2 size={13} color="var(--success)" />
                  ) : (
                    <Lock size={12} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                  {ach.description}
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: '6px', width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.round(ach.progress * 100)}%`,
                      height: '100%',
                      background: ach.isEarned ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
