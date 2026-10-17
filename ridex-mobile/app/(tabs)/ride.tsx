import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Play,
  Pause,
  Square,
  Gauge,
  Bike,
  AlertTriangle,
  Settings,
  Flame,
  Map as MapIcon,
} from 'lucide-react-native';
import { Card, Badge, Button, SyncStatusBar } from '@/components/ui';
import { RidexMap } from '@/components/maps/RidexMap';
import { useRideTracking } from '@/hooks/useRideTracking';
import { useRideMap } from '@/hooks/useRideMap';
import { useActiveRide } from '@/hooks/useActiveRide';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { useBikeStore } from '@/store/bikeStore';
import { formatTimer, formatDistance, formatSpeed } from '@/utils/formatters';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function RideScreen() {
  const router = useRouter();
  const {
    isTracking,
    isPaused,
    status,
    currentSpeedKmh,
    maxSpeedKmh,
    avgSpeedKmh,
    distanceKm,
    durationSeconds,
    elevationGainMeters,
    currentLeanAngleDegrees,
    maxLeanAngleDegrees,
    currentLocation,
    error,
    startRide,
    pauseRide,
    resumeRide,
    stopRide,
  } = useRideTracking();

  const {
    coordinates: activeRouteCoordinates,
    startCoordinate,
    currentCoordinate,
    currentHeading,
  } = useRideMap();

  const {
    recoverableRide,
    resumeRide: resumeRecovered,
    finishRide: finishRecovered,
    discardRide: discardRecovered,
  } = useActiveRide();

  const { isGranted, isBlocked, isServicesEnabled, requestPermission, openSettings } =
    useLocationPermission();

  const { motorcycles, activeMotorcycleId } = useBikeStore();
  const activeBike = motorcycles.find((b) => b.id === activeMotorcycleId) || motorcycles[0];

  const [selectedType, setSelectedType] = useState<'SOLO' | 'GROUP' | 'COMMUTE' | 'TRACK'>('SOLO');
  const [isStarting, setIsStarting] = useState(false);
  const [showStandbyMap, setShowStandbyMap] = useState(true);
  const [followMode, setFollowMode] = useState(true);

  const handleStart = async () => {
    if (!isGranted) {
      const granted = await requestPermission();
      if (!granted) {
        if (isBlocked) {
          Alert.alert(
            'GPS Permission Required',
            'Location permission is permanently disabled. Please enable it in system settings to record rides.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openSettings },
            ]
          );
        } else {
          Alert.alert('Permission Denied', 'RIDEX requires GPS access to track your ride.');
        }
        return;
      }
    }

    if (!isServicesEnabled) {
      Alert.alert(
        'GPS Services Disabled',
        'Please turn on device Location Services (GPS) to track your ride.'
      );
      return;
    }

    setIsStarting(true);
    try {
      const ride = await startRide({
        motorcycleId: activeBike?.id,
        name: `${activeBike?.model || 'Motorcycle'} Adventure`,
        visibility: 'PUBLIC',
      });
      if (!ride) {
        Alert.alert('Start Failed', 'Could not start GPS tracking. Please check your settings.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handlePauseToggle = async () => {
    if (isPaused) {
      await resumeRide();
    } else {
      await pauseRide();
    }
  };

  const handleStop = async () => {
    Alert.alert(
      'Finish Ride',
      'Are you ready to complete and save this ride to your local logbook?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish & Save',
          style: 'default',
          onPress: async () => {
            const completed = await stopRide();
            if (completed) {
              router.push(`/rides/summary?rideId=${completed.id}`);
            } else {
              router.push('/(tabs)/home');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* 1. HERO MAP BACKGROUND LAYER */}
      {(isTracking || showStandbyMap) && (
        <View style={StyleSheet.absoluteFill}>
          <RidexMap
            currentLocation={currentCoordinate}
            currentHeading={currentHeading}
            routeCoordinates={activeRouteCoordinates}
            startCoordinate={startCoordinate}
            isTracking={isTracking}
            followRider={followMode}
            onFollowModeChange={setFollowMode}
            showsRecenterButton={true}
          />
        </View>
      )}

      {/* 2. FOREGROUND HUD & CONTROLS LAYER */}
      <SafeAreaView style={styles.hudOverlay} pointerEvents="box-none">
        {/* Top Status & Cockpit Header */}
        <View style={styles.header} pointerEvents="box-none">
          <View style={styles.statusBox}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: isTracking
                    ? isPaused
                      ? COLORS.status.warning
                      : COLORS.status.success
                    : COLORS.text.muted,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {isTracking
                ? isPaused
                  ? 'HUD PAUSED'
                  : 'LIVE GPS TELEMETRY'
                : 'COCKPIT STANDBY'}
            </Text>
          </View>

          <Badge
            label={activeBike ? `${activeBike.make} ${activeBike.model}` : 'STANDBY FLEET'}
            variant="primary"
            size="sm"
          />
        </View>

        <SyncStatusBar />

        {/* Recoverable Unfinished Ride Banner */}
        {!isTracking && recoverableRide && (
          <View style={styles.recoveryBanner}>
            <View style={styles.recoveryHeader}>
              <AlertTriangle size={18} color="#F59E0B" />
              <Text style={styles.recoveryTitle}>Unfinished Ride Detected</Text>
            </View>
            <Text style={styles.recoverySubtitle}>
              Recovered: {recoverableRide.name} ({formatDistance(recoverableRide.distance_meters / 1000)} • {formatTimer(recoverableRide.duration_seconds)})
            </Text>
            <View style={styles.recoveryActions}>
              <Button
                title="Resume Ride"
                onPress={resumeRecovered}
                variant="primary"
                size="sm"
                leftIcon={<Play size={14} color="#FFFFFF" />}
                style={styles.recoveryBtn}
              />
              <Button
                title="Finish & Save"
                onPress={finishRecovered}
                variant="secondary"
                size="sm"
                style={styles.recoveryBtn}
              />
              <Button
                title="Discard"
                onPress={discardRecovered}
                variant="ghost"
                size="sm"
              />
            </View>
          </View>
        )}

        {/* Permission Warning if Blocked */}
        {!isTracking && isBlocked && (
          <View style={styles.permissionWarning}>
            <AlertTriangle size={18} color="#EF4444" />
            <Text style={styles.permissionWarningText}>
              GPS permission is blocked. Enable in settings to record rides.
            </Text>
            <TouchableOpacity onPress={openSettings} style={styles.settingsBtn}>
              <Settings size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {!isTracking ? (
          /* Standby Cockpit Panel (Overlaid on Radar Map) */
          <View style={styles.standbyBottomWrapper} pointerEvents="box-none">
            <Card variant="glass" style={styles.standbyGlassCard}>
              {/* Ride Type Selector */}
              <View style={styles.typeRow}>
                {(['SOLO', 'GROUP', 'COMMUTE', 'TRACK'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSelectedType(t)}
                    style={[styles.typeChip, selectedType === t && styles.typeChipActive]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        selectedType === t && styles.typeChipTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pre-ride Bike Specs */}
              <View style={styles.standbyBikeHeader}>
                <Bike size={18} color={COLORS.primary.DEFAULT} />
                <Text style={styles.standbyBikeTitle}>
                  {activeBike?.year} {activeBike?.make} {activeBike?.model}
                </Text>
              </View>
              <Text style={styles.standbyBikeSpecs}>
                Local GPS logging active (1.0Hz). Complete routes & telemetry persist to SQLite.
              </Text>

              <Button
                title={isStarting ? 'INITIALIZING GPS...' : 'IGNITION — START TRACKING'}
                onPress={handleStart}
                variant="primary"
                size="lg"
                fullWidth
                disabled={isStarting}
                leftIcon={<Play size={20} color="#FFFFFF" />}
                style={styles.ignitionBtn}
              />
            </Card>
          </View>
        ) : (
          /* Live Tracking Cockpit HUD */
          <View style={styles.liveHudContainer} pointerEvents="box-none">
            {/* Speedometer & Lean Angle Floating Capsule */}
            <View style={styles.floatingSpeedCapsule} pointerEvents="none">
              <View style={styles.speedRow}>
                <Text style={styles.speedValue}>{Math.round(currentSpeedKmh)}</Text>
                <Text style={styles.speedUnit}>KM/H</Text>
              </View>

              <View style={styles.leanPill}>
                <Flame size={14} color={COLORS.accent.telemetryCyan} />
                <Text style={styles.leanText}>
                  {currentLeanAngleDegrees >= 0
                    ? `${currentLeanAngleDegrees}° R`
                    : `${Math.abs(currentLeanAngleDegrees)}° L`}
                </Text>
                <Text style={styles.leanSubText}>MAX {maxLeanAngleDegrees || 0}°</Text>
              </View>
            </View>

            {/* Bottom Glassmorphic Telemetry Card & Ride Controls */}
            <View style={styles.liveBottomWrapper} pointerEvents="box-none">
              <Card variant="glass" style={styles.liveTelemetryCard}>
                <View style={styles.hudGrid}>
                  <View style={styles.metricCol}>
                    <Text style={styles.hudMetricLabel}>DURATION</Text>
                    <Text style={styles.hudMetricValue}>{formatTimer(durationSeconds)}</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricCol}>
                    <Text style={styles.hudMetricLabel}>DISTANCE</Text>
                    <Text style={styles.hudMetricValue}>{formatDistance(distanceKm)}</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricCol}>
                    <Text style={styles.hudMetricLabel}>AVG SPEED</Text>
                    <Text style={styles.hudMetricValue}>{formatSpeed(avgSpeedKmh)}</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricCol}>
                    <Text style={styles.hudMetricLabel}>TOP SPEED</Text>
                    <Text style={[styles.hudMetricValue, { color: COLORS.accent.telemetryCyan }]}>
                      {formatSpeed(maxSpeedKmh)}
                    </Text>
                  </View>
                </View>

                {/* Error Notice */}
                {error && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                )}

                {/* Control Action Buttons */}
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    onPress={handlePauseToggle}
                    style={[
                      styles.controlBtn,
                      { backgroundColor: isPaused ? COLORS.status.success : COLORS.status.warning },
                    ]}
                    activeOpacity={0.8}
                  >
                    {isPaused ? <Play size={20} color="#FFFFFF" /> : <Pause size={20} color="#FFFFFF" />}
                    <Text style={styles.controlBtnText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleStop}
                    style={[styles.controlBtn, { backgroundColor: COLORS.status.error }]}
                    activeOpacity={0.8}
                  >
                    <Square size={20} color="#FFFFFF" />
                    <Text style={styles.controlBtnText}>FINISH</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  hudOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  recoveryBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recoveryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },
  recoverySubtitle: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  recoveryActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  recoveryBtn: {
    paddingHorizontal: 12,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  permissionWarningText: {
    flex: 1,
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  settingsBtn: {
    padding: 6,
    backgroundColor: '#EF4444',
    borderRadius: RADIUS.sm,
  },
  standbyBottomWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  standbyGlassCard: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.xl,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  typeChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
    borderColor: COLORS.primary.DEFAULT,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
  },
  typeChipTextActive: {
    color: COLORS.primary.DEFAULT,
  },
  standbyBikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  standbyBikeTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  standbyBikeSpecs: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  ignitionBtn: {
    marginTop: SPACING.xs,
  },
  liveHudContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  floatingSpeedCapsule: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 87, 34, 0.4)',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  speedValue: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 2,
  },
  leanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    gap: 6,
    marginTop: 2,
  },
  leanText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent.telemetryCyan,
  },
  leanSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  liveBottomWrapper: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  liveTelemetryCard: {
    padding: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: RADIUS.xl,
  },
  hudGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  hudMetricLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  hudMetricValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  controlBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
