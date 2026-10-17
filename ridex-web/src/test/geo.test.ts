import { describe, it, expect } from 'vitest';
import {
  calculateDistanceMeters,
  calculateDistanceKm,
  calculateBearing,
  isValidCoordinate,
  evaluateFreshness,
  evaluateGroupSeparation,
} from '../utils/geo';
import { LiveRiderLocation } from '../types';

describe('Geodesic Math & Haversine Distance Engine', () => {
  it('calculates accurate distance between Mumbai and Pune benchmarks (~116 - 120 km)', () => {
    const mumbai = { lat: 18.9220, lng: 72.8347 };
    const pune = { lat: 18.5204, lng: 73.8567 };

    const distKm = calculateDistanceKm(mumbai.lat, mumbai.lng, pune.lat, pune.lng);
    expect(distKm).toBeGreaterThan(110);
    expect(distKm).toBeLessThan(125);
  });

  it('accurately validates 100m calibration coordinates', () => {
    // 0.0009 degrees latitude is roughly 100 meters
    const p1 = { lat: 18.5200, lng: 73.8567 };
    const p2 = { lat: 18.5209, lng: 73.8567 };

    const distMeters = calculateDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng);
    expect(distMeters).toBeGreaterThan(95);
    expect(distMeters).toBeLessThan(105);
  });

  it('rejects invalid coordinates and Null Island (0,0)', () => {
    expect(isValidCoordinate(null, 73.8567)).toBe(false);
    expect(isValidCoordinate(18.5204, undefined)).toBe(false);
    expect(isValidCoordinate(95, 73.8567)).toBe(false); // Latitude > 90
    expect(isValidCoordinate(18.5204, 190)).toBe(false); // Longitude > 180
    expect(isValidCoordinate(0, 0)).toBe(false); // Null Island
    expect(isValidCoordinate(18.5204, 73.8567)).toBe(true);
  });

  it('calculates compass heading bearing accurately', () => {
    // Heading directly North
    const pNorth = calculateBearing(18.0, 73.0, 19.0, 73.0);
    expect(Math.round(pNorth)).toBe(0);

    // Heading directly East
    const pEast = calculateBearing(18.0, 73.0, 18.0, 74.0);
    expect(Math.round(pEast)).toBe(90);
  });
});

describe('Location Freshness Classification', () => {
  it('classifies timestamps into LIVE, STALE, and LOST', () => {
    const now = Date.now();
    const liveTimestamp = new Date(now - 10000).toISOString(); // 10s ago
    const staleTimestamp = new Date(now - 45000).toISOString(); // 45s ago
    const lostTimestamp = new Date(now - 120000).toISOString(); // 2m ago

    expect(evaluateFreshness(liveTimestamp)).toBe('LIVE');
    expect(evaluateFreshness(staleTimestamp)).toBe('STALE');
    expect(evaluateFreshness(lostTimestamp)).toBe('LOST');
  });
});

describe('Squad Separation & Hysteresis Engine', () => {
  const leader: LiveRiderLocation = {
    userId: 'leader-1',
    riderName: 'Aryan (Road Captain)',
    latitude: 18.5204,
    longitude: 73.8567,
    updatedAt: new Date().toISOString(),
  };

  it('evaluates squad TOGETHER when riders are within 500m', () => {
    const riderClose: LiveRiderLocation = {
      userId: 'rider-2',
      riderName: 'Vikram',
      latitude: 18.5220, // ~170m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    const state = evaluateGroupSeparation([leader, riderClose], 'leader-1');
    expect(state.status).toBe('TOGETHER');
    expect(state.separatedRiders.length).toBe(0);
  });

  it('evaluates squad SPREAD when riders are between 500m and 1000m', () => {
    const riderStretching: LiveRiderLocation = {
      userId: 'rider-3',
      riderName: 'Neha',
      latitude: 18.5265, // ~680m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    const state = evaluateGroupSeparation([leader, riderStretching], 'leader-1');
    expect(state.status).toBe('SPREAD');
    expect(state.separatedRiders.length).toBe(0);
  });

  it('evaluates squad SEPARATED when a rider is >1000m away', () => {
    const riderDetached: LiveRiderLocation = {
      userId: 'rider-4',
      riderName: 'Rohan',
      latitude: 18.5320, // ~1300m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    const state = evaluateGroupSeparation([leader, riderDetached], 'leader-1');
    expect(state.status).toBe('SEPARATED');
    expect(state.separatedRiders.length).toBe(1);
    expect(state.separatedRiders[0].riderName).toBe('Rohan');
    expect(state.separatedRiders[0].distanceMeters).toBeGreaterThan(1000);
  });

  it('implements hysteresis recovery: detached rider must return within 800m to clear critical alert', () => {
    // Rider at 850m
    const riderRecovering: LiveRiderLocation = {
      userId: 'rider-4',
      riderName: 'Rohan',
      latitude: 18.5280, // ~845m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    // If previous status was SEPARATED, remaining at 845m (>800m) stays SEPARATED
    const stateStillSeparated = evaluateGroupSeparation(
      [leader, riderRecovering],
      'leader-1',
      'SEPARATED'
    );
    expect(stateStillSeparated.status).toBe('SEPARATED');

    // If rider moves to 700m (<800m), alert clears to SPREAD
    const riderAt700m: LiveRiderLocation = {
      ...riderRecovering,
      latitude: 18.5265, // ~680m away
    };
    const stateRecovered = evaluateGroupSeparation(
      [leader, riderAt700m],
      'leader-1',
      'SEPARATED'
    );
    expect(stateRecovered.status).toBe('SPREAD');
  });
});
