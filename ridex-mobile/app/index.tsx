import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isInitialized: authInitialized } = useAuthStore();
  const { hasCompletedOnboarding, isInitialized: appInitialized } = useAppStore();

  useEffect(() => {
    if (authLoading || !authInitialized || !appInitialized) return;

    // Instant navigation decision once auth state is settled
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth/login');
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [authLoading, authInitialized, appInitialized, isAuthenticated, hasCompletedOnboarding]);

  return <AuthLoadingScreen message="Checking rider session..." />;
}
