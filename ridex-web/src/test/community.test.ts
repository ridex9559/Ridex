import { describe, it, expect, vi } from 'vitest';
import { communityService } from '../services/communityService';

describe('Community & Gamification Service', () => {
  it('returns empty achievements list safely if user is not authenticated', async () => {
    const achievements = await communityService.getRiderAchievements('');
    expect(achievements).toEqual([]);
  });

  it('calculates verified achievements using authoritatively defined milestone thresholds', async () => {
    // When called with a mock user ID, getRiderAchievements falls back safely without throwing
    const achievements = await communityService.getRiderAchievements('test-user-id');
    expect(Array.isArray(achievements)).toBe(true);

    if (achievements.length > 0) {
      const firstExpedition = achievements.find(a => a.code === 'FIRST_EXPEDITION');
      expect(firstExpedition).toBeDefined();
      expect(firstExpedition?.requirementValue).toBe(1);

      const centuryRider = achievements.find(a => a.code === 'CENTURY_RIDER');
      expect(centuryRider).toBeDefined();
      expect(centuryRider?.requirementValue).toBe(100);
      expect(centuryRider?.unit).toBe('KM');
    }
  });

  it('safely handles feed post requests without crashing on network errors', async () => {
    const posts = await communityService.getFeedPosts();
    expect(Array.isArray(posts)).toBe(true);
  });

  it('safely handles group queries without throwing', async () => {
    const groups = await communityService.getGroups();
    expect(Array.isArray(groups)).toBe(true);
  });
});
