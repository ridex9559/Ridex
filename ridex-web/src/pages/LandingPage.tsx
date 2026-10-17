/**
 * RIDEX Web — Landing Page
 * Adventure touring hero showcase, core product capabilities, and instant guest or member onboarding.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Compass, Shield, MapPin, Radio, Users, ChevronRight, Fuel, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '32px' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '48px 16px 64px',
          background: 'radial-gradient(ellipse at 50% -20%, rgba(255, 107, 0, 0.22) 0%, rgba(8, 10, 15, 0) 70%)',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div className="badge badge-upcoming" style={{ padding: '6px 14px' }}>
          <Radio size={14} className="pulse-radar" />
          <span>ZERO PAID CLOUD BILLING • 100% COMMUNITY OWNED</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: '850px',
            margin: '0 auto',
          }}
        >
          Ride Together. <br />
          <span className="text-gradient-primary">Ride Smarter.</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '620px',
            margin: '0 auto',
          }}
        >
          The dedicated platform for motorcycle touring squads. Plan multi-stop mountain routes, share unique Ride IDs, track live rider radar positions, and receive automatic separation warnings.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              <span>Enter Cockpit</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
                <span>Create Rider Account</span>
                <ChevronRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '1.05rem' }}>
                <span>Sign In</span>
              </Link>
            </>
          )}
          <Link to="/connect" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '1.05rem', borderColor: 'var(--border-cyan)' }}>
            <Radio size={18} color="var(--cyan)" />
            <span>Join with Ride ID</span>
          </Link>
        </div>
      </section>

      {/* Core Workflow Pillars */}
      <section className="desktop-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Engineered for Motorcycle Touring</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Built specifically for twisting ghats, alpine passes, and connected group squads.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Card 1 */}
          <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 107, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Host & Multi-Stop Routing</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Plan tours with origin, destination, and intermediate waypoints (fuel, scenic lookouts, chai stops). Exact coordinate orders persist across all riders.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={24} color="var(--cyan)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Live Radar & Telemetry</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              See live squad members on an ultra-dark CARTO cockpit map. Track speeds, headings, and rider proximity with zero battery drain.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 59, 48, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="var(--danger)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Separation Alert Engine</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Automatic geodesic distance calculation alerts Road Captains if a rider gets detached by more than 1.0 km, with hysteresis recovery tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Launch Action Banner */}
      <section className="desktop-wrapper">
        <div
          className="card-glass"
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid var(--border-active)',
            background: 'linear-gradient(180deg, rgba(26, 34, 52, 0.8) 0%, rgba(18, 23, 34, 0.95) 100%)',
          }}
        >
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Ready to hit the tarmac?</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.95rem' }}>
            No credit card, no app store delays. Works instantly on Android Chrome and iPhone Safari.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/host" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              <span>Plan a Tour</span>
            </Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
              <span>Browse Active Rides</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
