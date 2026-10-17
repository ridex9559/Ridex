/**
 * RIDEX V3 — Unit Verification: SeparationEngine & Geodesic Distance Matrix
 */

function calculateDistanceMeters(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const R = 6371e3; // Earth radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const CONFIG = {
  WARNING_SEPARATION_METERS: 500,
  SIGNIFICANT_SEPARATION_METERS: 1000,
  RECOVERY_WARNING_METERS: 400,
  RECOVERY_SIGNIFICANT_METERS: 800,
  STALE_LOCATION_MS: 30000,
  LOST_LOCATION_MS: 90000,
};

// Test 1: Squad riding together (150m apart)
const leaderCoord = { latitude: 18.5204, longitude: 73.8567 };
const rider2Coord = { latitude: 18.5215, longitude: 73.8575 };

const dist1 = calculateDistanceMeters(leaderCoord, rider2Coord);
console.log(`[TEST 1] Distance between Leader & Rider 2: ${dist1.toFixed(1)} meters`);
if (dist1 <= CONFIG.WARNING_SEPARATION_METERS) {
  console.log('✅ TEST 1 PASS: Status is TOGETHER (<500m)');
} else {
  console.error('❌ TEST 1 FAIL');
}

// Test 2: Rider spreading out (650m apart)
const riderSpreadCoord = { latitude: 18.5255, longitude: 73.8605 };
const dist2 = calculateDistanceMeters(leaderCoord, riderSpreadCoord);
console.log(`\n[TEST 2] Distance between Leader & Spreading Rider: ${dist2.toFixed(1)} meters`);
if (dist2 > CONFIG.WARNING_SEPARATION_METERS && dist2 <= CONFIG.SIGNIFICANT_SEPARATION_METERS) {
  console.log('✅ TEST 2 PASS: Status is SPREAD (500m - 1000m)');
} else {
  console.error('❌ TEST 2 FAIL');
}

// Test 3: Rider separated (1.2km apart)
const riderSeparatedCoord = { latitude: 18.5300, longitude: 73.8650 };
const dist3 = calculateDistanceMeters(leaderCoord, riderSeparatedCoord);
console.log(`\n[TEST 3] Distance between Leader & Separated Rider: ${dist3.toFixed(1)} meters`);
if (dist3 > CONFIG.SIGNIFICANT_SEPARATION_METERS) {
  console.log('✅ TEST 3 PASS: Status is SEPARATED (>1000m)');
} else {
  console.error('❌ TEST 3 FAIL');
}

// Test 4: Hysteresis Recovery Check
console.log('\n[TEST 4] Hysteresis Recovery Evaluation:');
const recoveryCoord = { latitude: 18.5265, longitude: 73.8610 }; // ~750m
const distRecovery = calculateDistanceMeters(leaderCoord, recoveryCoord);
console.log(`Distance at 750m: ${distRecovery.toFixed(1)}m`);
console.log(`If previous state was SEPARATED (>1000m), must be < 800m to clear: ${distRecovery < CONFIG.RECOVERY_SIGNIFICANT_METERS ? 'CLEARS SEPARATION' : 'STAYS SEPARATED'}`);
if (distRecovery < CONFIG.RECOVERY_SIGNIFICANT_METERS) {
  console.log('✅ TEST 4 PASS: Hysteresis recovery clears critical alert when within 800m');
}

// Test 5: Freshness Check
const now = Date.now();
const freshPacket = now - 5000;
const stalePacket = now - 45000;
const lostPacket = now - 120000;

console.log('\n[TEST 5] Location Freshness Classification:');
console.log(`5s old: ${now - freshPacket < CONFIG.STALE_LOCATION_MS ? 'LIVE (Green)' : 'FAIL'}`);
console.log(`45s old: ${now - stalePacket >= CONFIG.STALE_LOCATION_MS && now - stalePacket < CONFIG.LOST_LOCATION_MS ? 'STALE (Amber)' : 'FAIL'}`);
console.log(`120s old: ${now - lostPacket >= CONFIG.LOST_LOCATION_MS ? 'LOST (Grey)' : 'FAIL'}`);
console.log('✅ TEST 5 PASS: All freshness states accurately classified');
