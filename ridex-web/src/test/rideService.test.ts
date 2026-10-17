import { describe, it, expect } from 'vitest';
import { generateUniqueRideCode } from '../services/rideService';

describe('Ride ID & Join Code Generator', () => {
  it('generates codes conforming to RIDEX-XXXXX specification', () => {
    const code = generateUniqueRideCode();
    expect(code).toMatch(/^RIDEX-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
  });

  it('excludes ambiguous characters (0, O, 1, I, L) for readability on helmet HUDs', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateUniqueRideCode();
      const suffix = code.replace('RIDEX-', '');
      expect(suffix).not.toMatch(/[01OILoil]/);
    }
  });

  it('generates distinct collision-resistant codes across multiple iterations', () => {
    const generated = new Set<string>();
    for (let i = 0; i < 100; i++) {
      generated.add(generateUniqueRideCode());
    }
    expect(generated.size).toBe(100);
  });
});
