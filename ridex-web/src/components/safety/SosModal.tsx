/**
 * RIDEX Web — Emergency SOS Dispatch Modal (2-Step Confirmation)
 * Prevents accidental activations, categorizes emergency (Flat Tyre, Mechanical, Fuel, Medical, Lost),
 * provides offline emergency instructions, and records genuine emergency alerts.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Wrench,
  Fuel,
  Compass,
  HeartPulse,
  X,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { safetyService } from '../../services/safetyService';

interface SosModalProps {
  isOpen?: boolean;
  rideId: string;
  userId?: string;
  riderName?: string;
  currentLat?: number;
  currentLng?: number;
  onClose: () => void;
  onSuccess?: (alert: any) => void;
  onSosSent?: (alert: any) => void;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen = true,
  rideId,
  userId = 'guest-rider',
  riderName = 'Rider',
  currentLat = 18.5204,
  currentLng = 73.8567,
  onClose,
  onSuccess,
  onSosSent,
}) => {
  if (isOpen === false) {
    return null;
  }

  const [step, setStep] = useState<'CATEGORY' | 'CONFIRM'>('CATEGORY');
  const [issueType, setIssueType] = useState<
    'FLAT_TYRE' | 'MECHANICAL' | 'OUT_OF_FUEL' | 'MEDICAL' | 'LOST'
  >('MECHANICAL');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    { type: 'MECHANICAL', label: 'Mechanical Issue', icon: Wrench, color: 'var(--primary)', desc: 'Engine, chain, or electrical failure' },
    { type: 'FLAT_TYRE', label: 'Flat Tyre / Puncture', icon: AlertTriangle, color: 'var(--gold)', desc: 'Tyre puncture or pressure loss' },
    { type: 'OUT_OF_FUEL', label: 'Fuel Depleted', icon: Fuel, color: '#E040FB', desc: 'Need squad fuel transfer or jerrycan' },
    { type: 'LOST', label: 'Separated / Lost', icon: Compass, color: 'var(--cyan)', desc: 'Lost visual of squad formation' },
    { type: 'MEDICAL', label: 'Medical / Crash', icon: HeartPulse, color: 'var(--danger)', desc: 'Rider injury or medical assistance' },
  ] as const;

  const handleConfirmSos = async () => {
    setIsSending(true);
    setErrorMessage('');

    if (!navigator.onLine) {
      setErrorMessage(
        'Device is currently OFFLINE. The SOS alert cannot reach squad servers. If this is life-threatening, dial 112 / 911 directly from your phone.'
      );
      setIsSending(false);
      return;
    }

    const res = await safetyService.triggerSos({
      rideId,
      userId,
      riderName,
      issueType,
      latitude: currentLat,
      longitude: currentLng,
      note: note.trim() || undefined,
    });

    setIsSending(false);

    if (res.success && res.alert) {
      if (onSuccess) onSuccess(res.alert);
      if (onSosSent) onSosSent(res.alert);
      onClose();
    } else {
      setErrorMessage(res.error || 'Failed to dispatch SOS alert. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
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
          border: '2px solid var(--danger)',
          boxShadow: '0 0 50px rgba(255, 59, 48, 0.4)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSending}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(255, 59, 48, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={22} color="var(--danger)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
              Squad Emergency SOS
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Step {step === 'CATEGORY' ? '1: Select Issue' : '2: Confirm Broadcast'}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid var(--danger-glow)',
              padding: '10px 12px',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '0.8rem',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'CATEGORY' ? (
          <div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Select the nature of your emergency so nearby squad riders and road captains can prepare appropriate tools:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = issueType === cat.type;

                return (
                  <div
                    key={cat.type}
                    onClick={() => setIssueType(cat.type)}
                    className="card-interactive"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(255, 59, 48, 0.15)' : 'rgba(18, 23, 34, 0.6)',
                      border: isSelected ? '2px solid var(--danger)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: cat.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>{cat.label}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{cat.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={18} color="var(--danger)" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep('CONFIRM')}
              className="btn btn-danger"
              style={{ width: '100%', minHeight: '44px', fontWeight: 800 }}
            >
              Continue to Confirmation
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid var(--danger-glow)', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 800 }}>
                Selected Emergency
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                {categories.find((c) => c.type === issueType)?.label}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                GPS Coordinates: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Optional Note / Landmark (e.g. Mile marker 42, past hair-pin bend):
              </label>
              <input
                type="text"
                placeholder="Brief situation details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-input"
                style={{ minHeight: '42px', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('CATEGORY')}
                disabled={isSending}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: '44px' }}
              >
                Back
              </button>
              <button
                onClick={handleConfirmSos}
                disabled={isSending}
                className="btn btn-danger"
                style={{ flex: 2, minHeight: '44px', fontWeight: 800 }}
              >
                {isSending ? 'Transmitting Alert...' : '🚨 BROADCAST SOS NOW'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
