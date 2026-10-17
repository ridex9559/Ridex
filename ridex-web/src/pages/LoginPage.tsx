/**
 * RIDEX Web — Rider Login Screen
 * Authenticates with Supabase Auth, handles errors gracefully, and restores session.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';
import { Compass, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { initialize } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await authService.signIn(email, password);
      await initialize();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[LoginPage] Sign in error:', err);
      setErrorMsg(err.message || 'Invalid email or password. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="desktop-wrapper" style={{ maxWidth: '440px', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button
        onClick={() => navigate('/')}
        className="btn btn-secondary"
        style={{ alignSelf: 'flex-start', minHeight: '36px', padding: '6px 12px', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      <div className="card-glass" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF6B00, #FF8533)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={24} color="#FFF" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rider Sign In</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Enter your credentials to access your garage and group tours.
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="rider@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
          >
            <LogIn size={18} />
            <span>{loading ? 'Authenticating...' : 'Sign In to Cockpit'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};
