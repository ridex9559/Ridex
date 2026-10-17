# 🏍️ RIDEX — Authentication & User Account System Architecture

This document outlines the complete technical architecture, security model, flows, and operational procedures for the **RIDEX Authentication & User Account System** implemented in **Step 3**.

---

## 1. Primary Architecture Overview

The RIDEX authentication layer follows a unidirectional, decoupled clean architecture that isolates UI components from low-level authentication SDK details:

```
┌─────────────────────────────────────────────────────────────┐
│                       RIDEX Auth UI                         │
│  (login.tsx, signup.tsx, forgot-password.tsx, verify-email) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    useAuth() Custom Hook                    │
│      (Exposes clean, type-safe API to the presentation)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  useAuthStore (Zustand)                     │
│    (Reactive global state: user, session, isAuthenticated)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        AuthService                          │
│  (Input normalization, validation, profile recovery/sync)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             IAuthRepository / SupabaseAuthRepo              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Client + SecureStore Adapter          │
│       (expo-secure-store on Native / AsyncStorage on Web)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Authentication Features

| Feature | Description | File Location |
| :--- | :--- | :--- |
| **Email Registration** | Full name, unique callsign/username, email, password confirmation, primary bike | `app/auth/signup.tsx` |
| **Email Sign In** | Email and password authentication with rate limiting & error normalization | `app/auth/login.tsx` |
| **Password Visibility** | Secure text toggle with `Eye` / `EyeOff` icons and accessibility labels | `src/components/auth/PasswordInput.tsx` |
| **Sign Out** | Secure session destruction and token purge with confirmation modal | `src/components/auth/SignOutModal.tsx` |
| **Session Restoration** | Automatic token recovery on app launch with encrypted device storage | `src/services/storage/secureStore.ts` |
| **Email Verification** | Dedicated post-registration screen with 60s cooldown timer and email app launcher | `app/auth/verify-email.tsx` |
| **Password Reset** | Privacy-friendly reset link dispatcher | `app/auth/forgot-password.tsx` |
| **Password Update** | Set new password with authenticated recovery session | `app/auth/update-password.tsx` |
| **Profile Creation** | Idempotent automatic PostgreSQL profile sync (`profiles.id === auth.users.id`) | `src/repositories/supabase/SupabaseAuthRepository.ts` |
| **Protected Navigation** | Centralized router guard preventing unauthenticated access to tabs and cockpit | `app/index.tsx` & `app/_layout.tsx` |

---

## 3. Session Persistence & Security

### Encrypted Storage Adapter (`ExpoSecureStoreAdapter`)
- **Native (iOS & Android)**: Utilizes `expo-secure-store` which encrypts tokens using **iOS Keychain Services** and **Android Keystore System**.
- **Web**: Gracefully falls back to standard `AsyncStorage` / `localStorage`.
- **Zero Plain-Text Credentials**: Passwords are never hashed client-side and never stored in state, AsyncStorage, SQLite, or local files.
- **Sensitive Token Sanitization**: The logger automatically filters out JWT access tokens, refresh tokens, and passwords from console and logs.

```typescript
// src/services/storage/secureStore.ts
export const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};
```

---

## 4. User Registration & Profile Creation Lifecycle

When a rider signs up:

```
RIDER ENTERS SIGNUP DATA
         │
         ▼
CLIENT VALIDATION (Name, Callsign, Email, Password === Confirm)
         │
         ▼
SUPABASE AUTH: auth.signUp()
         │
         ▼
AUTH USER CREATED (UUID)
         │
         ▼
ENSURE POSTGRESQL PROFILE (profiles table)
   - id: auth.user.id
   - full_name: userMetadata.full_name
   - username: userMetadata.username (normalized, unique)
         │
         ▼
VERIFY EMAIL SCREEN (app/auth/verify-email.tsx)
```

---

## 5. Protected Route Guard

The application root (`app/index.tsx`) acts as the single point of truth for initial routing decisions:

```typescript
// app/index.tsx
export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isInitialized: authInitialized } = useAuthStore();
  const { hasCompletedOnboarding, isInitialized: appInitialized } = useAppStore();

  useEffect(() => {
    if (authLoading || !authInitialized || !appInitialized) return;

    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth/login');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [authLoading, authInitialized, appInitialized, isAuthenticated, hasCompletedOnboarding]);

  return <AuthLoadingScreen message="Checking rider session..." />;
}
```

Protected route groups:
- `/(tabs)` (Cockpit, Explore Routes, Live Ride Tracking, Community Feed, Rider Profile)
- `/rides/*` (Ride details, summary, history, analytics)
- `/garage/*` (Motorcycle garage, add bike)
- `/community/*` (Create post, group details, notifications)
- `/settings/*` (Preferences, units, logout)

---

## 6. Supabase Dashboard Configuration Guide

To configure your Supabase cloud backend for RIDEX authentication:

1. **Enable Email Provider**:
   - Go to **Authentication** > **Providers** > **Email**.
   - Enable **Email provider**.
   - (Optional for development) Toggle **Confirm email** as needed.

2. **Configure Redirect URLs**:
   - Go to **Authentication** > **URL Configuration**.
   - Set **Site URL**: `http://192.168.1.7:5000` (or your domain).
   - Add to **Redirect URLs**:
     - `ridex://auth/update-password`
     - `ridex://auth/verify-email`
     - `http://localhost:8081`
     - `http://localhost:5000`
     - `http://192.168.1.7:5000`

---

## 7. Development & Testing Workflow

- **Demo Account**: A quick login shortcut is embedded directly on the Login screen allowing instant one-tap entry with the seeded Lead Road Captain profile (`marcus@ridex.app`).
- **Mock Mode**: When `EXPO_PUBLIC_USE_MOCK_DATA=true`, `MockAuthRepository` operates completely offline without network requirements.
- **Production Cloud Mode**: When `EXPO_PUBLIC_USE_MOCK_DATA=false`, `SupabaseAuthRepository` communicates directly with your cloud PostgreSQL database.
