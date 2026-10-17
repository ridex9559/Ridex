/**
 * RIDEX — Route Simplification Service
 * High-performance Douglas-Peucker polyline simplification algorithm.
 * Optimizes long motorcycle rides (thousands of GPS points) into smooth, lightweight
 * renderable trails while preserving hairpins, apexes, and route fidelity.
 */

import { MapCoordinate } from '../../services/maps/mapTypes';
import { isValidCoordinate } from './routeBounds';

/**
 * Calculates perpendicular distance from a point to a line segment.
 */
function getPerpendicularDistance(
  point: MapCoordinate,
  lineStart: MapCoordinate,
  lineEnd: MapCoordinate
): number {
  let dx = lineEnd.longitude - lineStart.longitude;
  let dy = lineEnd.latitude - lineStart.latitude;

  // If start and end are identical point
  if (dx === 0 && dy === 0) {
    const px = point.longitude - lineStart.longitude;
    const py = point.latitude - lineStart.latitude;
    return Math.sqrt(px * px + py * py);
  }

  // Normalize projection
  const t =
    ((point.longitude - lineStart.longitude) * dx + (point.latitude - lineStart.latitude) * dy) /
    (dx * dx + dy * dy);

  let nearestX: number;
  let nearestY: number;

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

/**
 * Recursive Douglas-Peucker step.
 */
function douglasPeucker(
  coordinates: MapCoordinate[],
  tolerance: number
): MapCoordinate[] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

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

/**
 * Simplifies a coordinate array using Douglas-Peucker.
 * @param coordinates Array of MapCoordinates
 * @param toleranceDegrees Distance tolerance in degrees (default: 0.00005 ~ 5.5 meters)
 * @param maxPointsThreshold Point count above which simplification triggers (default: 500)
 */
export function simplifyRoute(
  coordinates: MapCoordinate[],
  toleranceDegrees = 0.00005,
  maxPointsThreshold = 400
): MapCoordinate[] {
  const valid = coordinates.filter(isValidCoordinate);

  // If under threshold, do not simplify
  if (valid.length <= maxPointsThreshold) {
    return valid;
  }

  // Always retain start & end points
  const simplified = douglasPeucker(valid, toleranceDegrees);

  // Ensure start and end are exactly preserved
  if (simplified.length >= 2) {
    simplified[0] = valid[0];
    simplified[simplified.length - 1] = valid[valid.length - 1];
  }

  return simplified;
}
