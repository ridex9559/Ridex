/**
 * RIDEX — Ride Polyline Component
 * High-contrast, anti-aliased route line with customizable glow effects.
 */

import React from 'react';
import { Platform } from 'react-native';
import { RidePolylineProps } from '../../services/maps/mapTypes';
import { MAP_CONFIG } from '../../config/maps';

import { Polyline as NativePolyline } from './NativeMapsBridge';

export const RidePolyline: React.FC<RidePolylineProps> = ({
  coordinates,
  strokeColor = MAP_CONFIG.STYLE.ROUTE_COLOR,
  strokeWidth = MAP_CONFIG.STYLE.ROUTE_WIDTH,
  glowColor = MAP_CONFIG.STYLE.ROUTE_GLOW_COLOR,
  glowWidth = MAP_CONFIG.STYLE.ROUTE_GLOW_WIDTH,
}) => {
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  // Native react-native-maps rendering
  if (NativePolyline && Platform.OS !== 'web') {
    return (
      <>
        {/* Glow Underlay */}
        <NativePolyline
          coordinates={coordinates}
          strokeColor={glowColor}
          strokeWidth={glowWidth}
          lineCap="round"
          lineJoin="round"
          zIndex={1}
        />
        {/* Crisp Foreground Line */}
        <NativePolyline
          coordinates={coordinates}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
          zIndex={2}
        />
      </>
    );
  }

  return null;
};
