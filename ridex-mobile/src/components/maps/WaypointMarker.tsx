/**
 * RIDEX — Waypoint / Stop Marker Component
 * Visual anchor representing intermediate checkpoints (Breakfast, Fuel, Viewpoint, Lunch, etc.)
 * Displays stop category icon, order index badge, and duration pill.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapWaypoint } from '../../services/maps/mapTypes';

export interface WaypointMarkerProps {
  waypoint: MapWaypoint;
  index?: number;
  showLabel?: boolean;
}

export const WaypointMarker: React.FC<WaypointMarkerProps> = ({
  waypoint,
  index,
  showLabel = true,
}) => {
  const getCategoryConfig = (type?: string, category?: string) => {
    const key = (category || type || '').toUpperCase();
    if (key.includes('FUEL') || key.includes('PETROL') || key.includes('GAS')) {
      return { icon: 'flash' as const, color: '#06B6D4', label: 'Fuel' };
    }
    if (key.includes('BREAKFAST') || key.includes('FOOD')) {
      return { icon: 'cafe' as const, color: '#F59E0B', label: 'Breakfast' };
    }
    if (key.includes('LUNCH') || key.includes('DINNER') || key.includes('RESTAURANT')) {
      return { icon: 'restaurant' as const, color: '#FB923C', label: 'Lunch' };
    }
    if (key.includes('COFFEE') || key.includes('TEA')) {
      return { icon: 'pint' as const, color: '#EAB308', label: 'Coffee' };
    }
    if (key.includes('VIEW') || key.includes('PHOTO') || key.includes('SCENIC')) {
      return { icon: 'camera' as const, color: '#A855F7', label: 'View' };
    }
    if (key.includes('REST') || key.includes('HOTEL')) {
      return { icon: 'bed' as const, color: '#10B981', label: 'Rest' };
    }
    return { icon: 'location' as const, color: '#38BDF8', label: 'Stop' };
  };

  const config = getCategoryConfig(waypoint.type, waypoint.category);
  const stopIndex = typeof index === 'number' ? index + 1 : waypoint.orderIndex || 1;
  const labelText = waypoint.name || `${config.label} #${stopIndex}`;
  const durationText = waypoint.estimatedStopMinutes ? `${waypoint.estimatedStopMinutes}m` : null;

  return (
    <View style={styles.container} accessibilityLabel={`Stop ${stopIndex}: ${labelText}`}>
      {/* Waypoint Label Badge */}
      {showLabel && (
        <View style={[styles.badge, { borderColor: config.color }]}>
          <Text style={[styles.badgeText, { color: config.color }]} numberOfLines={1}>
            #{stopIndex} {labelText}
            {durationText ? ` (${durationText})` : ''}
          </Text>
        </View>
      )}

      {/* Pin Body with Icon & Number Tag */}
      <View style={[styles.pinBody, { backgroundColor: config.color, shadowColor: config.color }]}>
        <Ionicons name={config.icon} size={13} color="#090D16" />
        <View style={styles.indexTag}>
          <Text style={styles.indexText}>{stopIndex}</Text>
        </View>
      </View>

      {/* Pin Anchor Arrow */}
      <View style={[styles.pinArrow, { borderTopColor: config.color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  badge: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 2,
    maxWidth: 90,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  pinBody: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 6,
    position: 'relative',
  },
  indexTag: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#090D16',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
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
    marginTop: -1,
  },
});
