import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background.dark },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="update-password" options={{ headerShown: false }} />
    </Stack>
  );
}
