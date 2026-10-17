/**
 * RIDEX Web — Connect Ride / Enter Squad Ride ID Screen
 * Connects rider to group tours via 8-character join code and submits join request.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rideService } from '../services/rideService';
import { realtimeService } from '../services/realtimeService';
import { useAuthStore } from '../stores/useAuthStore';
import { RideEvent } from '../types';
import { QrCode, Search, Radio, CheckCircle, ArrowRight, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const ConnectRidePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [rideCode, setRideCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundRide, setFoundRide] = useState<RideEvent | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  // Real-time listener and fallback polling for Road Captain approval
  useEffect(() => {
    if (!foundRide || !user) return;
    const isPending =
      foundRide.userParticipationStatus === 'pending' || requestStatus === 'submitted';
    if (!isPending) return;

    // 1. WebSocket listener for instant approval event
    const channel = realtimeService.subscribeToRide(foundRide.id, {
      onApprovalStatus: (payload) => {
        if (payload.userId === user.id) {
          if (payload.status === 'APPROVED') {
            setFoundRide((prev) =>
              prev ? { ...prev, userParticipationStatus: 'approved' } : null
            );
            navigate(`/rides/${foundRide.id}`);
          } else if (payload.status === 'REJECTED') {
            setErrorMsg('Your join request was declined by the Road Captain.');
            setRequestStatus('idle');
            setFoundRide((prev) =>
              prev ? { ...prev, userParticipationStatus: 'rejected' } : null
            );
          }
        }
      },
    });

    // 2. Continuous fallback polling (every 3.5s) to guarantee zero stuck states
    const interval = setInterval(async () => {
      try {
        const fresh = await rideService.getRideById(foundRide.id, user.id);
        if (fresh) {
          if (fresh.userParticipationStatus === 'approved') {
            clearInterval(interval);
            setFoundRide(fresh);
            navigate(`/rides/${fresh.id}`);
          } else if (fresh.userParticipationStatus === 'rejected') {
            clearInterval(interval);
            setErrorMsg('Your join request was declined by the Road Captain.');
            setRequestStatus('idle');
            setFoundRide(fresh);
          }
        }
      } catch {}
    }, 3500);

    return () => {
      clearInterval(interval);
      realtimeService.unsubscribeFromRide(foundRide.id);
    };
  }, [foundRide?.id, foundRide?.userParticipationStatus, requestStatus, user?.id, navigate]);

  const handleManualCheckStatus = async () => {
    if (!foundRide || !user) return;
    setCheckingApproval(true);
    try {
      const fresh = await rideService.getRideById(foundRide.id, user.id);
      if (fresh) {
        setFoundRide(fresh);
        if (fresh.userParticipationStatus === 'approved') {
          navigate(`/rides/${fresh.id}`);
        } else if (fresh.userParticipationStatus === 'rejected') {
          setErrorMsg('Your join request was declined by the Road Captain.');
          setRequestStatus('idle');
        }
      }
    } catch {}
    finally {
      setCheckingApproval(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = rideCode.trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    setErrorMsg('');
    setFoundRide(null);

    try {
      const ride = await rideService.getRideByCode(clean, user?.id);
      if (!ride) {
        setErrorMsg(`No tour found with code "${clean}". Please verify with your Road Captain.`);
      } else {
        setFoundRide(ride);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error looking up ride code.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!foundRide) return;

    setRequestStatus('submitting');
    try {
      await rideService.requestToJoinRide(foundRide.id, user.id);
      await realtimeService.broadcastJoinRequest(foundRide.id, {
        userId: user.id,
        riderName: user.fullName,
        requestedAt: new Date().toISOString(),
      });
      setRequestStatus('submitted');
      setFoundRide((prev) => (prev ? { ...prev, userParticipationStatus: 'pending' } : null));
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to submit join request.');
      setRequestStatus('idle');
    }
  };

  return (
    <div className="desktop-wrapper" style={{ maxWidth: '520px', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-secondary"
        style={{ alignSelf: 'flex-start', minHeight: '34px', padding: '4px 12px', fontSize: '0.8rem' }}
      >
        <ArrowLeft size={14} />
        <span>Back to Dashboard</span>
      </button>

      <div className="card-glass" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={24} color="var(--cyan)" className="pulse-radar" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Connect to Squad Ride</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Enter the unique 8-character Ride ID shared by your Road Captain.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid var(--danger)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: '#FFA39E',
            }}
          >
            <AlertCircle size={18} color="var(--danger)" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Ride Code
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                required
                placeholder="e.g. RIDEX-7X92K"
                value={rideCode}
                onChange={(e) => setRideCode(e.target.value.toUpperCase())}
                className="form-input mono"
                style={{ fontSize: '1.1rem', letterSpacing: '0.08em', fontWeight: 700 }}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '0 20px' }}
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        </form>

        {/* Found Ride Card Preview */}
        {foundRide && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-upcoming">TOUR FOUND</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '4px' }}>{foundRide.title}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Organized by {foundRide.organizer?.fullName || 'Road Captain'}
                </div>
              </div>
              <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--cyan)' }}>
                {foundRide.distanceKm} km
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div><b>From:</b> {foundRide.startLocationName}</div>
              <div><b>To:</b> {foundRide.destinationName}</div>
              <div><b>Date:</b> {foundRide.rideDate} at {foundRide.departureTime}</div>
            </div>

            {/* Participation Status or Action */}
            {foundRide.userParticipationStatus === 'approved' ? (
              <button
                onClick={() => navigate(`/rides/${foundRide.id}`)}
                className="btn btn-cyan"
                style={{ width: '100%' }}
              >
                <span>You are Approved! Open Ride Details</span>
                <ArrowRight size={16} />
              </button>
            ) : foundRide.userParticipationStatus === 'pending' || requestStatus === 'submitted' ? (
              <div
                style={{
                  background: 'rgba(255, 176, 32, 0.12)',
                  border: '1px solid var(--gold)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--gold)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Radio size={16} className="pulse-radar" />
                  <span>Join Request Pending Approval</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Awaiting Road Captain confirmation. Your screen will automatically advance once approved.
                </div>
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={checkingApproval}
                  className="btn btn-secondary"
                  style={{ minHeight: '32px', padding: '4px 10px', fontSize: '0.75rem', alignSelf: 'center' }}
                >
                  <RefreshCw size={12} className={checkingApproval ? 'spin' : ''} />
                  <span>{checkingApproval ? 'Checking...' : 'Check Status Now'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={requestStatus === 'submitting'}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <CheckCircle size={18} />
                <span>{requestStatus === 'submitting' ? 'Submitting...' : 'Submit Join Request'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
