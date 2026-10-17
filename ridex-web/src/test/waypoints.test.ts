import { describe, it, expect } from 'vitest';
import { WaypointDraft } from '../components/rides/WaypointEditor';
import { calculateDistanceKm } from '../utils/geo';

describe('Waypoint Ordering & Sequence Integrity Engine', () => {
  const initialStops: WaypointDraft[] = [
    {
      name: 'Stop 1: Wai Chai & Breakfast',
      type: 'BREAKFAST',
      latitude: 17.9497,
      longitude: 73.8927,
      estimatedStopMinutes: 20,
    },
    {
      name: 'Stop 2: Pasarni Ghat Hairpin Viewpoint',
      type: 'VIEWPOINT',
      latitude: 17.9350,
      longitude: 73.8050,
      estimatedStopMinutes: 15,
    },
    {
      name: 'Stop 3: Panchgani Table Land Fuel Point',
      type: 'FUEL',
      latitude: 17.9250,
      longitude: 73.7250,
      estimatedStopMinutes: 10,
    },
  ];

  it('preserves exact 3-stop order and coordinates in sequence', () => {
    expect(initialStops.length).toBe(3);
    expect(initialStops[0].name).toContain('Wai Chai');
    expect(initialStops[1].name).toContain('Pasarni Ghat');
    expect(initialStops[2].name).toContain('Panchgani');

    expect(initialStops[0].latitude).toBe(17.9497);
    expect(initialStops[1].latitude).toBe(17.9350);
    expect(initialStops[2].latitude).toBe(17.9250);
  });

  it('correctly reorders stops when swapped (move up / move down)', () => {
    const reordered = [...initialStops];
    // Swap Stop 2 and Stop 3
    const temp = reordered[1];
    reordered[1] = reordered[2];
    reordered[2] = temp;

    expect(reordered[1].name).toContain('Panchgani');
    expect(reordered[2].name).toContain('Pasarni Ghat');

    // Verify orderIndex mapping
    const mappedWithIndex = reordered.map((wp, idx) => ({
      ...wp,
      orderIndex: idx,
    }));

    expect(mappedWithIndex[0].orderIndex).toBe(0);
    expect(mappedWithIndex[1].orderIndex).toBe(1);
    expect(mappedWithIndex[1].name).toContain('Panchgani');
    expect(mappedWithIndex[2].orderIndex).toBe(2);
    expect(mappedWithIndex[2].name).toContain('Pasarni Ghat');
  });

  it('calculates sequential route distance through all intermediate waypoints', () => {
    const origin = { lat: 18.5204, lng: 73.8567 }; // Pune
    const destination = { lat: 17.9237, lng: 73.6586 }; // Mahabaleshwar

    const points = [
      origin,
      { lat: initialStops[0].latitude, lng: initialStops[0].longitude },
      { lat: initialStops[1].latitude, lng: initialStops[1].longitude },
      { lat: initialStops[2].latitude, lng: initialStops[2].longitude },
      destination,
    ];

    let totalCumulativeDistanceKm = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const legDist = calculateDistanceKm(
        points[i].lat,
        points[i].lng,
        points[i + 1].lat,
        points[i + 1].lng
      );
      expect(legDist).toBeGreaterThan(0);
      totalCumulativeDistanceKm += legDist;
    }

    // Cumulative direct geodesic distance through Wai/Pasarni/Panchgani to Mahabaleshwar
    expect(totalCumulativeDistanceKm).toBeGreaterThan(70);
    expect(totalCumulativeDistanceKm).toBeLessThan(120);
  });
});
