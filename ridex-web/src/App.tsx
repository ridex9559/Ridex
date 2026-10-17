/**
 * RIDEX Web — Root Application & Navigation Router
 * Mobile-first adventure cockpit with TanStack Query and Zustand providers.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <div className="app-container">
            <Header />

            <main style={{ flex: 1 }}>
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
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>

            <BottomNav />
          </div>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
