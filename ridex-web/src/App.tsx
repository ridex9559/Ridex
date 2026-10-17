/**
 * RIDEX Web — Root Application & Navigation Router
 * Supports centered Smartphone Screen presentation (default) and Desktop Command Center mode.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/useAuthStore';
import { useViewModeStore } from './stores/useViewModeStore';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { PhoneStatusBar } from './components/layout/PhoneStatusBar';
import { ViewModeToggle } from './components/layout/ViewModeToggle';
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
import { SafetyCenterPage } from './pages/SafetyCenterPage';
import { CommunityPage } from './pages/CommunityPage';
import { ProfilePage } from './pages/ProfilePage';
import { RideHistoryPage } from './pages/RideHistoryPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';

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
  const { isPhoneFrame } = useViewModeStore();
  const isStartupOrAuth = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <div className={`screen-wrapper ${isPhoneFrame ? 'view-mode-phone' : 'view-mode-desktop'}`}>
      {/* 1-Click Screen Toggle (Phone Screen vs Desktop View) */}
      <ViewModeToggle />

      <div className={`app-container ${isStartupOrAuth ? 'no-nav' : ''}`}>
        {/* Smartphone Hardware Status Bar (Clock, Dynamic Island, 5G, Battery) */}
        {isPhoneFrame && <PhoneStatusBar />}

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
            <Route path="/safety" element={<SafetyCenterPage />} />
            <Route path="/safety/:id" element={<SafetyCenterPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/history" element={<RideHistoryPage />} />
            <Route path="/notifications" element={<NotificationCenterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/garage" replace />} />
          </Routes>
        </main>

        {!isStartupOrAuth && <BottomNav />}

        {/* Smartphone Home Indicator Bar on desktop */}
        {isPhoneFrame && !isStartupOrAuth && (
          <div className="phone-home-indicator-container">
            <div className="phone-home-indicator" />
          </div>
        )}
      </div>
    </div>
  );
};

import { useActiveRideStore } from './stores/useActiveRideStore';

export const App: React.FC = () => {
  const { initialize, user } = useAuthStore();
  const { updateMyLocation, setPermissionGranted } = useActiveRideStore();

  useEffect(() => {
    initialize();

    // Automatically prompt for device GPS location on initial link open
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPermissionGranted(true);
          updateMyLocation({
            userId: user?.id || 'my-device',
            riderName: user?.fullName || 'Rider',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
            accuracy: Math.round(pos.coords.accuracy),
            updatedAt: new Date().toISOString(),
          });
        },
        (err) => {
          console.warn('[RIDEX] Geolocation permission status:', err.message);
          setPermissionGranted(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }
  }, [initialize, user?.id, user?.fullName, updateMyLocation, setPermissionGranted]);

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
