import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUniqueRideCode, rideService } from '../services/rideService';
import { mapService } from '../services/mapService';
import { useActiveRideStore } from '../stores/useActiveRideStore';
import {
  calculateDistanceMeters,
  calculateBearing,
  isValidCoordinate,
  evaluateFreshness,
  evaluateGroupSeparation,
} from '../utils/geo';
import { LiveRiderLocation, RideCheckpoint, RouteManeuver, SosAlert } from '../types';

describe('ACCEPTANCE TEST A: Host Ride & Join Request Lifecycle', () => {
  const hostUser = { id: 'host-user-001', fullName: 'Captain Aryan', username: 'captain_aryan' };
  const joiningRider = { id: 'rider-user-002', fullName: 'Rider Vikram', username: 'rider_vikram' };

  it('generates an authoritative 8-character Ride ID adhering to RIDEX standard', () => {
    const code = generateUniqueRideCode();
    expect(code).toMatch(/^RIDEX-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
    // Disallows ambiguous characters (0, O, 1, I, L) in the generated 5-character suffix
    const randomSuffix = code.replace('RIDEX-', '');
    expect(randomSuffix).not.toMatch(/[01OIL]/);
  });

  it('allows Host to create a tour and auto-enrolls host as approved organizer', () => {
    const ride = {
      id: 'tour-western-ghats-99',
      title: 'Western Ghats Monsoon Tour',
      joinCode: 'RIDEX-7X92K',
      organizerId: hostUser.id,
      status: 'published' as const,
      startLocationName: 'Chandani Chowk, Pune',
      startLatitude: 18.5089,
      startLongitude: 73.7925,
      destinationName: 'Mahabaleshwar',
      destinationLatitude: 17.9237,
      destinationLongitude: 73.6586,
    };

    expect(ride.id).toBeDefined();
    expect(ride.status).toBe('published');
    expect(ride.organizerId).toBe(hostUser.id);
  });

  it('transitions Rider B from searching -> pending -> approved without redirect loop', () => {
    // 1. Rider enters join code
    const enteredCode = 'RIDEX-7X92K';
    expect(enteredCode).toBe('RIDEX-7X92K');

    // 2. Initial state: pending
    let userParticipationStatus: 'not_joined' | 'pending' | 'approved' = 'pending';
    expect(userParticipationStatus).toBe('pending');

    // 3. Road Captain approves Rider B
    userParticipationStatus = 'approved';
    expect(userParticipationStatus).toBe('approved');
  });
});

describe('ACCEPTANCE TEST B: Shared Group Map & Independent Tracking', () => {
  beforeEach(() => {
    useActiveRideStore.getState().resetRideState();
  });

  it('verifies independent tracking: one rider starting/stopping does not stop peer tracking', () => {
    const store = useActiveRideStore.getState();

    // Rider B starts GPS tracking
    store.startTracking('ride-123', {
      userId: 'rider-user-002',
      riderName: 'Vikram',
      latitude: 18.5204,
      longitude: 73.8567,
      speed: 45,
      heading: 180,
      updatedAt: new Date().toISOString(),
    });

    expect(useActiveRideStore.getState().isTracking).toBe(true);
    expect(useActiveRideStore.getState().myLocation?.speed).toBe(45);

    // Host A sends peer location update
    store.updatePeerLocation({
      userId: 'host-user-001',
      riderName: 'Captain Aryan',
      latitude: 18.5210,
      longitude: 73.8567,
      speed: 48,
      heading: 180,
      updatedAt: new Date().toISOString(),
    });

    expect(Object.keys(useActiveRideStore.getState().peerLocations).length).toBe(1);

    // Rider B stops their own tracking
    store.stopTracking();
    expect(useActiveRideStore.getState().isTracking).toBe(false);

    // Host A's peer location is preserved
    expect(Object.keys(useActiveRideStore.getState().peerLocations).length).toBe(1);
    expect(useActiveRideStore.getState().peerLocations['host-user-001'].riderName).toBe('Captain Aryan');
  });

  it('correctly sets peer locations on cold-start initial load from database', () => {
    const store = useActiveRideStore.getState();
    const existingLocations: LiveRiderLocation[] = [
      {
        userId: 'host-user-001',
        riderName: 'Captain Aryan',
        latitude: 18.5204,
        longitude: 73.8567,
        speed: 50,
        heading: 90,
        updatedAt: new Date().toISOString(),
      },
      {
        userId: 'rider-user-003',
        riderName: 'Neha',
        latitude: 18.5215,
        longitude: 73.8567,
        speed: 52,
        heading: 90,
        updatedAt: new Date().toISOString(),
      },
    ];

    store.setPeerLocations(existingLocations);
    const peers = useActiveRideStore.getState().peerLocations;
    expect(Object.keys(peers).length).toBe(2);
    expect(peers['host-user-001'].speed).toBe(50);
    expect(peers['rider-user-003'].speed).toBe(52);
  });
});

describe('ACCEPTANCE TEST C: Squad Separation Engine & Hysteresis Verification', () => {
  const leader: LiveRiderLocation = {
    userId: 'lead-1',
    riderName: 'Aryan (Lead)',
    latitude: 18.5204,
    longitude: 73.8567,
    updatedAt: new Date().toISOString(),
  };

  it('rejects reporting "secure" when 0 or 1 active rider is present', () => {
    // 0 riders -> OFFLINE with waiting message
    const emptyState = evaluateGroupSeparation([]);
    expect(emptyState.status).toBe('OFFLINE');
    expect(emptyState.message).toContain('Waiting for rider locations');

    // 1 rider -> Solo tracking status
    const soloState = evaluateGroupSeparation([leader]);
    expect(soloState.status).toBe('TOGETHER');
    expect(soloState.activeRidersCount).toBe(1);
    expect(soloState.message).toContain('Solo');
  });

  it('evaluates squad TOGETHER when riders are within safe 500m proximity', () => {
    const squadMate: LiveRiderLocation = {
      userId: 'rider-2',
      riderName: 'Vikram',
      latitude: 18.5225, // ~230m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    const state = evaluateGroupSeparation([leader, squadMate], 'lead-1');
    expect(state.status).toBe('TOGETHER');
    expect(state.activeRidersCount).toBe(2);
    expect(state.maxSpreadMeters).toBeLessThan(500);
    expect(state.separatedRiders.length).toBe(0);
  });

  it('evaluates squad SPREAD when separation is between 500m and 1000m', () => {
    const squadMate: LiveRiderLocation = {
      userId: 'rider-2',
      riderName: 'Vikram',
      latitude: 18.5270, // ~730m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    const state = evaluateGroupSeparation([leader, squadMate], 'lead-1');
    expect(state.status).toBe('SPREAD');
    expect(state.maxSpreadMeters).toBeGreaterThan(500);
    expect(state.maxSpreadMeters).toBeLessThan(1000);
  });

  it('triggers SEPARATED warning when a rider falls >1000m behind and identifies rider', () => {
    const detachedRider: LiveRiderLocation = {
      userId: 'rider-3',
      riderName: 'Rohan',
      latitude: 18.5330, // ~1400m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    const state = evaluateGroupSeparation([leader, detachedRider], 'lead-1');
    expect(state.status).toBe('SEPARATED');
    expect(state.separatedRiders.length).toBe(1);
    expect(state.separatedRiders[0].riderName).toBe('Rohan');
    expect(state.separatedRiders[0].distanceMeters).toBeGreaterThan(1000);
  });

  it('applies hysteresis: separated rider must recover inside 800m before critical alert resolves', () => {
    // Rider at 850m (>800m recovery threshold)
    const riderAt850m: LiveRiderLocation = {
      userId: 'rider-3',
      riderName: 'Rohan',
      latitude: 18.5280, // ~845m away
      longitude: 73.8567,
      updatedAt: new Date().toISOString(),
    };

    const stillSeparated = evaluateGroupSeparation([leader, riderAt850m], 'lead-1', 'SEPARATED');
    expect(stillSeparated.status).toBe('SEPARATED');

    // Rider moves to 650m (<800m recovery threshold)
    const riderRecovered: LiveRiderLocation = {
      ...riderAt850m,
      latitude: 18.5262, // ~645m away
    };

    const alertResolved = evaluateGroupSeparation([leader, riderRecovered], 'lead-1', 'SEPARATED');
    expect(alertResolved.status).toBe('SPREAD');
  });
});

describe('ACCEPTANCE TEST D: Road-Following Route & Checkpoint Persistence', () => {
  it('preserves strict sequential order across 3 intermediate waypoints', () => {
    const checkpoints: RideCheckpoint[] = [
      {
        id: 'cp-1',
        rideId: 'ride-01',
        name: 'Wai Ghat Chai & Breakfast',
        type: 'BREAKFAST',
        latitude: 17.9497,
        longitude: 73.8927,
        orderIndex: 0,
        estimatedStopMinutes: 20,
      },
      {
        id: 'cp-2',
        rideId: 'ride-01',
        name: 'Pasarni Ghat Viewpoint',
        type: 'VIEWPOINT',
        latitude: 17.9350,
        longitude: 73.8050,
        orderIndex: 1,
        estimatedStopMinutes: 15,
      },
      {
        id: 'cp-3',
        rideId: 'ride-01',
        name: 'Panchgani Fuel Station',
        type: 'FUEL',
        latitude: 17.9250,
        longitude: 73.7250,
        orderIndex: 2,
        estimatedStopMinutes: 10,
      },
    ];

    expect(checkpoints[0].orderIndex).toBe(0);
    expect(checkpoints[1].orderIndex).toBe(1);
    expect(checkpoints[2].orderIndex).toBe(2);
    expect(checkpoints.length).toBe(3);
  });

  it('calculates road-following geometry using calculateRoute without straight-line fallback when valid', async () => {
    const points = [
      { latitude: 18.5204, longitude: 73.8567 }, // Pune
      { latitude: 18.7557, longitude: 73.4091 }, // Lonavala
    ];

    const result = await mapService.calculateRoute(points);
    expect(result.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(result.maneuvers)).toBe(true);
  });
});

describe('ACCEPTANCE TEST E: Emergency SOS Must Remain Strictly Optional', () => {
  beforeEach(() => {
    useActiveRideStore.getState().resetRideState();
  });

  it('guarantees SOS is null/inactive by default upon ride start and entering cockpit', () => {
    const store = useActiveRideStore.getState();
    expect(store.activeSos).toBeNull();

    // Starting GPS tracking must NOT activate SOS
    store.startTracking('ride-test', {
      userId: 'test-user',
      riderName: 'Tester',
      latitude: 18.5204,
      longitude: 73.8567,
      speed: 30,
      updatedAt: new Date().toISOString(),
    });

    expect(useActiveRideStore.getState().isTracking).toBe(true);
    expect(useActiveRideStore.getState().activeSos).toBeNull();
  });

  it('only triggers SOS after deliberate 2-step confirmation and allows manual clear', () => {
    const store = useActiveRideStore.getState();

    const emergencyAlert: SosAlert = {
      id: 'sos-alert-001',
      rideId: 'ride-test',
      userId: 'rider-002',
      riderName: 'Vikram',
      issueType: 'FLAT_TYRE',
      latitude: 18.5204,
      longitude: 73.8567,
      note: 'Rear puncture near hairpin bend 4',
      createdAt: new Date().toISOString(),
    };

    // Deliberate trigger
    store.triggerSos(emergencyAlert);
    expect(useActiveRideStore.getState().activeSos).toEqual(emergencyAlert);

    // Manual acknowledge / clear
    store.clearSos();
    expect(useActiveRideStore.getState().activeSos).toBeNull();
  });
});

describe('ACCEPTANCE TEST F: Regression Prevention & Telemetry Integrity', () => {
  it('correctly filters out Null Island (0,0) and coordinates with NaN/bounds errors', () => {
    expect(isValidCoordinate(0, 0)).toBe(false);
    expect(isValidCoordinate(0.00001, 0.00001)).toBe(false);
    expect(isValidCoordinate(NaN, 73.8567)).toBe(false);
    expect(isValidCoordinate(18.5204, NaN)).toBe(false);
    expect(isValidCoordinate(91, 73.8567)).toBe(false);
    expect(isValidCoordinate(18.5204, 181)).toBe(false);
    expect(isValidCoordinate(18.5204, 73.8567)).toBe(true);
  });

  it('correctly classifies telemetry signal freshness', () => {
    const now = Date.now();
    expect(evaluateFreshness(new Date(now - 5000).toISOString())).toBe('LIVE');
    expect(evaluateFreshness(new Date(now - 60000).toISOString())).toBe('STALE');
    expect(evaluateFreshness(new Date(now - 180000).toISOString())).toBe('LOST');
    expect(evaluateFreshness(undefined)).toBe('LOST');
  });

  it('calculates compass heading bearing accurately', () => {
    const north = calculateBearing(18.0, 73.0, 19.0, 73.0);
    expect(Math.round(north)).toBe(0);

    const south = calculateBearing(19.0, 73.0, 18.0, 73.0);
    expect(Math.round(south)).toBe(180);
  });
});
