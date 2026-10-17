/**
 * RIDEX — Current Location / Rider Marker
 * High-visibility motorcycle position beacon with directional heading arrow
 * and subtle radar pulse.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Navigation, Compass } from 'lucide-react-native';
import { CurrentLocationMarkerProps } from '../../services/maps/mapTypes';
import { MAP_CONFIG } from '../../config/maps';

export const CurrentLocationMarker: React.FC<CurrentLocationMarkerProps> = ({
  heading,
  speedKmh = 0,
  isRiding = false,
}) => {
  const validHeading = typeof heading === 'number' && !isNaN(heading) && heading >= 0 && heading <= 360 ? heading : null;

  return (
    <View style={styles.container} pointerEvents="none" accessibilityLabel="Rider Current Location">
      {/* Outer Radar Glow / Pulse Ring */}
      <View style={[styles.pulseRing, isRiding && styles.pulseRingActive]} />

      {/* Core Rider Badge */}
      <View style={styles.coreCircle}>
        {validHeading !== null ? (
          <View
            style={[
              styles.headingWrapper,
              { transform: [{ rotate: `${validHeading}deg` }] },
            ]}
          >
            <Navigation
              size={18}
              color="#FFFFFF"
              fill="#FFFFFF"
            />
          </View>
        ) : (
          <View style={styles.centerDot}>
            <Compass size={16} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Live Speed Badge if moving */}
      {isRiding && (speedKmh ?? 0) > 2 && (
        <View style={styles.speedBadge}>
          <Text style={styles.speedText}>{Math.round(speedKmh ?? 0)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 87, 34, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.45)',
  },
  pulseRingActive: {
    backgroundColor: 'rgba(255, 87, 34, 0.35)',
    borderColor: '#FF5722',
    transform: [{ scale: 1.15 }],
  },
  coreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MAP_CONFIG.STYLE.RIDER_MARKER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  headingWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedBadge: {
    position: 'absolute',
    top: -4,
    right: 2,
    backgroundColor: '#0F172A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  speedText: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
