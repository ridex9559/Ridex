/**
 * RIDEX Web — React Error Boundary
 * Intercepts uncaught component rendering exceptions and displays an adventure cockpit recovery UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught rendering exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <div
            className="card-glass"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid var(--danger)',
              boxShadow: '0 0 32px rgba(255, 59, 48, 0.2)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 48, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={32} color="var(--danger)" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Cockpit Telemetry Interrupted</h2>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              An unexpected component rendering error occurred. Your active ride session and garage data remain safe.
            </p>

            {this.state.error && (
              <div
                className="mono"
                style={{
                  background: 'var(--bg-surface)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#FFA39E',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', width: '100%' }}>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <RefreshCw size={16} />
                <span>Reload Cockpit</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <Home size={16} />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
