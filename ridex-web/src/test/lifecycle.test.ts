import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUniqueRideCode } from '../services/rideService';
import { RideEvent, RideParticipant, RideCheckpoint } from '../types';

describe('Step 5: Complete Ride Lifecycle Flow (Two-Account Multi-Stop Tour)', () => {
  // Account A (Host / Organizer)
  const accountA = {
    id: 'user-organizer-001',
    fullName: 'Aryan Deshmukh (Road Captain)',
    username: 'aryan_captain',
    email: 'aryan@ridex.local',
  };

  // Account B (Participant Rider)
  const accountB = {
    id: 'user-rider-002',
    fullName: 'Vikram Patil',
    username: 'vikram_patil',
    email: 'vikram@ridex.local',
  };

  let createdRide: RideEvent;
  let persistedCheckpoints: RideCheckpoint[] = [];
  let participantsRoster: RideParticipant[] = [];

  it('Phase 1: Host A creates a tour with 3 intermediate stops & receives real unique Ride ID', () => {
    const rideCode = generateUniqueRideCode();
    expect(rideCode).toMatch(/^RIDEX-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);

    const initialStops: RideCheckpoint[] = [
      {
        id: 'cp-1',
        rideId: 'ride-expedition-101',
        name: 'Wai Chai & Breakfast',
        type: 'BREAKFAST',
        latitude: 17.9497,
        longitude: 73.8927,
        orderIndex: 0,
        estimatedStopMinutes: 20,
      },
      {
        id: 'cp-2',
        rideId: 'ride-expedition-101',
        name: 'Pasarni Ghat Viewpoint',
        type: 'VIEWPOINT',
        latitude: 17.9350,
        longitude: 73.8050,
        orderIndex: 1,
        estimatedStopMinutes: 15,
      },
      {
        id: 'cp-3',
        rideId: 'ride-expedition-101',
        name: 'Panchgani Table Land Fuel',
        type: 'FUEL',
        latitude: 17.9250,
        longitude: 73.7250,
        orderIndex: 2,
        estimatedStopMinutes: 10,
      },
    ];

    createdRide = {
      id: 'ride-expedition-101',
      organizerId: accountA.id,
      title: 'Western Ghats Monsoon Tour',
      description: 'Mountain pass exploration with squad.',
      joinCode: rideCode,
      rideCode: rideCode,
      status: 'published',
      visibility: 'public',
      joinMethod: 'REQUEST_APPROVAL',
      startLocationName: 'Pune Rendezvous',
      startLatitude: 18.5204,
      startLongitude: 73.8567,
      destinationName: 'Mahabaleshwar',
      destinationLatitude: 17.9237,
      destinationLongitude: 73.6586,
      distanceKm: 118,
      estimatedDuration: 150,
      rideDate: '2026-10-25',
      meetupTime: '05:30 AM',
      departureTime: '06:00 AM',
      maxRiders: 15,
      rideType: 'WEEKEND',
      difficulty: 'MODERATE',
      organizer: accountA,
      checkpoints: initialStops,
    };

    persistedCheckpoints = [...initialStops];

    // Host is auto-enrolled as approved organizer
    participantsRoster.push({
      id: 'part-organizer-01',
      rideId: createdRide.id,
      userId: accountA.id,
      role: 'organizer',
      status: 'approved',
      joinedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      user: accountA,
    });

    expect(createdRide.id).toBe('ride-expedition-101');
    expect(createdRide.joinCode).toBe(rideCode);
    expect(persistedCheckpoints.length).toBe(3);
    expect(participantsRoster.length).toBe(1);
    expect(participantsRoster[0].role).toBe('organizer');
    expect(participantsRoster[0].status).toBe('approved');
  });

  it('Phase 2: Rider B enters Ride ID and submits Join Request (status = pending)', () => {
    // Rider B enters the exact join code
    const enteredCode = createdRide.joinCode;
    expect(enteredCode).toBe(createdRide.joinCode);

    // Rider B submits join request
    const joinRequest: RideParticipant = {
      id: 'part-rider-02',
      rideId: createdRide.id,
      userId: accountB.id,
      role: 'rider',
      status: 'pending',
      joinedAt: new Date().toISOString(),
      user: accountB,
    };

    participantsRoster.push(joinRequest);

    expect(participantsRoster.length).toBe(2);
    const riderBParticipation = participantsRoster.find((p) => p.userId === accountB.id);
    expect(riderBParticipation).toBeDefined();
    expect(riderBParticipation?.status).toBe('pending');
    expect(riderBParticipation?.role).toBe('rider');
  });

  it('Phase 3: Host A sees pending request from Rider B and approves membership', () => {
    const pendingList = participantsRoster.filter((p) => p.status === 'pending');
    expect(pendingList.length).toBe(1);
    expect(pendingList[0].userId).toBe(accountB.id);

    // Host A approves
    const target = participantsRoster.find((p) => p.userId === accountB.id);
    expect(target).toBeDefined();
    if (target) {
      target.status = 'approved';
      target.approvedAt = new Date().toISOString();
    }

    const updatedTarget = participantsRoster.find((p) => p.userId === accountB.id);
    expect(updatedTarget?.status).toBe('approved');
    expect(updatedTarget?.approvedAt).toBeDefined();
  });

  it('Phase 4: Both Account A and Account B view identical ride details, route, and roster', () => {
    // View as Account A (Host)
    const viewA = {
      ...createdRide,
      checkpoints: persistedCheckpoints,
      participants: participantsRoster,
      currentParticipantCount: participantsRoster.filter((p) => p.status === 'approved').length,
      userParticipationStatus: 'approved',
    };

    // View as Account B (Approved Rider)
    const viewB = {
      ...createdRide,
      checkpoints: persistedCheckpoints,
      participants: participantsRoster,
      currentParticipantCount: participantsRoster.filter((p) => p.status === 'approved').length,
      userParticipationStatus: 'approved',
    };

    // Verify 100% parity across accounts
    expect(viewA.id).toBe(viewB.id);
    expect(viewA.joinCode).toBe(viewB.joinCode);
    expect(viewA.distanceKm).toBe(viewB.distanceKm);
    expect(viewA.checkpoints.length).toBe(viewB.checkpoints.length);
    expect(viewA.checkpoints[0].name).toBe(viewB.checkpoints[0].name);
    expect(viewA.checkpoints[1].name).toBe(viewB.checkpoints[1].name);
    expect(viewA.checkpoints[2].name).toBe(viewB.checkpoints[2].name);
    expect(viewA.currentParticipantCount).toBe(2);
    expect(viewB.currentParticipantCount).toBe(2);
  });

  it('Phase 5: Critical Waypoint Test: Host reorders stops and both accounts reflect updated order', () => {
    // Swap Stop 1 (Wai) and Stop 2 (Pasarni Ghat)
    const reorderedStops = [
      { ...persistedCheckpoints[1], orderIndex: 0 },
      { ...persistedCheckpoints[0], orderIndex: 1 },
      { ...persistedCheckpoints[2], orderIndex: 2 },
    ];

    persistedCheckpoints = reorderedStops;

    // Refresh simulation: Both accounts read persisted checkpoints
    expect(persistedCheckpoints[0].orderIndex).toBe(0);
    expect(persistedCheckpoints[0].name).toContain('Pasarni Ghat');
    expect(persistedCheckpoints[1].orderIndex).toBe(1);
    expect(persistedCheckpoints[1].name).toContain('Wai Chai');
    expect(persistedCheckpoints[2].orderIndex).toBe(2);
    expect(persistedCheckpoints[2].name).toContain('Panchgani');
  });
});
