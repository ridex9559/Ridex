/**
 * RIDEX Web — Walkie-Talkie Push-to-Talk (PTT) Intercom Widget
 * Interactive squad voice communication widget with press-and-hold transmission,
 * active speaker indication, and microphone permission management.
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  AlertCircle,
  Headphones,
  CheckCircle2,
  PhoneCall,
  PhoneOff,
} from 'lucide-react';
import { voiceService } from '../../services/voiceService';
import { VoiceChannelState } from '../../types';

interface IntercomWidgetProps {
  rideId: string;
  userId: string;
  userName: string;
}

export const IntercomWidget: React.FC<IntercomWidgetProps> = ({
  rideId,
  userId,
  userName,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceChannelState>(voiceService.getState());
  const [isPressingPtt, setIsPressingPtt] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsub = voiceService.subscribe((state) => {
      setVoiceState(state);
    });
    return () => unsub();
  }, []);

  const handleToggleConnect = async () => {
    if (voiceState.state === 'DISCONNECTED') {
      setErrorMessage('');
      const ok = await voiceService.connect(rideId, userId, userName);
      if (!ok) {
        setErrorMessage('Could not connect to intercom. Check browser microphone capabilities.');
      }
    } else {
      voiceService.disconnect();
    }
  };

  const handlePttDown = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (voiceState.state !== 'CONNECTED') return;

    setIsPressingPtt(true);
    const ok = await voiceService.startTransmitting();
    if (!ok) {
      setIsPressingPtt(false);
      setErrorMessage('Microphone access denied or audio stream busy.');
    }
  };

  const handlePttUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isPressingPtt) return;

    setIsPressingPtt(false);
    voiceService.stopTransmitting();
  };

  const isTransmitting = voiceState.state === 'TRANSMITTING' || isPressingPtt;
  const isConnected = voiceState.state === 'CONNECTED' || voiceState.state === 'TRANSMITTING';

  return (
    <div className="card-glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Headphones size={18} color="var(--cyan)" />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Squad PTT Intercom</h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isConnected ? 'Ultra low-latency audio packet broadcast' : 'Press to join squad voice'}
            </span>
          </div>
        </div>

        <button
          onClick={handleToggleConnect}
          className={`btn ${isConnected ? 'btn-danger' : 'btn-cyan'}`}
          style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
        >
          {isConnected ? (
            <>
              <PhoneOff size={13} />
              <span>Leave Intercom</span>
            </>
          ) : (
            <>
              <PhoneCall size={13} />
              <span>Join Channel</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div style={{ background: 'rgba(255, 59, 48, 0.15)', border: '1px solid var(--danger-glow)', padding: '8px 12px', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.75rem', display: 'flex', gap: '6px' }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Intercom Status & Active Speaker */}
      <div
        style={{
          background: isTransmitting
            ? 'rgba(255, 107, 0, 0.15)'
            : voiceState.activeSpeaker
            ? 'rgba(0, 229, 255, 0.15)'
            : 'rgba(18, 23, 34, 0.7)',
          border: isTransmitting
            ? '1.5px solid var(--primary)'
            : voiceState.activeSpeaker
            ? '1.5px solid var(--cyan)'
            : '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: isTransmitting ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            {isTransmitting ? <Radio size={18} className="pulse-radar" /> : <Volume2 size={18} />}
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF' }}>
              {isTransmitting
                ? 'TRANSMITTING SQUAD AUDIO'
                : voiceState.activeSpeaker
                ? `${voiceState.activeSpeaker.userName} SPEAKING`
                : isConnected
                ? 'CHANNEL STANDBY (LISTENING)'
                : 'INTERCOM DISCONNECTED'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isConnected ? 'Channel: Squad Main • Full Duplex PTT' : 'Join channel to speak with squad riders'}
            </div>
          </div>
        </div>

        <span
          className="badge"
          style={{
            fontSize: '0.68rem',
            background: isTransmitting
              ? 'rgba(255, 107, 0, 0.25)'
              : isConnected
              ? 'rgba(0, 230, 118, 0.15)'
              : 'rgba(255, 255, 255, 0.08)',
            color: isTransmitting ? 'var(--primary)' : isConnected ? 'var(--success)' : 'var(--text-muted)',
          }}
        >
          {voiceState.state}
        </span>
      </div>

      {/* Push-to-Talk Big Button */}
      {isConnected && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <button
            onMouseDown={handlePttDown}
            onMouseUp={handlePttUp}
            onTouchStart={handlePttDown}
            onTouchEnd={handlePttUp}
            style={{
              width: '100%',
              minHeight: '58px',
              borderRadius: '14px',
              border: isTransmitting ? '2px solid var(--primary-bright)' : '2px solid var(--border-cyan)',
              background: isTransmitting
                ? 'linear-gradient(135deg, var(--primary), var(--primary-bright))'
                : 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(26, 34, 52, 0.95) 100%)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              boxShadow: isTransmitting ? '0 0 30px var(--primary-glow)' : 'none',
              transform: isTransmitting ? 'scale(0.985)' : 'none',
              transition: 'all 0.1s ease',
            }}
          >
            <Mic size={22} className={isTransmitting ? 'blink-beacon' : ''} />
            <span>{isTransmitting ? 'RELEASE TO FINISH' : 'HOLD TO TALK (PTT)'}</span>
          </button>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Press and hold to broadcast your voice to all riders in this tour.
          </span>
        </div>
      )}
    </div>
  );
};
