/**
 * RIDEX Web — Root Application & Navigation Router
 * Mobile-first adventure cockpit with TanStack Query and Zustand providers.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/useAuthStore';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { GaragePage } from './pages/GaragePage';
import { HostRidePage } from './pages/HostRidePage';
import { RideDetailsPage } from './pages/RideDetailsPage';
import { LiveRideCockpitPage } from './pages/LiveRideCockpitPage';
import { ConnectRidePage } from './pages/ConnectRidePage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

const AppShell: React.FC = () => {
  const location = useLocation();
  const isStartupOrAuth = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <div className={`app-container ${isStartupOrAuth ? 'no-nav' : ''}`}>
      {!isStartupOrAuth && <Header />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/garage" element={<GaragePage />} />
          <Route path="/host" element={<HostRidePage />} />
          <Route path="/rides/:id" element={<RideDetailsPage />} />
          <Route path="/rides/live/:id" element={<LiveRideCockpitPage />} />
          <Route path="/connect" element={<ConnectRidePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/garage" replace />} />
        </Routes>
      </main>

      {!isStartupOrAuth && <BottomNav />}
    </div>
  );
};

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
