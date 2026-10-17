/**
 * RIDEX Web — Notification Center
 * Displays authenticated in-app notifications with real-time updates:
 * SOS alerts, ride join requests, approvals, and squad updates.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { notificationService } from '../services/notificationService';
import { AppNotification } from '../types';
import {
  Bell,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CheckCheck,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export const NotificationCenterPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (user?.id) {
      const unsubscribe = notificationService.subscribeToNotifications(
        user.id,
        (newNotif) => {
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
        }
      );
      return () => unsubscribe();
    }
  }, [user?.id]);

  const handleMarkAsRead = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed mark all read:', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'SOS_ALERT':
        return <ShieldAlert size={18} color="var(--danger)" />;
      case 'SEPARATION_WARNING':
        return <AlertTriangle size={18} color="var(--gold)" />;
      case 'JOIN_REQUEST':
      case 'RIDE_INVITE':
        return <Users size={18} color="var(--cyan)" />;
      case 'APPROVAL':
        return <CheckCircle2 size={18} color="var(--success)" />;
      default:
        return <Bell size={18} color="var(--primary)" />;
    }
  };

  return (
    <div className="community-wrapper">
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/community')}
            className="btn btn-secondary"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} />
            <span>Community</span>
          </button>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="var(--primary)" />
              Notifications
              {unreadCount > 0 && (
                <span
                  className="badge"
                  style={{
                    background: 'var(--primary)',
                    color: '#000000',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Real-time squad requests, SOS broadcasts, and tour approvals.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn btn-secondary"
            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.78rem' }}
          >
            {markingAll ? <Loader2 size={13} className="pulse-radar" /> : <CheckCheck size={14} color="var(--primary)" />}
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Honest Browser Notification Disclaimer */}
      <div
        className="card-glass"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <Info size={16} color="var(--cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <b style={{ color: '#FFFFFF' }}>Live In-App Delivery: </b>
          Notifications sync in real time while RIDEX is active. Push notifications when your browser is suspended or phone locked require our native Expo companion app.
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="pulse-radar" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <p style={{ fontSize: '0.84rem' }}>Retrieving live notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Bell size={36} color="var(--text-muted)" />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>All Caught Up</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
            You have no pending notifications. New tour approvals, squad invites, and SOS alerts will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif)}
              className="card-glass card-interactive"
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                borderColor: notif.isRead ? 'var(--border-card)' : 'var(--primary)',
                background: notif.isRead ? 'var(--bg-glass-card)' : 'linear-gradient(135deg, rgba(26, 34, 52, 0.95) 0%, rgba(35, 25, 15, 0.4) 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: notif.type === 'SOS_ALERT' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: notif.type === 'SOS_ALERT' ? '1px solid var(--danger)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getIconForType(notif.type)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: notif.isRead ? 600 : 800, color: '#FFFFFF' }}>
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {notif.body}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <Clock size={11} />
                    <span>
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)', padding: '4px' }}>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
