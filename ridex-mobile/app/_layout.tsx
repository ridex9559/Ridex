import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useBikeStore } from '@/store/bikeStore';
import { authService } from '@/services/auth/AuthService';
import { COLORS } from '@/theme/colors';

import { databaseManager } from '@/services/database/DatabaseManager';
import { syncService } from '@/services/offline/SyncService';
import { locationPermissionService } from '@/services/location/LocationPermissionService';
import { locationService } from '@/services/location/LocationService';
import { useRideTrackingStore } from '@/store/rideTrackingStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const loadStoredSession = useAuthStore(state => state.loadStoredSession);
  const setSessionFromListener = useAuthStore(state => state.setSessionFromListener);
  const initApp = useAppStore(state => state.initApp);
  const fetchMotorcycles = useBikeStore(state => state.fetchMotorcycles);

  useEffect(() => {
    // Bootstrap initial app state, SQLite database, and cached session with non-blocking concurrency
    const bootstrap = async () => {
      try {
        await Promise.allSettled([
          databaseManager.getDatabase().then(() => syncService.init()).catch(() => {}),
          initApp().catch(() => {}),
          loadStoredSession().catch(() => {}),
        ]);

        // Background non-blocking initializations
        fetchMotorcycles().catch(() => {});

        locationPermissionService.requestForegroundPermission().then(async (perm) => {
          if (perm.granted) {
            const pos = await locationService.getCurrentPosition();
            if (pos) {
              useRideTrackingStore.getState().updateLiveMetrics({ currentLocation: pos });
            }
          }
        }).catch(() => {});
      } catch (err) {
        console.warn('Bootstrap initialization error:', err);
      }
    };
    bootstrap();

    // Centralized single auth state listener
    const unsubscribe = authService.initAuthListener((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSessionFromListener(session);
      } else if (event === 'SIGNED_OUT') {
        setSessionFromListener(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background.dark },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="rides/[id]"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="rides/live/[id]"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="rides/history"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="rides/summary"
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="rides/analytics"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="garage/index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="garage/add-bike"
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="community/post/create"
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="community/groups/index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="community/notifications"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings/index"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
