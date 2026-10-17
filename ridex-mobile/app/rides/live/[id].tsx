import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Radio,
  Mic,
  AlertTriangle,
  Users,
  Compass,
  Navigation,
  Sparkles,
  Shield,
  Layers,
  PowerOff,
  LogOut,
  MessageSquare,
} from 'lucide-react-native';
import { useRideDetails } from '@/hooks/useRideDetails';
import { useLiveRide } from '@/hooks/useLiveRide';
import { useLiveLocations } from '@/hooks/useLiveLocations';
import { useRideTrackingStore } from '@/store/rideTrackingStore';
import { LiveRideMap } from '@/components/liveRide/LiveRideMap';
import { LiveRidersDrawer } from '@/components/liveRide/LiveRidersDrawer';
import { GroupStatusHUD, SquadProximityStatus } from '@/components/liveRide/GroupStatusHUD';
import { IntercomBottomSheet } from '@/components/liveRide/IntercomBottomSheet';
import { EmergencyHelpModal } from '@/components/liveRide/EmergencyHelpModal';
import { StartRideModal } from '@/components/liveRide/StartRideModal';
import { RideChatModal } from '@/components/chat/RideChatModal';
import { LiveRiderLocation } from '@/types/liveRide';
import { Motorcycle } from '@/types/motorcycle';
import { GpsSimulationEngine } from '@/services/location/GpsSimulationEngine';
import { WeatherService, WeatherCondition, WeatherAlert } from '@/services/weather/WeatherService';
import { checkpointService } from '@/services/connectRide/CheckpointService';
import { useQuery } from '@tanstack/react-query';
import { WeatherHUD } from '@/components/weather/WeatherHUD';
import { WeatherAlertBanner } from '@/components/weather/WeatherAlertBanner';
import { safetyService } from '@/services/safety/SafetyService';
import { HelpAlert } from '@/types/safety';
import { SeparationEngine } from '@/services/connectRide/SeparationEngine';
import { COLORS } from '@/theme/colors';

import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function LiveGroupRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  // 1. Group Ride Details
  const { ride, isOrganizer, currentUserId, isLoading: isLoadingDetails } = useRideDetails(id || '');

  // 1b. Waypoints / Checkpoints
  const { data: checkpoints = [] } = useQuery({
    queryKey: ['rides', 'checkpoints', id],
    queryFn: () => checkpointService.getCheckpoints(id as string),
    enabled: !!id,
  });

  const waypoints = useMemo(() => {
    return checkpoints.filter((cp) => cp.type !== 'START' && cp.type !== 'DESTINATION');
  }, [checkpoints]);

  // 2. Live Session
  const { session, isLoading: isLoadingSession, endLiveSession, leaveLiveSession } = useLiveRide(id || '');

  // 3. Hardware GPS
  const currentLocation = useRideTrackingStore((s) => s.currentLocation);

  // 4. Live Locations
  const { riders: realRiders, isBroadcasting, toggleBroadcasting, activeRiderCount: realCount } =
    useLiveLocations(session?.id, id || '');

  // 5. Simulation Sandbox State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedRiders, setSimulatedRiders] = useState<LiveRiderLocation[]>([]);

  // 6. UI Modals
  const [followMode, setFollowMode] = useState(true);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [showIntercom, setShowIntercom] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<HelpAlert[]>([]);
  const [selectedBike, setSelectedBike] = useState<Motorcycle | null>(null);

  // Weather state
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);

  // Subscribe to Safety SOS Alerts
  useEffect(() => {
    const unsub = safetyService.subscribe((alerts) => {
      setActiveAlerts(alerts);
    });
    return unsub;
  }, []);

  // Weather
  useEffect(() => {
    const lat = currentLocation?.latitude || ride?.startLocation?.latitude || 18.5204;
    const lng = currentLocation?.longitude || ride?.startLocation?.longitude || 73.8567;
    WeatherService.getWeather(lat, lng).then((w) => {
      setWeather(w);
      setWeatherAlerts(WeatherService.evaluateAlerts(w));
    });
  }, [currentLocation?.latitude, currentLocation?.longitude, ride?.startLocation?.latitude]);

  // Combined riders (real + simulated)
  const riders = useMemo(() => {
    if (isSimulating && simulatedRiders.length > 0) {
      return [...realRiders, ...simulatedRiders];
    }
    if (realRiders.length > 0) {
      return realRiders;
    }
    if (currentLocation) {
      return [
        {
          userId: currentUserId || 'rider-self',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          heading: currentLocation.heading || 0,
          speedKmh: Math.round((currentLocation.speed || 0) * 3.6),
          batteryPercent: 95,
          presenceStatus: 'LIVE',
          updatedAt: Date.now(),
          user: {
            name: 'You',
            fullName: 'You',
          },
        } as LiveRiderLocation,
      ];
    }
    return [];
  }, [realRiders, simulatedRiders, isSimulating, currentLocation, currentUserId]);

  // Dynamic Geodesic Separation & Proximity Calculation via SeparationEngine
  const groupSeparation = useMemo(() => {
    return SeparationEngine.evaluateGroupSeparation(
      riders,
      currentUserId,
      ride?.organizerId
    );
  }, [riders, currentUserId, ride?.organizerId]);

  const proximityStatus: SquadProximityStatus = groupSeparation.status;
  const leadDist = groupSeparation.leadDistanceMeters || 0;
  const tailDist = groupSeparation.tailDistanceMeters || 0;
  const activeRiderCount = groupSeparation.activeRidersCount || Math.max(riders.length, realCount);

  // Multi-Rider Simulation Toggle
  const handleToggleSimulation = () => {
    if (isSimulating) {
      GpsSimulationEngine.stopSimulation();
      setSimulatedRiders([]);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      const coords =
        ride?.startLocation && ride?.destination
          ? [
              { latitude: ride.startLocation.latitude, longitude: ride.startLocation.longitude },
              {
                latitude: (ride.startLocation.latitude + ride.destination.latitude) / 2 + 0.02,
                longitude: (ride.startLocation.longitude + ride.destination.longitude) / 2 - 0.03,
              },
              { latitude: ride.destination.latitude, longitude: ride.destination.longitude },
            ]
          : [];
      GpsSimulationEngine.startSimulation(coords, (simSquad) => {
        setSimulatedRiders(simSquad);
      });
    }
  };

  useEffect(() => {
    return () => {
      GpsSimulationEngine.stopSimulation();
      SeparationEngine.reset();
    };
  }, []);

  const handleSelectRider = (rider: LiveRiderLocation) => {
    setSelectedRiderId(rider.userId);
    setFollowMode(false);
  };

  const handleConfirmStartBike = (bike: Motorcycle) => {
    setSelectedBike(bike);
    setShowStartModal(false);
    if (!isBroadcasting) {
      toggleBroadcasting();
    }
    Alert.alert(
      'Live Session Started! 🏍️',
      `You are rolling on your ${bike.brand} ${bike.model}. Live GPS radar broadcasting.`
    );
  };

  const handleEndMyRide = () => {
    Alert.alert(
      'End My Ride?',
      'This will stop sharing your live GPS location with the squad and save your ride session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End My Ride',
          style: 'destructive',
          onPress: async () => {
            if (isBroadcasting) toggleBroadcasting();
            if (isSimulating) GpsSimulationEngine.stopSimulation();
            await leaveLiveSession();
            router.replace(`/rides/${id}` as any);
          },
        },
      ]
    );
  };

  const handleCloseGroupRide = () => {
    Alert.alert(
      'Close Group Ride Event?',
      'As the Road Captain, closing the group ride will conclude the live event for all squad members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Event',
          style: 'destructive',
          onPress: async () => {
            if (isSimulating) GpsSimulationEngine.stopSimulation();
            await endLiveSession();
            router.replace(`/rides/${id}` as any);
          },
        },
      ]
    );
  };

  if (isLoadingDetails || isLoadingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text style={styles.loadingText}>CONNECTING TO SQUAD RADAR...</Text>
      </SafeAreaView>
    );
  }

  if (!id || (!ride && !isLoadingDetails)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <AlertTriangle size={36} color={COLORS.primary.DEFAULT} />
        <Text style={[styles.loadingText, { color: COLORS.text.primary, fontSize: 14, marginTop: 8 }]}>
          RIDE SESSION NOT FOUND
        </Text>
        <Text style={{ color: COLORS.text.secondary, fontSize: 11, textAlign: 'center', marginHorizontal: 32 }}>
          The requested group ride session could not be located or may have been concluded.
        </Text>
        <TouchableOpacity
          style={[styles.simBtn, { paddingHorizontal: 16, paddingVertical: 10, marginTop: 16 }]}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.simBtnText}>RETURN TO SQUAD HQ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const primaryAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Cockpit Header */}
      <View style={styles.cockpitBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>

        <View style={styles.cockpitInfo}>
          <Text style={styles.cockpitTitle} numberOfLines={1}>
            {ride?.title || 'LIVE SQUAD COCKPIT'}
          </Text>
          <View style={styles.cockpitSubRow}>
            <View style={[styles.liveDot, isSimulating && { backgroundColor: '#FFB020' }]} />
            <Text style={[styles.cockpitSubText, isSimulating && { color: '#FFB020' }]}>
              {isSimulating ? `SIMULATION • ${activeRiderCount} RIDERS` : `RADAR • ${activeRiderCount} RIDERS`}
            </Text>
          </View>
        </View>

        <View style={styles.cockpitRight}>
          {/* Simulation Toggle */}
          <TouchableOpacity
            style={[styles.simBtn, isSimulating && styles.simBtnActive]}
            onPress={handleToggleSimulation}
          >
            <Text style={[styles.simBtnText, isSimulating && { color: '#080A0F' }]}>
              {isSimulating ? 'SIM ON' : 'SIMULATE'}
            </Text>
          </TouchableOpacity>

          {weather && <WeatherHUD weather={weather} alerts={weatherAlerts} compact={true} />}
        </View>
      </View>

      {/* Weather Hazard Banner */}
      <WeatherAlertBanner alerts={weatherAlerts} />

      {/* Active Emergency SOS Alert Banner */}
      {primaryAlert && (
        <TouchableOpacity
          style={styles.sosBanner}
          onPress={() => setShowEmergencyModal(true)}
        >
          <View style={styles.sosPulseIcon}>
            <AlertTriangle size={16} color="#FFFFFF" />
          </View>
          <View style={styles.sosInfo}>
            <Text style={styles.sosTitle}>
              🚨 SQUAD ALERT: {primaryAlert.riderName.toUpperCase()}
            </Text>
            <Text style={styles.sosSub} numberOfLines={1}>
              {primaryAlert.category.replace('_', ' ')} • {primaryAlert.message || 'Need assistance'}
            </Text>
          </View>
          <View style={styles.sosAction}>
            <Text style={styles.sosActionText}>VIEW</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Squad Separation Alert Banner */}
      {groupSeparation.separatedRiders.length > 0 && !primaryAlert && (
        <TouchableOpacity
          style={styles.separationBanner}
          onPress={() => {
            const firstSep = groupSeparation.separatedRiders[0];
            if (firstSep) {
              setSelectedRiderId(firstSep.userId);
              setFollowMode(false);
            }
          }}
        >
          <View style={styles.separationPulseIcon}>
            <AlertTriangle size={16} color="#FFFFFF" />
          </View>
          <View style={styles.separationInfo}>
            <Text style={styles.separationTitle}>
              ⚠️ RIDER LEFT BEHIND
            </Text>
            <Text style={styles.separationSub} numberOfLines={1}>
              {groupSeparation.message}
            </Text>
          </View>
          <View style={styles.separationAction}>
            <Text style={styles.separationActionText}>FOCUS</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Main Map Cockpit */}
      <View style={styles.mapContainer}>
        <LiveRideMap
          currentLocation={
            currentLocation
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }
              : { latitude: 18.5089, longitude: 73.7924 }
          }
          currentHeading={currentLocation?.heading ?? 45}
          startCoordinate={
            ride?.startLocation
              ? {
                  latitude: ride.startLocation.latitude,
                  longitude: ride.startLocation.longitude,
                }
              : null
          }
          endCoordinate={
            ride?.destination
              ? {
                  latitude: ride.destination.latitude,
                  longitude: ride.destination.longitude,
                }
              : null
          }
          waypoints={waypoints}
          peerRiders={riders}
          currentUserId={currentUserId}
          selectedRiderId={selectedRiderId}
          onSelectRider={handleSelectRider}
          followRider={followMode}
          onFollowModeChange={setFollowMode}
          style={styles.map}
        />

        {/* Floating Squad Intelligence HUD */}
        <View style={styles.hudOverlay} pointerEvents="box-none">
          <GroupStatusHUD
            status={proximityStatus}
            leadDistanceMeters={leadDist}
            tailDistanceMeters={tailDist}
            activeRiderCount={activeRiderCount}
          />
        </View>


        {/* Floating Cockpit Quick Action Controls */}
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Recenter / Follow Button */}
          <TouchableOpacity
            style={[styles.floatingActionBtn, followMode && styles.floatingActionBtnActive]}
            onPress={() => {
              setSelectedRiderId(null);
              setFollowMode(!followMode);
            }}
          >
            <Navigation size={20} color={followMode ? '#080A0F' : COLORS.text.primary} />
          </TouchableOpacity>

          {/* Intercom Voice Button */}
          <TouchableOpacity
            style={[styles.floatingActionBtn, styles.intercomBtn]}
            onPress={() => setShowIntercom(true)}
          >
            <Mic size={22} color="#FFFFFF" />
            <View style={styles.voicePulseDot} />
          </TouchableOpacity>

          {/* Ride Squad Chat Button */}
          <TouchableOpacity
            style={[styles.floatingActionBtn, { backgroundColor: '#111722', borderColor: '#00E5FF' }]}
            onPress={() => setShowChatModal(true)}
          >
            <MessageSquare size={20} color="#00E5FF" />
          </TouchableOpacity>

          {/* Emergency SOS Button */}
          <TouchableOpacity
            style={[styles.floatingActionBtn, styles.sosFloatingBtn]}
            onPress={() => setShowEmergencyModal(true)}
          >
            <AlertTriangle size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Floating Session Footer Actions (End My Ride / Close Event) */}
        <View style={styles.sessionFooterBar}>
          <TouchableOpacity
            style={styles.endMyRideBtn}
            onPress={handleEndMyRide}
          >
            <PowerOff size={15} color="#FF3B30" />
            <Text style={styles.endMyRideText}>END MY RIDE</Text>
          </TouchableOpacity>

          {isOrganizer && (
            <TouchableOpacity
              style={styles.closeEventBtn}
              onPress={handleCloseGroupRide}
            >
              <LogOut size={15} color="#FFB020" />
              <Text style={styles.closeEventText}>CLOSE EVENT</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom Live Squad Roster Drawer */}
      <LiveRidersDrawer
        riders={riders}
        currentUserId={currentUserId}
        onSelectRider={handleSelectRider}
        selectedRiderId={selectedRiderId}
      />

      {/* RIDEX Intercom Bottom Sheet */}
      <IntercomBottomSheet
        visible={showIntercom}
        rideId={id as string}
        rideTitle={ride?.title}
        onClose={() => setShowIntercom(false)}
      />

      {/* Ride Squad Chat Modal */}
      <RideChatModal
        visible={showChatModal}
        rideId={id as string}
        rideTitle={ride?.title}
        onClose={() => setShowChatModal(false)}
      />

      {/* 5-Category Emergency Assistance Modal */}
      <EmergencyHelpModal
        visible={showEmergencyModal}
        rideId={id as string}
        currentLatitude={currentLocation?.latitude || 18.5089}
        currentLongitude={currentLocation?.longitude || 73.7924}
        onClose={() => setShowEmergencyModal(false)}
      />

      {/* Start Ride Bike Selector Modal */}
      <StartRideModal
        visible={showStartModal}
        onClose={() => setShowStartModal(false)}
        onConfirmStart={handleConfirmStartBike}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1.2,
  },
  cockpitBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
    zIndex: 40,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cockpitInfo: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  cockpitTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text.primary,
  },
  cockpitSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  cockpitSubText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.8,
  },
  cockpitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simBtn: {
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.4)',
  },
  simBtnActive: {
    backgroundColor: '#FFB020',
    borderColor: '#FFB020',
  },
  simBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFB020',
    letterSpacing: 0.5,
  },
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginHorizontal: SPACING.md,
    marginTop: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    gap: 10,
    zIndex: 40,
  },
  sosPulseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosInfo: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sosSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FEE2E2',
    marginTop: 1,
  },
  sosAction: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  sosActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
  },
  separationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 176, 32, 0.95)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginHorizontal: SPACING.md,
    marginTop: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    gap: 10,
    zIndex: 40,
  },
  separationPulseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separationInfo: {
    flex: 1,
  },
  separationTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#080A0F',
    letterSpacing: 0.5,
  },
  separationSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#451A03',
    marginTop: 1,
  },
  separationAction: {
    backgroundColor: '#080A0F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  separationActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFB020',
  },
  mapContainer: {

    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  hudOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 30,
  },
  controlsOverlay: {
    position: 'absolute',
    right: SPACING.md,
    top: 90,
    gap: SPACING.sm,
    zIndex: 30,
    alignItems: 'center',
  },
  floatingActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.surface,
    borderWidth: 1,
    borderColor: COLORS.border.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  floatingActionBtnActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  intercomBtn: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: '#FF8A33',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  voicePulseDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  sosFloatingBtn: {
    backgroundColor: '#FF3B30',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  sessionFooterBar: {
    position: 'absolute',
    bottom: 90,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    zIndex: 25,
  },
  endMyRideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    gap: 6,
  },
  endMyRideText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B30',
    letterSpacing: 0.5,
  },
  closeEventBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.4)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    gap: 6,
  },
  closeEventText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFB020',
    letterSpacing: 0.5,
  },
});
