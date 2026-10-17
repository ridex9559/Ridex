/**
 * RIDEX — Map Controls Component
 * Floating glassmorphic controls: Recenter Button (⌖), Follow Mode Status,
 * Compass indicator, and legal attribution badge.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Crosshair, Compass } from 'lucide-react-native';
import { mapProviderService } from '../../services/maps/MapProviderService';
import { MapProviderType } from '../../services/maps/mapTypes';

export interface MapControlsProps {
  isFollowing?: boolean;
  onRecenter?: () => void;
  heading?: number | null;
  provider?: MapProviderType;
  showRecenter?: boolean;
  showAttribution?: boolean;
  showCompass?: boolean;
  topOffset?: number;
  bottomOffset?: number;
}

export const MapControls: React.FC<MapControlsProps> = ({
  isFollowing = false,
  onRecenter,
  heading,
  provider,
  showRecenter = true,
  showAttribution = true,
  showCompass = false,
  topOffset = 60,
  bottomOffset = 230,
}) => {
  const attribution = mapProviderService.getAttribution(provider);
  const validHeading = typeof heading === 'number' && !isNaN(heading) ? heading : null;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Top Right Controls (Compass & Follow Pill) */}
      <View style={[styles.topRightControls, { top: topOffset }]} pointerEvents="box-none">
        {showCompass && validHeading !== null && (
          <View style={styles.compassBadge}>
            <View style={{ transform: [{ rotate: `${validHeading}deg` }] }}>
              <Compass size={18} color="#00E5FF" />
            </View>
            <Text style={styles.compassText}>{Math.round(validHeading)}°</Text>
          </View>
        )}

        {isFollowing && (
          <View style={styles.followBadge}>
            <View style={styles.followDot} />
            <Text style={styles.followText}>FOLLOWING</Text>
          </View>
        )}
      </View>

      {/* Floating Recenter Button (Right Side above cockpit HUD) */}
      {showRecenter && (
        <View style={[styles.recenterWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.recenterButton,
              isFollowing && styles.recenterButtonActive,
            ]}
            onPress={onRecenter}
            activeOpacity={0.7}
            accessibilityLabel="Recenter map on rider"
            accessibilityRole="button"
          >
            <Crosshair
              size={22}
              color={isFollowing ? '#FF5722' : '#FFFFFF'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Legal Map Tile Attribution */}
      {showAttribution && (
        <View style={styles.attributionContainer} pointerEvents="none">
          <Text style={styles.attributionText}>{attribution}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  topRightControls: {
    position: 'absolute',
    right: 16,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  followBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.5)',
    gap: 6,
  },
  followDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5722',
  },
  followText: {
    color: '#FF5722',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  compassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    gap: 4,
  },
  compassText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  recenterWrapper: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
  },
  recenterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  recenterButtonActive: {
    borderColor: '#FF5722',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    shadowColor: '#FF5722',
    shadowOpacity: 0.4,
  },
  attributionContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 4 : 8,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '500',
  },
});
