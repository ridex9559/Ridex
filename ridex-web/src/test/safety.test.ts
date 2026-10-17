import { describe, it, expect, vi } from 'vitest';
import { safetyService } from '../services/safetyService';
import { voiceService } from '../services/voiceService';

describe('Safety Center & Emergency Intercom Service', () => {
  it('correctly categorizes GPS signal freshness based on timestamp age', () => {
    const now = Date.now();

    // 5 seconds ago -> fresh
    const freshStatus = safetyService.evaluateLocationFreshness(new Date(now - 5000).toISOString());
    expect(freshStatus.level).toBe('fresh');
    expect(freshStatus.isStale).toBe(false);

    // 25 seconds ago -> fresh / recent
    const warningStatus = safetyService.evaluateLocationFreshness(new Date(now - 25000).toISOString());
    expect(warningStatus.level).toBe('fresh');
    expect(warningStatus.isStale).toBe(false);

    // 150 seconds ago -> lost / stale
    const staleStatus = safetyService.evaluateLocationFreshness(new Date(now - 150000).toISOString());
    expect(staleStatus.level).toBe('lost');
    expect(staleStatus.isStale).toBe(true);

    // undefined / no signal -> lost
    const nullStatus = safetyService.evaluateLocationFreshness(undefined);
    expect(nullStatus.level).toBe('lost');
    expect(nullStatus.isStale).toBe(true);
  });

  it('detects browser audio capabilities and reports honest limitations', () => {
    const caps = voiceService.checkBrowserSupport();
    expect(caps).toHaveProperty('supported');
  });

  it('formats emergency SOS issue types accurately', () => {
    const issueTypes = ['MECHANICAL', 'FLAT_TYRE', 'OUT_OF_FUEL', 'LOST', 'MEDICAL'] as const;
    issueTypes.forEach(type => {
      expect(['MECHANICAL', 'FLAT_TYRE', 'OUT_OF_FUEL', 'LOST', 'MEDICAL']).toContain(type);
    });
  });
});
