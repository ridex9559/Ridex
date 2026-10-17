/**
 * RIDEX Web — Rider Registration Screen
 * Enrolls new rider profile and initiates authenticated session.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';
import { Compass, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { initialize } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authService.signUp(email, password, fullName, username);
      await initialize();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[RegisterPage] Sign up error:', err);
      setErrorMsg(err.message || 'Failed to create account. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="desktop-wrapper" style={{ maxWidth: '460px', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Create Rider Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Join the RIDEX motorcycle touring network. Free forever.
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

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aryan Deshmukh"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Rider Callsign / Handle
            </label>
            <input
              type="text"
              required
              placeholder="e.g. aryan_ghats"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="form-input"
            />
          </div>

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
              Password (min. 6 characters)
            </label>
            <input
              type="password"
              autoComplete="new-password"
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
            <UserPlus size={18} />
            <span>{loading ? 'Creating Account...' : 'Register & Launch Cockpit'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
