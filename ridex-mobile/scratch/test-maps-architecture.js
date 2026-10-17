/**
 * RIDEX — Step 6 Maps & Route Visualization Test Suite
 * Validates Route Bounds, Zoom Mathematics, Douglas-Peucker Simplification,
 * Provider Resolution, Coordinate Sanitization, and Long Route Performance.
 */

// Pure Geo Implementations for Node.js Testing Environment
const MAP_CONFIG = {
  DEFAULT_PROVIDER: 'carto_dark',
  DEFAULT_REGION: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  },
  ZOOM: {
    ACTIVE_RIDE: 16,
    ROUTE_OVERVIEW: 13,
    EXPLORE: 14,
    MIN_ZOOM: 3,
    MAX_ZOOM: 19,
  },
  DEFAULT_PADDING: {
    top: 70,
    right: 20,
    bottom: 240,
    left: 20,
  },
  TILE_PROVIDERS: {
    carto_dark: {
      id: 'carto_dark',
      name: 'Dark Matter (CARTO)',
      urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO',
      isDark: true,
    },
    osm_standard: {
      id: 'osm_standard',
      name: 'OpenStreetMap Standard',
      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      isDark: false,
    },
  },
};

function isValidCoordinate(coord) {
  if (!coord || typeof coord !== 'object') return false;
  if (coord.latitude === null || coord.latitude === undefined) return false;
  if (coord.longitude === null || coord.longitude === undefined) return false;

  const lat = typeof coord.latitude === 'string' ? parseFloat(coord.latitude) : Number(coord.latitude);
  const lng = typeof coord.longitude === 'string' ? parseFloat(coord.longitude) : Number(coord.longitude);

  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function calculateRouteBounds(coordinates, paddingFactor = 1.3) {
  const validCoords = coordinates.filter(isValidCoordinate);

  if (validCoords.length === 0) {
    return {
      minLatitude: MAP_CONFIG.DEFAULT_REGION.latitude - MAP_CONFIG.DEFAULT_REGION.latitudeDelta / 2,
      maxLatitude: MAP_CONFIG.DEFAULT_REGION.latitude + MAP_CONFIG.DEFAULT_REGION.latitudeDelta / 2,
      minLongitude: MAP_CONFIG.DEFAULT_REGION.longitude - MAP_CONFIG.DEFAULT_REGION.longitudeDelta / 2,
      maxLongitude: MAP_CONFIG.DEFAULT_REGION.longitude + MAP_CONFIG.DEFAULT_REGION.longitudeDelta / 2,
      centerLatitude: MAP_CONFIG.DEFAULT_REGION.latitude,
      centerLongitude: MAP_CONFIG.DEFAULT_REGION.longitude,
      latitudeDelta: MAP_CONFIG.DEFAULT_REGION.latitudeDelta,
      longitudeDelta: MAP_CONFIG.DEFAULT_REGION.longitudeDelta,
    };
  }

  if (validCoords.length === 1) {
    const coord = validCoords[0];
    const defaultDelta = 0.012;
    return {
      minLatitude: coord.latitude - defaultDelta / 2,
      maxLatitude: coord.latitude + defaultDelta / 2,
      minLongitude: coord.longitude - defaultDelta / 2,
      maxLongitude: coord.longitude + defaultDelta / 2,
      centerLatitude: coord.latitude,
      centerLongitude: coord.longitude,
      latitudeDelta: defaultDelta,
      longitudeDelta: defaultDelta,
    };
  }

  let minLat = validCoords[0].latitude;
  let maxLat = validCoords[0].latitude;
  let minLng = validCoords[0].longitude;
  let maxLng = validCoords[0].longitude;

  for (let i = 1; i < validCoords.length; i++) {
    const pt = validCoords[i];
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
    if (pt.longitude < minLng) minLng = pt.longitude;
    if (pt.longitude > maxLng) maxLng = pt.longitude;
  }

  const rawLatDelta = maxLat - minLat;
  const rawLngDelta = maxLng - minLng;
  const minDelta = 0.005;
  const paddedLatDelta = Math.max(rawLatDelta * paddingFactor, minDelta);
  const paddedLngDelta = Math.max(rawLngDelta * paddingFactor, minDelta);

  return {
    minLatitude: minLat,
    maxLatitude: maxLat,
    minLongitude: minLng,
    maxLongitude: maxLng,
    centerLatitude: (minLat + maxLat) / 2,
    centerLongitude: (minLng + maxLng) / 2,
    latitudeDelta: paddedLatDelta,
    longitudeDelta: paddedLngDelta,
  };
}

function zoomToDeltas(zoomLevel) {
  const clampedZoom = Math.max(MAP_CONFIG.ZOOM.MIN_ZOOM, Math.min(MAP_CONFIG.ZOOM.MAX_ZOOM, zoomLevel));
  const latDelta = 360 / Math.pow(2, clampedZoom);
  const lngDelta = 360 / Math.pow(2, clampedZoom);
  return { latitudeDelta: latDelta, longitudeDelta: lngDelta };
}

function deltasToZoom(latitudeDelta) {
  if (latitudeDelta <= 0) return MAP_CONFIG.ZOOM.ACTIVE_RIDE;
  const zoom = Math.log2(360 / latitudeDelta);
  return Math.round(Math.max(MAP_CONFIG.ZOOM.MIN_ZOOM, Math.min(MAP_CONFIG.ZOOM.MAX_ZOOM, zoom)));
}

function getPerpendicularDistance(point, lineStart, lineEnd) {
  let dx = lineEnd.longitude - lineStart.longitude;
  let dy = lineEnd.latitude - lineStart.latitude;

  if (dx === 0 && dy === 0) {
    const px = point.longitude - lineStart.longitude;
    const py = point.latitude - lineStart.latitude;
    return Math.sqrt(px * px + py * py);
  }

  const t =
    ((point.longitude - lineStart.longitude) * dx + (point.latitude - lineStart.latitude) * dy) /
    (dx * dx + dy * dy);

  let nearestX;
  let nearestY;

  if (t < 0) {
    nearestX = lineStart.longitude;
    nearestY = lineStart.latitude;
  } else if (t > 1) {
    nearestX = lineEnd.longitude;
    nearestY = lineEnd.latitude;
  } else {
    nearestX = lineStart.longitude + t * dx;
    nearestY = lineStart.latitude + t * dy;
  }

  const distX = point.longitude - nearestX;
  const distY = point.latitude - nearestY;

  return Math.sqrt(distX * distX + distY * distY);
}

function douglasPeucker(coordinates, tolerance) {
  if (coordinates.length <= 2) return coordinates;

  let maxDistance = 0;
  let maxIndex = 0;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const distance = getPerpendicularDistance(coordinates[i], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const leftSlice = douglasPeucker(coordinates.slice(0, maxIndex + 1), tolerance);
    const rightSlice = douglasPeucker(coordinates.slice(maxIndex), tolerance);
    return leftSlice.slice(0, leftSlice.length - 1).concat(rightSlice);
  }

  return [first, last];
}

function simplifyRoute(coordinates, toleranceDegrees = 0.00005, maxPointsThreshold = 400) {
  const valid = coordinates.filter(isValidCoordinate);
  if (valid.length <= maxPointsThreshold) return valid;
  const simplified = douglasPeucker(valid, toleranceDegrees);
  if (simplified.length >= 2) {
    simplified[0] = valid[0];
    simplified[simplified.length - 1] = valid[valid.length - 1];
  }
  return simplified;
}

// -------------------------------------------------------------
// TEST RUNNER
// -------------------------------------------------------------
let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🏍️ RIDEX STEP 6: MAPS & RIDE VISUALIZATION TEST SUITE');
  console.log('======================================================\n');

  // TEST 1: Empty Route Bounds Safety
  console.log('1. Empty Route Bounding & Safety:');
  const emptyBounds = calculateRouteBounds([]);
  assert(emptyBounds.centerLatitude === 37.7749, 'Empty route returns safe default center latitude');
  assert(emptyBounds.latitudeDelta === 0.04, 'Empty route returns default safe delta');

  // TEST 2: Single Point Route Safety
  console.log('\n2. Single Point Route Bounding:');
  const singleCoord = [{ latitude: 19.0760, longitude: 72.8777 }];
  const singleBounds = calculateRouteBounds(singleCoord);
  assert(singleBounds.centerLatitude === 19.0760, 'Single point centers directly on coordinate');
  assert(singleBounds.latitudeDelta === 0.012, 'Single point applies standard close view delta');

  // TEST 3: Multi-Point Route Bounding & Center
  console.log('\n3. Multi-Point Route Bounding & Extents:');
  const route = [
    { latitude: 18.5204, longitude: 73.8567 }, // Pune Start
    { latitude: 18.7500, longitude: 73.4000 }, // Lonavala mid
    { latitude: 18.9220, longitude: 72.8347 }, // Mumbai Gateway End
  ];
  const routeBounds = calculateRouteBounds(route, 1.2);
  assert(routeBounds.minLatitude === 18.5204, 'Correct minLatitude calculated');
  assert(routeBounds.maxLatitude === 18.9220, 'Correct maxLatitude calculated');
  assert(routeBounds.minLongitude === 72.8347, 'Correct minLongitude calculated');
  assert(routeBounds.maxLongitude === 73.8567, 'Correct maxLongitude calculated');
  assert(routeBounds.centerLatitude > 18.7 && routeBounds.centerLatitude < 18.8, 'Route center Latitude is accurate');

  // TEST 4: Zoom to Delta Conversion Mathematics
  console.log('\n4. Zoom & Delta Mathematics:');
  const deltas16 = zoomToDeltas(16);
  assert(deltas16.latitudeDelta < 0.01, 'Zoom 16 yields tight cockpit view delta');
  const derivedZoom = deltasToZoom(deltas16.latitudeDelta);
  assert(derivedZoom === 16, 'Inverse deltaToZoom accurately maps back to zoom 16');

  // TEST 5: Douglas-Peucker Simplification on Long Highway Run
  console.log('\n5. Douglas-Peucker Simplification (1,000 Points):');
  const longHighwayRoute = [];
  const startLat = 18.5000;
  const startLng = 73.8000;
  for (let i = 0; i <= 1000; i++) {
    const jitter = (Math.random() - 0.5) * 0.000002;
    longHighwayRoute.push({
      latitude: startLat + (i * 0.0005),
      longitude: startLng + (i * 0.0005) + jitter,
    });
  }
  const startTime = Date.now();
  const simplified = simplifyRoute(longHighwayRoute, 0.00005, 400);
  const durationMs = Date.now() - startTime;

  assert(simplified.length < 50, `1,000 colinear points reduced to ${simplified.length} vertices (>95% reduction)`);
  assert(simplified[0].latitude === longHighwayRoute[0].latitude, 'Start point coordinate exactly preserved');
  assert(simplified[simplified.length - 1].latitude === longHighwayRoute[1000].latitude, 'End point coordinate exactly preserved');
  assert(durationMs < 50, `Simplification executed in ${durationMs}ms (lightning-fast)`);

  // TEST 6: Preservation of Sharp Corners (Hairpins)
  console.log('\n6. Preservation of Sharp Hairpins in Mountain Passes:');
  const mountainPass = [
    { latitude: 18.0000, longitude: 73.0000 },
    { latitude: 18.0010, longitude: 73.0010 },
    { latitude: 18.0050, longitude: 73.0012 },
    { latitude: 18.0010, longitude: 73.0014 },
    { latitude: 18.0000, longitude: 73.0020 },
  ];
  const denseMountain = [];
  for (let rep = 0; rep < 100; rep++) {
    denseMountain.push(...mountainPass.map(p => ({
      latitude: p.latitude + (rep * 0.005),
      longitude: p.longitude + (rep * 0.005),
    })));
  }
  const simplifiedMountain = simplifyRoute(denseMountain, 0.00005, 400);
  assert(simplifiedMountain.length >= 200, `Hairpin apexes preserved: retained ${simplifiedMountain.length} structural vertices`);

  // TEST 7: Map Provider & Tile URL Resolution
  console.log('\n7. Map Provider Abstraction & URL Resolution:');
  const darkConfig = MAP_CONFIG.TILE_PROVIDERS.carto_dark;
  assert(darkConfig.isDark === true, 'CartoDB Dark Matter identified as dark theme');
  assert(darkConfig.attribution.includes('OpenStreetMap'), 'OpenStreetMap attribution present');
  const testTileUrl = darkConfig.urlTemplate
    .replace('{s}', 'b')
    .replace('{z}', '16')
    .replace('{x}', '38210')
    .replace('{y}', '24100')
    .replace('{r}', '@2x');
  assert(testTileUrl.includes('https://b.basemaps.cartocdn.com/dark_all/16/38210/24100@2x.png'), 'Tile URL template resolved cleanly');

  // TEST 8: Sanitization of Corrupted GPS Records
  console.log('\n8. Sanitization of Corrupted GPS Records:');
  const dirtyLocations = [
    { latitude: 18.5204, longitude: 73.8567 }, // Valid
    { latitude: null, longitude: 73.8567 },    // Invalid
    { latitude: 18.5204, longitude: undefined },// Invalid
    { latitude: 95.0, longitude: 73.8567 },    // Out of range lat (>90)
    { latitude: 'invalid_lat', longitude: 73.8567 }, // Non-numeric
    { latitude: 18.5205, longitude: 73.8568 }, // Valid
  ];
  const cleaned = dirtyLocations.filter(isValidCoordinate);
  assert(cleaned.length === 2, `Sanitized ${dirtyLocations.length} records down to ${cleaned.length} valid coordinates`);

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================\n');
}

runTests();
