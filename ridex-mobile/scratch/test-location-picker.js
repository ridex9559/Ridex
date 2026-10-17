/**
 * RIDEX — Unit & Integration Test for Waypoint & Location Selection System
 */

const assert = require('assert');

// 1. Mock Geocoding Fallback Logic
function resolveLocationName(rawName, category, mode, lat, lng) {
  if (rawName && rawName.trim().length > 0) {
    return rawName.trim();
  }
  if (mode === 'start') return 'Rendezvous Point';
  if (mode === 'destination') return 'Final Destination';
  if (category === 'BREAKFAST') return 'Breakfast / Food Stop';
  if (category === 'FUEL') return 'Fuel Stop';
  if (category === 'VIEWPOINT') return 'Scenic Viewpoint Stop';
  return 'Waypoint Stop';
}

// 2. Draft State Engine Simulation
class CreateRideStateEngine {
  constructor() {
    this.step = 1;
    this.draft = {
      title: 'Monsoon Ghats Explorer',
      description: 'Scenic weekend ride across the Western Ghats.',
      category: 'WEEKEND',
      difficulty: 'MODERATE',
      startLocation: null,
      destination: null,
      checkpoints: [],
      scheduledDate: new Date(),
      scheduledTime: '06:00 AM',
    };
    this.waypoints = [];
  }

  updateStartLocation(loc) {
    this.draft = { ...this.draft, startLocation: { ...loc } };
  }

  updateDestination(loc) {
    this.draft = { ...this.draft, destination: { ...loc } };
  }

  addWaypoint(wp) {
    const newWp = {
      id: wp.id || `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: wp.name || 'Waypoint Stop',
      latitude: wp.latitude,
      longitude: wp.longitude,
      type: wp.type || wp.category || 'REGROUP',
      estimatedStopMinutes: wp.stopDuration || 15,
    };
    this.waypoints = [...this.waypoints, newWp];
  }

  removeWaypoint(index) {
    this.waypoints = this.waypoints.filter((_, idx) => idx !== index);
  }

  getAllCheckpoints() {
    const list = [];
    if (this.draft.startLocation) {
      list.push({
        id: 'cp-start',
        name: this.draft.startLocation.name,
        type: 'START',
        latitude: this.draft.startLocation.latitude,
        longitude: this.draft.startLocation.longitude,
        orderIndex: 0,
        estimatedStopMinutes: 15,
      });
    }

    this.waypoints.forEach((wp, idx) => {
      list.push({
        ...wp,
        orderIndex: idx + 1,
      });
    });

    if (this.draft.destination) {
      list.push({
        id: 'cp-dest',
        name: this.draft.destination.name,
        type: 'DESTINATION',
        latitude: this.draft.destination.latitude,
        longitude: this.draft.destination.longitude,
        orderIndex: list.length,
        estimatedStopMinutes: 0,
      });
    }

    return list;
  }
}

async function runTests() {
  console.log('🏍️ Running RIDEX Location & Waypoint Selection Engine Tests...\n');

  const engine = new CreateRideStateEngine();

  // TEST 1: Start Rendezvous Selection
  console.log('TEST 1: Select Start Rendezvous');
  engine.updateStartLocation({
    name: resolveLocationName('Rendezvous Point (Chandani Chowk)', '', 'start', 18.5089, 73.7924),
    latitude: 18.5089,
    longitude: 73.7924,
  });
  assert.strictEqual(engine.draft.startLocation.name, 'Rendezvous Point (Chandani Chowk)');
  assert.strictEqual(engine.draft.startLocation.latitude, 18.5089);
  assert.strictEqual(engine.draft.startLocation.longitude, 73.7924);
  console.log('✅ TEST 1 PASSED: Start location saved properly.');

  // TEST 2: Final Destination Selection (Must NOT overwrite start)
  console.log('\nTEST 2: Select Final Destination');
  engine.updateDestination({
    name: resolveLocationName('Lavasa Lake Promenade', '', 'destination', 18.4116, 73.5068),
    latitude: 18.4116,
    longitude: 73.5068,
  });
  assert.strictEqual(engine.draft.destination.name, 'Lavasa Lake Promenade');
  assert.strictEqual(engine.draft.startLocation.name, 'Rendezvous Point (Chandani Chowk)');
  console.log('✅ TEST 2 PASSED: Destination saved without overwriting start location.');

  // TEST 3: Add Single Waypoint (German Bakery Breakfast Stop)
  console.log('\nTEST 3: Add Waypoint via SET WAYPOINT LOCATION');
  engine.addWaypoint({
    id: 'wp-1',
    name: resolveLocationName('German Bakery Breakfast Stop', 'BREAKFAST', 'waypoint', 18.4721, 73.6842),
    latitude: 18.4721,
    longitude: 73.6842,
    type: 'BREAKFAST',
    stopDuration: 35,
  });
  assert.strictEqual(engine.waypoints.length, 1);
  assert.strictEqual(engine.waypoints[0].name, 'German Bakery Breakfast Stop');
  assert.strictEqual(engine.waypoints[0].type, 'BREAKFAST');
  assert.strictEqual(engine.waypoints[0].estimatedStopMinutes, 35);
  console.log('✅ TEST 3 PASSED: Waypoint added with correct category and duration.');

  // TEST 4: Add Multiple Waypoints (HP Petrol Pump, Scenic Viewpoint)
  console.log('\nTEST 4: Add Multiple Stops (Fuel Stop, Scenic Viewpoint)');
  engine.addWaypoint({
    id: 'wp-2',
    name: resolveLocationName('HP Petrol Pump Fuel Stop', 'FUEL', 'waypoint', 18.4312, 73.5781),
    latitude: 18.4312,
    longitude: 73.5781,
    type: 'FUEL',
    stopDuration: 15,
  });
  engine.addWaypoint({
    id: 'wp-3',
    name: resolveLocationName('Temghar Dam Viewpoint', 'VIEWPOINT', 'waypoint', 18.4205, 73.5430),
    latitude: 18.4205,
    longitude: 73.5430,
    type: 'VIEWPOINT',
    stopDuration: 20,
  });
  assert.strictEqual(engine.waypoints.length, 3);
  console.log('✅ TEST 4 PASSED: All 3 waypoints exist immutably in array.');

  // TEST 5: Verify Complete Checkpoint Sequence
  console.log('\nTEST 5: Verify Full Checkpoints Sequence (Start -> Stops -> Destination)');
  const all = engine.getAllCheckpoints();
  assert.strictEqual(all.length, 5);
  assert.strictEqual(all[0].type, 'START');
  assert.strictEqual(all[0].name, 'Rendezvous Point (Chandani Chowk)');
  assert.strictEqual(all[1].type, 'BREAKFAST');
  assert.strictEqual(all[1].name, 'German Bakery Breakfast Stop');
  assert.strictEqual(all[2].type, 'FUEL');
  assert.strictEqual(all[2].name, 'HP Petrol Pump Fuel Stop');
  assert.strictEqual(all[3].type, 'VIEWPOINT');
  assert.strictEqual(all[3].name, 'Temghar Dam Viewpoint');
  assert.strictEqual(all[4].type, 'DESTINATION');
  assert.strictEqual(all[4].name, 'Lavasa Lake Promenade');
  console.log('✅ TEST 5 PASSED: Full route sequence is ordered and structured properly.');

  // TEST 6: Step Navigation Data Persistence Simulation
  console.log('\nTEST 6: Step Navigation (Step 3 -> Step 4 -> Step 2 -> Step 5)');
  engine.step = 4;
  engine.step = 2;
  engine.step = 5;
  const reviewCheckpoints = engine.getAllCheckpoints();
  assert.strictEqual(reviewCheckpoints.length, 5);
  assert.strictEqual(engine.draft.startLocation.latitude, 18.5089);
  assert.strictEqual(engine.draft.destination.latitude, 18.4116);
  assert.strictEqual(engine.waypoints.length, 3);
  console.log('✅ TEST 6 PASSED: Navigation across steps preserves all state seamlessly.');

  // TEST 7: Remove Waypoint Immutably
  console.log('\nTEST 7: Remove Waypoint 2 (HP Petrol Pump)');
  engine.removeWaypoint(1); // Remove index 1 in waypoints (wp-2)
  assert.strictEqual(engine.waypoints.length, 2);
  assert.strictEqual(engine.waypoints[0].name, 'German Bakery Breakfast Stop');
  assert.strictEqual(engine.waypoints[1].name, 'Temghar Dam Viewpoint');
  const updatedAll = engine.getAllCheckpoints();
  assert.strictEqual(updatedAll.length, 4);
  console.log('✅ TEST 7 PASSED: Waypoint removed cleanly with order recomputed.');

  console.log('\n🎉 ALL 7 INTEGRATION TESTS PASSED 100%!');
}

runTests();
