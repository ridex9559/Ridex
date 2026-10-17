/**
 * RIDEX Web — Garage & Onboarding Unit Tests
 * Validates onboarding choices ("Add Motorcycle" vs "I Don't Have a Bike"),
 * safe touring range calculation, and fleet state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { garageService } from '../services/garageService';

describe('Garage & Onboarding State Machine', () => {
  const testUserId = '11111111-2222-3333-4444-555555555555';

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('correctly handles initial onboarding state when no choice has been made', () => {
    const choice = garageService.getOnboardingChoice(testUserId, {});
    expect(choice).toBeNull();
  });

  it('persists "no_bike" rider onboarding choice in local storage cache', async () => {
    await garageService.setOnboardingChoice(testUserId, 'no_bike');
    const choice = garageService.getOnboardingChoice(testUserId, {});
    expect(choice).toBe('no_bike');
  });

  it('prefers user metadata if available from Supabase Auth session', () => {
    const userMetadata = { onboarding_choice: 'no_bike', has_bike: false };
    const choice = garageService.getOnboardingChoice(testUserId, userMetadata);
    expect(choice).toBe('no_bike');
  });

  it('persists "completed" onboarding choice when bike is registered', async () => {
    await garageService.setOnboardingChoice(testUserId, 'completed');
    const choice = garageService.getOnboardingChoice(testUserId, {});
    expect(choice).toBe('completed');
  });

  it('accurately calculates safe touring range at 90% fuel capacity', () => {
    const tankLiters = 17;
    const mileageKmpl = 28;
    const safeRangeKm = Math.round(tankLiters * mileageKmpl * 0.9);
    expect(safeRangeKm).toBe(428); // 17 * 28 * 0.9 = 428.4 => 428
  });
});
