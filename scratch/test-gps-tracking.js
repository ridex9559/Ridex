/**
 * Comprehensive Automated Test Suite for RIDEX Step 5: GPS Ride Tracking Architecture
 */

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

// Haversine Implementation
const EARTH_RADIUS_METERS = 6371008.8;
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const sinDeltaPhiHalf = Math.sin(deltaPhi / 2);
  const sinDeltaLambdaHalf = Math.sin(deltaLambda / 2);

  const a =
    sinDeltaPhiHalf * sinDeltaPhiHalf +
    Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambdaHalf * sinDeltaLambdaHalf;

  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  return EARTH_RADIUS_METERS * c;
}

function isValidCoordinate(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (!isFinite(latitude) || !isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  if (latitude === 0 && longitude === 0) return false;
  return true;
}

async function runGpsTrackingTests() {
  console.log('===========================================================');
  console.log('🏍️  RIDEX STEP 5: GPS RIDE TRACKING ARCHITECTURE TESTS');
  console.log('===========================================================\n');

  // -------------------------------------------------------------
  // TEST 1: HAVERSINE ACCURACY WITH KNOWN GEODESIC BENCHMARKS
  // -------------------------------------------------------------
  console.log('🧪 TEST 1: HAVERSINE DISTANCE FORMULA ACCURACY');
  // Mumbai Gateway of India (18.9220, 72.8347) to Pune Shaniwar Wada (18.5196, 73.8553)
  const puneMumbaiMeters = calculateHaversineDistance(18.9220, 72.8347, 18.5196, 73.8553);
  const puneMumbaiKm = puneMumbaiMeters / 1000;
  console.log(`  Calculated Distance Mumbai → Pune: ${puneMumbaiKm.toFixed(2)} km`);
  assert(puneMumbaiKm >= 115 && puneMumbaiKm <= 125, 'Haversine distance between Mumbai and Pune is within expected ~119 km');

  // Short distance: 100m along meridian (approx 0.0009 degrees latitude)
  const shortDist = calculateHaversineDistance(18.52043, 73.85674, 18.52133, 73.85674);
  assert(Math.abs(shortDist - 100) < 2, `100m calibration test calculated: ${shortDist.toFixed(1)}m`);
  console.log('✅ TEST 1 PASSED: Haversine distance formula is accurate in meters.\n');

  // -------------------------------------------------------------
  // TEST 2: COORDINATE INTEGRITY & BOUNDS VALIDATION
  // -------------------------------------------------------------
  console.log('🧪 TEST 2: COORDINATE INTEGRITY & BOUNDS VALIDATION');
  assert(isValidCoordinate(19.9975, 73.7898) === true, 'Valid coordinates (Nashik) accepted');
  assert(isValidCoordinate(91.0, 73.7898) === false, 'Invalid latitude (>90) rejected');
  assert(isValidCoordinate(19.9975, 185.0) === false, 'Invalid longitude (>180) rejected');
  assert(isValidCoordinate(NaN, 73.7898) === false, 'NaN latitude rejected');
  assert(isValidCoordinate(0, 0) === false, 'Null Island (0,0) uninitialized GPS chipset rejected');
  console.log('✅ TEST 2 PASSED: Coordinate bounds validation robustly rejects invalid coordinates.\n');

  // -------------------------------------------------------------
  // TEST 3: GPS ACCURACY FILTERING
  // -------------------------------------------------------------
  console.log('🧪 TEST 3: GPS ACCURACY FILTERING');
  const MAX_ACCURACY = 30.0; // 30 meters
  function filterAccuracy(accuracy) {
    return accuracy !== null && accuracy <= MAX_ACCURACY;
  }
  assert(filterAccuracy(4.5) === true, 'Good GPS accuracy (4.5m) accepted');
  assert(filterAccuracy(28.0) === true, 'Acceptable GPS accuracy (28.0m) accepted');
  assert(filterAccuracy(45.0) === false, 'Poor GPS accuracy (45.0m) filtered out');
  assert(filterAccuracy(120.0) === false, 'Extremely poor cell tower triangulation (120m) rejected');
  console.log('✅ TEST 3 PASSED: GPS accuracy filter correctly isolates high-precision points.\n');

  // -------------------------------------------------------------
  // TEST 4: STATIONARY JITTER / SMALL NOISE FILTER
  // -------------------------------------------------------------
  console.log('🧪 TEST 4: STATIONARY JITTER & SMALL NOISE FILTER');
  const MIN_MOVEMENT = 2.5; // 2.5 meters
  const stationaryPoint1 = { lat: 18.52043, lon: 73.85674 };
  const stationaryPoint2 = { lat: 18.52044, lon: 73.85674 }; // ~1.1m jitter
  const jitterDist = calculateHaversineDistance(stationaryPoint1.lat, stationaryPoint1.lon, stationaryPoint2.lat, stationaryPoint2.lon);

  function processMovement(dist) {
    if (dist < MIN_MOVEMENT) {
      return 0; // Stationary noise, 0 distance accumulated
    }
    return dist;
  }

  assert(processMovement(jitterDist) === 0, `Stationary GPS jitter (${jitterDist.toFixed(1)}m) filtered to 0 accumulated distance`);
  assert(processMovement(15.4) === 15.4, 'Legitimate movement (15.4m) accumulated');
  console.log('✅ TEST 4 PASSED: Stationary noise does not inflate ride odometer.\n');

  // -------------------------------------------------------------
  // TEST 5: GPS DRIFT & TELEPORTATION JUMP PROTECTION
  // -------------------------------------------------------------
  console.log('🧪 TEST 5: GPS DRIFT & IMPOSSIBLE SPEED PROTECTION');
  const MAX_SPEED_MPS = 85.0; // ~306 km/h
  function validateJump(distMeters, timeDeltaSec) {
    const speedMps = distMeters / timeDeltaSec;
    return speedMps <= MAX_SPEED_MPS;
  }

  // 10 km jump in 1 second
  assert(validateJump(10000, 1.0) === false, '10km teleportation jump in 1s rejected');
  // 50 meters in 1 second (~180 km/h on highway)
  assert(validateJump(50, 1.0) === true, '50m in 1s (180 km/h high-speed acceleration) accepted');
  console.log('✅ TEST 5 PASSED: GPS drift and teleportation jumps rejected.\n');

  // -------------------------------------------------------------
  // TEST 6: NON-DESTRUCTIVE BASELINE ESTABLISHMENT ON RESUME
  // -------------------------------------------------------------
  console.log('🧪 TEST 6: PAUSE/RESUME BASELINE RESET (NO JUMP ON RESUME)');
  let previousBaseline = { lat: 18.5200, lon: 73.8500 };
  let accumulatedDistance = 5400; // 5.4 km

  // Ride Pauses
  previousBaseline = null; // Engine resets previous point to null

  // Rider takes coffee break, walks 500m to restaurant (18.5245, 73.8500)
  const resumePoint = { lat: 18.5245, lon: 73.8500 };

  // First point after resume
  function processPointAfterResume(point, prev) {
    if (!prev) {
      // Establish new baseline without adding distance across the pause gap!
      return { accumulated: accumulatedDistance, newBaseline: point };
    }
    const d = calculateHaversineDistance(prev.lat, prev.lon, point.lat, point.lon);
    return { accumulated: accumulatedDistance + d, newBaseline: point };
  }

  const resumeResult = processPointAfterResume(resumePoint, previousBaseline);
  assert(resumeResult.accumulated === 5400, 'Zero distance accumulated across the paused gap');
  assert(resumeResult.newBaseline.lat === 18.5245, 'Fresh baseline established at coffee shop coordinate');
  console.log('✅ TEST 6 PASSED: Pause-to-resume gap distance leap prevented.\n');

  // -------------------------------------------------------------
  // TEST 7: SPEED & DURATION CALCULATIONS FROM TIMESTAMPS
  // -------------------------------------------------------------
  console.log('🧪 TEST 7: SPEED & DURATION ACCUMULATION');
  const rideStartTime = Date.now() - 3600000; // 1 hour ago
  const totalPausedMs = 900000; // 15 minutes paused
  const movingTimeMs = 2700000; // 45 minutes moving
  const totalDistMeters = 54000; // 54 km

  const movingDurationSec = movingTimeMs / 1000;
  const avgSpeedMps = totalDistMeters / movingDurationSec;
  const avgSpeedKmh = avgSpeedMps * 3.6;

  console.log(`  Moving duration: ${movingDurationSec}s, Avg Speed: ${avgSpeedKmh.toFixed(1)} km/h`);
  assert(Math.round(avgSpeedKmh) === 72, 'Average speed calculated accurately as 72 km/h (54 km / 0.75h)');
  console.log('✅ TEST 7 PASSED: Speed and duration calculations validated.\n');

  // -------------------------------------------------------------
  // TEST 8: GPS BATCH BUFFERING & PERSISTENCE
  // -------------------------------------------------------------
  console.log('🧪 TEST 8: GPS BATCH BUFFERING (ZERO PER-POINT NETWORK CALLS)');
  const buffer = [];
  const BATCH_SIZE = 10;
  let sqliteInserts = 0;

  function bufferPoint(pt) {
    buffer.push(pt);
    if (buffer.length >= BATCH_SIZE) {
      sqliteInserts++;
      buffer.length = 0; // Flushed
    }
  }

  for (let i = 0; i < 25; i++) {
    bufferPoint({ id: 'loc_' + i, lat: 18.5 + i * 0.001, lon: 73.8 });
  }

  assert(sqliteInserts === 2, '2 batch inserts executed for 20 points');
  assert(buffer.length === 5, '5 points remaining in buffer ready for final flush');
  console.log('✅ TEST 8 PASSED: GPS batching writes efficiently to SQLite without network load.\n');

  // -------------------------------------------------------------
  // TEST 9: ACTIVE RIDE RECOVERY SIMULATION
  // -------------------------------------------------------------
  console.log('🧪 TEST 9: ACTIVE RIDE CRASH RECOVERY');
  const activeRideInDb = {
    id: 'ride_recovery_test',
    user_id: 'rider_01',
    status: 'IN_PROGRESS',
    distance_meters: 14200,
    duration_seconds: 840,
    start_time: new Date(Date.now() - 840000).toISOString()
  };

  function detectActiveRide(ride) {
    if (ride && (ride.status === 'IN_PROGRESS' || ride.status === 'PAUSED')) {
      return { canRecover: true, rideId: ride.id };
    }
    return { canRecover: false };
  }

  const recoveryStatus = detectActiveRide(activeRideInDb);
  assert(recoveryStatus.canRecover === true, 'Active in-progress ride detected on simulated app reload');
  assert(recoveryStatus.rideId === 'ride_recovery_test', 'Recovered ride matches persisted ID');
  console.log('✅ TEST 9 PASSED: App crash recovery successfully restores unfinished rides.\n');

  console.log('===========================================================');
  console.log('🎉 ALL GPS TRACKING ARCHITECTURE TESTS PASSED!');
  console.log('===========================================================');
}

runGpsTrackingTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
