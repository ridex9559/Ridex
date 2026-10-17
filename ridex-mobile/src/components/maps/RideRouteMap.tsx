/**
 * RIDEX — Ride Route Map Component
 * Reusable component for displaying completed ride journeys, history overviews,
 * and route details with auto-fitted bounding boxes and start/finish pins.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { RidexMap } from './RidexMap';
import { useRideMap } from '../../hooks/useRideMap';
import { MapCoordinate, MapPadding } from '../../services/maps/mapTypes';
import { MAP_CONFIG } from '../../config/maps';

export interface RideRouteMapProps {
  rideId?: string;
  coordinates?: MapCoordinate[];
  startCoordinate?: MapCoordinate | null;
  endCoordinate?: MapCoordinate | null;
  interactive?: boolean;
  padding?: Partial<MapPadding>;
  style?: any;
}

export const RideRouteMap: React.FC<RideRouteMapProps> = ({
  rideId,
  coordinates: propCoordinates,
  startCoordinate: propStart,
  endCoordinate: propEnd,
  interactive = true,
  padding = MAP_CONFIG.SUMMARY_PADDING,
  style,
}) => {
  const {
    coordinates: hookCoordinates,
    startCoordinate: hookStart,
    endCoordinate: hookEnd,
    region,
    isLoading,
    isEmpty,
  } = useRideMap({
    rideId: rideId || null,
    autoLoad: !!rideId,
    simplify: true,
  });

  const effectiveCoordinates = propCoordinates || hookCoordinates;
  const effectiveStart = propStart !== undefined ? propStart : hookStart;
  const effectiveEnd = propEnd !== undefined ? propEnd : hookEnd;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#FF5722" />
        <Text style={styles.loadingText}>LOADING GPS ROUTE...</Text>
      </View>
    );
  }

  if (effectiveCoordinates.length === 0 && !isLoading) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyTitle}>NO ROUTE RECORDED</Text>
        <Text style={styles.emptySubtitle}>GPS points were not recorded for this ride.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <RidexMap
        initialRegion={region}
        routeCoordinates={effectiveCoordinates}
        startCoordinate={effectiveStart}
        endCoordinate={effectiveEnd}
        followRider={false}
        showsRecenterButton={false}
        mapPadding={padding}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#090D16',
  },
  loadingContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
});
