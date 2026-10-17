/**
 * RIDEX — End / Finish Marker Component
 * Visual anchor representing the destination / completion location of a ride.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { EndMarkerProps } from '../../services/maps/mapTypes';
import { MAP_CONFIG } from '../../config/maps';

export const EndMarker: React.FC<EndMarkerProps> = ({ title = 'FINISH' }) => {
  return (
    <View style={styles.container} accessibilityLabel={`Ride End Location: ${title}`}>
      {/* Finish Label Pill */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{title}</Text>
      </View>

      {/* Pin Body */}
      <View style={styles.pinBody}>
        <Check size={14} color="#0F172A" strokeWidth={3.5} />
      </View>

      {/* Pin Anchor Arrow */}
      <View style={styles.pinArrow} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  badge: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MAP_CONFIG.STYLE.END_MARKER_COLOR,
    marginBottom: 2,
  },
  badgeText: {
    color: MAP_CONFIG.STYLE.END_MARKER_COLOR,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pinBody: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: MAP_CONFIG.STYLE.END_MARKER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: MAP_CONFIG.STYLE.END_MARKER_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: MAP_CONFIG.STYLE.END_MARKER_COLOR,
    marginTop: -1,
  },
});
