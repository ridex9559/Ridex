/**
 * RIDEX Web — Official Startup & Cinematic Landing Experience
 * Dedicated motorcycle touring brand entrance for unauthenticated visitors.
 * Features official RIDEX helmet-and-mountain logo, mobile-first responsive layout,
 * and direct routing into the authentic RIDEX cockpit.
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { ArrowRight, LogIn, Radio } from 'lucide-react';
import ridexLogo from '../assets/ridex-logo.png';

export const LandingPage: React.FC = () => {
  const { user, isInitialized, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // If already authenticated, bypass startup screen directly into the active garage
  useEffect(() => {
    if (isInitialized && user) {
      navigate('/garage', { replace: true });
    }
  }, [user, isInitialized, navigate]);

  // Loading state while auth session is checked
  if (isLoading && !isInitialized) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-bright))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px var(--primary-glow)',
            animation: 'pulse 1.8s infinite ease-in-out',
          }}
        >
          <Radio size={24} color="#FFFFFF" className="pulse-radar" />
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Initializing Cockpit...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'max(24px, env(safe-area-inset-top)) 20px max(32px, env(safe-area-inset-bottom)) 20px',
        background: 'radial-gradient(circle at 50% 32%, rgba(255, 107, 0, 0.12) 0%, rgba(0, 229, 255, 0.04) 45%, #080A0F 80%)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Telemetry / Status Pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(26, 34, 52, 0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--cyan)',
          fontWeight: 600,
          marginTop: '8px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            boxShadow: '0 0 8px var(--primary)',
            display: 'inline-block',
          }}
        />
        <span>Motorcycle Touring Network</span>
      </div>

      {/* Main Cinematic Visual Centerpiece */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
          maxWidth: '420px',
          margin: 'auto 0',
          padding: '12px 0',
        }}
      >
        {/* Official RIDEX Helmet & Mountain Brand Logo */}
        <div
          style={{
            width: 'min(82vw, 340px)',
            maxWidth: '340px',
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: '16px',
          }}
        >
          {/* Subtle ambient lighting layer behind logo */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 107, 0, 0.22) 0%, rgba(0, 229, 255, 0.08) 50%, transparent 75%)',
              filter: 'blur(20px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <img
            src={ridexLogo}
            alt="RIDEX — Ride Connected. Explore Further."
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.7))',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Short Brand Narrative (Minimal & Clean) */}
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.85rem, 2.4vw, 0.95rem)',
            letterSpacing: '0.04em',
            maxWidth: '320px',
            lineHeight: 1.5,
            margin: '0 auto',
            fontWeight: 400,
          }}
        >
          Live squad radar, multi-stop mountain routes, and group separation safety.
        </p>
      </div>

      {/* Bottom Thumb-Friendly Entry Actions */}
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        {/* Primary Action — Get Started */}
        <Link
          to="/register"
          className="btn btn-primary"
          style={{
            width: '100%',
            minHeight: '52px',
            fontSize: '1.05rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 6px 24px -2px var(--primary-glow)',
            textDecoration: 'none',
          }}
        >
          <span>Get Started</span>
          <ArrowRight size={20} />
        </Link>

        {/* Secondary Action — Existing Member Sign In */}
        <Link
          to="/login"
          style={{
            width: '100%',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--text-primary)',
            background: 'rgba(26, 34, 52, 0.45)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.18s ease, border-color 0.18s ease',
          }}
        >
          <LogIn size={16} color="var(--primary)" />
          <span>Already a rider? Sign In</span>
        </Link>

        {/* Quick Join Option */}
        <Link
          to="/connect"
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            padding: '6px 12px',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Have a Ride ID? <span style={{ color: 'var(--cyan)', marginLeft: '4px', fontWeight: 600 }}>Join Tour</span>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
