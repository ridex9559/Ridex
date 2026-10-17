import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  Copy,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Radio,
  Fuel,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Bike,
  Megaphone,
  MessageSquare,
} from 'lucide-react-native';
import { useRideDetails } from '@/hooks/useRideDetails';
import { useJoinRide } from '@/hooks/useJoinRide';
import { RidexMap } from '@/components/maps/RidexMap';
import { RideParticipantList } from '@/components/rides/RideParticipantList';
import { CheckpointList } from '@/components/connectRide/CheckpointList';
import { FuelPlanningCard } from '@/components/rides/FuelPlanningCard';
import { WeatherAlertBanner } from '@/components/weather/WeatherAlertBanner';
import { WeatherHUD } from '@/components/weather/WeatherHUD';
import { JoinRequestsBottomSheet } from '@/components/rides/JoinRequestsBottomSheet';
import { RideChatModal } from '@/components/chat/RideChatModal';
import { WeatherService, WeatherCondition, WeatherAlert } from '@/services/weather/WeatherService';
import { checkpointService } from '@/services/connectRide';
import { rideService } from '@/services/rides/RideService';
import { rideRealtimeService } from '@/services/realtime/RideRealtimeService';
import { useBikeStore } from '@/store/bikeStore';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, Button, Avatar } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    ride,
    participants,
    pendingRequests,
    pendingCount,
    isOrganizer,
    isLeader,
    isApproved,
    isJoined,
    isPending,
    isFull,
    currentUserId,
    isLoading,
    refetch,
  } = useRideDetails(id || '');

  const { joinRide, leaveRide, isLoading: isJoinLoading } = useJoinRide(id || '');
  const activeBike = useBikeStore((state) => state.getActiveMotorcycle());

  // Requests Bottom Sheet State
  const [showRequestsSheet, setShowRequestsSheet] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);

  // Real-time Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    if (!ride?.scheduledAt) return;

    const targetDate = new Date(ride.scheduledAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [ride?.scheduledAt]);

  // Weather fetch
  useEffect(() => {
    if (ride?.startLocation?.latitude && ride?.startLocation?.longitude) {
      WeatherService.getWeather(ride.startLocation.latitude, ride.startLocation.longitude).then(
        (w) => {
          setWeather(w);
          setWeatherAlerts(WeatherService.evaluateAlerts(w));
        }
      );
    }
  }, [ride?.startLocation?.latitude, ride?.startLocation?.longitude]);

  // Real-time Group Ride Events (Join Requests & Organizer Approvals)
  useEffect(() => {
    if (!id) return;

    const unJoin = rideRealtimeService.onJoinRequest(id as string, (payload) => {
      refetch();
      if (isOrganizer) {
        Alert.alert(
          '🔔 New Join Request!',
          `${payload.riderName} (${payload.motorcycleName}) requested to join your squad ride.`
        );
      }
    });

    const unApproval = rideRealtimeService.onApproval(id as string, (payload) => {
      refetch();
      if (payload.userId === currentUserId) {
        if (payload.status === 'APPROVED') {
          Alert.alert('🎉 Approved!', 'You are confirmed for this squad ride! See you at meetup.');
        } else if (payload.status === 'PROMOTED_LEADER') {
          Alert.alert('⭐ Promoted to Ride Leader!', 'You now have leader broadcast & route coordination privileges.');
        }
      }
    });

    const unStatus = rideRealtimeService.onRideStatusChange(id as string, (payload) => {
      refetch();
      if (payload.status === 'LIVE') {
        Alert.alert('🟢 Squad Ride Started!', 'The organizer has initiated the live ride. Live radar is active!');
      }
    });

    return () => {
      unJoin();
      unApproval();
      unStatus();
    };
  }, [id, isOrganizer, currentUserId, refetch]);

  const checkpointsQuery = useQuery({
    queryKey: ['rides', 'checkpoints', id],
    queryFn: () => checkpointService.getCheckpoints(id as string),
    enabled: !!id,
  });
  const checkpoints = checkpointsQuery.data || [];

  // Intermediate waypoints for map markers
  const intermediateWaypoints = useMemo(() => {
    return checkpoints.filter((cp) => cp.type !== 'START' && cp.type !== 'DESTINATION');
  }, [checkpoints]);

  // Combined full route checkpoints timeline for list
  const fullTimelineCheckpoints = useMemo(() => {
    if (
      checkpoints.length > 0 &&
      checkpoints.some((c) => c.type === 'START') &&
      checkpoints.some((c) => c.type === 'DESTINATION')
    ) {
      return checkpoints;
    }
    const list: any[] = [];
    if (ride?.startLocation) {
      list.push({
        id: 'cp-start-view',
        name: ride.startLocation.name || 'Start Rendezvous Point',
        type: 'START',
        latitude: ride.startLocation.latitude,
        longitude: ride.startLocation.longitude,
        orderIndex: 0,
        sequence: 0,
        estimatedStopMinutes: 15,
      });
    }
    intermediateWaypoints.forEach((wp: any, idx: number) => {
      list.push({
        ...wp,
        orderIndex: idx + 1,
        sequence: idx + 1,
      });
    });
    if (ride?.destination) {
      list.push({
        id: 'cp-dest-view',
        name: ride.destination.name || 'Final Destination',
        type: 'DESTINATION',
        latitude: ride.destination.latitude,
        longitude: ride.destination.longitude,
        orderIndex: list.length,
        sequence: list.length,
        estimatedStopMinutes: 0,
      });
    }
    return list;
  }, [checkpoints, intermediateWaypoints, ride?.startLocation, ride?.destination]);

  const handleCopyCode = () => {
    const code = ride?.rideCode || ride?.joinCode || 'RIDEX-7X92K';
    Alert.alert('Ride ID Copied! 📋', `Share Ride ID "${code}" with riders.`);
  };

  const handleShare = async () => {
    if (!ride) return;
    const code = ride.rideCode || ride.joinCode || 'RIDEX-7X92K';
    try {
      await Share.share({
        title: ride.title,
        message: `🏍️ Join our motorcycle squad ride "${ride.title}" on RIDEX!\n\n🔑 Use Ride ID: ${code}\n📍 Meetup: ${ride.startLocation?.name}\n⏰ Time: ${ride.meetingTime || '06:00 AM'}`,
      });
    } catch {}
  };

  const handleJoin = async () => {
    try {
      await joinRide();
      Alert.alert(
        'Request Sent! 🏍️',
        ride?.approvalRequired
          ? 'Your join request was sent to the organizer. You will be notified once approved!'
          : 'You are now confirmed for this squad ride!'
      );
      refetch();
    } catch (err: any) {
      Alert.alert('Unable to Join', err.message || 'Could not join ride at this time.');
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Group Ride?',
      'Are you sure you want to leave this squad roster?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Squad',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveRide();
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not leave ride.');
            }
          },
        },
      ]
    );
  };

  const handleStartMyRide = async () => {
    if (isOrganizer && !isLive) {
      try {
        await rideService.startRide(id as string, currentUserId || '');
      } catch {}
    }
    // Navigate to Live Squad Cockpit
    router.push(`/rides/live/${id}` as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text style={styles.loadingText}>LOADING SQUAD LOBBY...</Text>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <AlertCircle size={48} color={COLORS.danger} />
        <Text style={styles.errorTitle}>RIDE NOT FOUND</Text>
        <Text style={styles.errorSubtitle}>
          This ride may have been cancelled or the link is invalid.
        </Text>
        <Button
          title="BACK TO EXPLORE"
          onPress={() => router.back()}
          variant="primary"
          style={{ marginTop: SPACING.md }}
        />
      </SafeAreaView>
    );
  }

  const rideCode = ride.rideCode || ride.joinCode || 'RIDEX-7X92K';
  const isLive = ride.status === 'LIVE' || ride.status === 'STARTING';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerCategory}>{ride.category || 'GROUP RIDE'}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ride.title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setShowChatModal(true)} style={styles.iconBtn}>
            <MessageSquare size={18} color="#00E5FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Share2 size={18} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Banner if ride in progress */}
        {isLive && (
          <TouchableOpacity
            style={styles.liveBanner}
            onPress={() => router.push(`/rides/live/${id}` as any)}
          >
            <View style={styles.livePulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.liveBannerTitle}>🟢 LIVE SQUAD RADAR ACTIVE</Text>
              <Text style={styles.liveBannerSub}>Riders are currently on the road. Tap to enter map.</Text>
            </View>
            <ChevronRight size={18} color="#00E676" />
          </TouchableOpacity>
        )}

        {/* Pre-Ride Countdown Ticker Card */}
        <Card variant="glass" style={styles.countdownCard}>
          <View style={styles.countdownHeader}>
            <View style={styles.countdownHeaderLeft}>
              <Clock size={16} color={COLORS.primary.DEFAULT} />
              <Text style={styles.countdownLabel}>
                {timeLeft.isPast ? 'RIDE DAY IS HERE' : 'COUNTDOWN TO KICKSTANDS UP'}
              </Text>
            </View>
            <Badge
              label={ride.difficulty || 'INTERMEDIATE'}
              variant="primary"
              size="sm"
            />
          </View>

          {timeLeft.isPast ? (
            <View style={styles.rideDayBox}>
              <Sparkles size={20} color="#00E676" />
              <Text style={styles.rideDayText}>RIDE IN SESSION — READY TO ROLL</Text>
            </View>
          ) : (
            <View style={styles.timerRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{String(timeLeft.days).padStart(2, '0')}</Text>
                <Text style={styles.timeUnit}>DAYS</Text>
              </View>
              <Text style={styles.timeColon}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                <Text style={styles.timeUnit}>HRS</Text>
              </View>
              <Text style={styles.timeColon}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeValue}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
                <Text style={styles.timeUnit}>MINS</Text>
              </View>
              <Text style={styles.timeColon}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={[styles.timeValue, { color: COLORS.primary.DEFAULT }]}>
                  {String(timeLeft.seconds).padStart(2, '0')}
                </Text>
                <Text style={styles.timeUnit}>SECS</Text>
              </View>
            </View>
          )}

          {/* Departure Timings */}
          <View style={styles.timingsRow}>
            <View style={styles.timingItem}>
              <Text style={styles.timingLabel}>MEETUP TIME</Text>
              <Text style={styles.timingVal}>{ride.meetingTime || '05:30 AM'}</Text>
            </View>
            <View style={styles.timingDivider} />
            <View style={styles.timingItem}>
              <Text style={styles.timingLabel}>DEPARTURE TIME</Text>
              <Text style={styles.timingVal}>{ride.rideStartTime || '06:00 AM'}</Text>
            </View>
          </View>
        </Card>

        {/* Unique Ride ID Share Bar */}
        <Card variant="glass" style={styles.codeBar}>
          <View style={styles.codeLeft}>
            <Text style={styles.codeLabel}>RIDE ID</Text>
            <Text style={styles.codeVal}>{rideCode}</Text>
          </View>
          <View style={styles.codeActions}>
            <TouchableOpacity onPress={handleCopyCode} style={styles.codeBtn}>
              <Copy size={15} color={COLORS.primary.DEFAULT} />
              <Text style={styles.codeBtnText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.codeBtn}>
              <Share2 size={15} color="#00E5FF" />
              <Text style={[styles.codeBtnText, { color: '#00E5FF' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Organizer / Leader Pending Requests Pill */}
        {isLeader && (
          <TouchableOpacity
            style={styles.pendingBar}
            onPress={() => setShowRequestsSheet(true)}
          >
            <View style={styles.pendingLeft}>
              <ShieldCheck size={18} color="#FFB020" />
              <Text style={styles.pendingTitle}>
                {pendingCount > 0
                  ? `${pendingCount} Rider Join Request${pendingCount > 1 ? 's' : ''}`
                  : 'Join Requests (0 Pending)'}
              </Text>
            </View>
            <View style={styles.pendingRight}>
              <Text style={styles.reviewText}>Review</Text>
              <ChevronRight size={16} color="#FFB020" />
            </View>
          </TouchableOpacity>
        )}

        {/* Weather Alerts Banner */}
        <WeatherAlertBanner alerts={weatherAlerts} />

        {/* Organizer Announcement / Briefing Card */}
        <Card variant="glass" style={styles.briefingCard}>
          <View style={styles.briefingHeader}>
            <Megaphone size={16} color={COLORS.primary.DEFAULT} />
            <Text style={styles.briefingTitle}>ORGANIZER BRIEFING & NOTES</Text>
          </View>
          <Text style={styles.briefingText}>
            {ride.description ||
              'Standard squad riding formation in staggered 2-by-2. Full riding gear mandatory (helmet, jacket, gloves, boots). Tank up before meetup.'}
          </Text>
        </Card>

        {/* Route Map Preview */}
        {ride.startLocation && ride.destination && (
          <Card variant="glass" style={styles.mapCard}>
            <RidexMap
              startCoordinate={{
                latitude: ride.startLocation.latitude,
                longitude: ride.startLocation.longitude,
              }}
              endCoordinate={{
                latitude: ride.destination.latitude,
                longitude: ride.destination.longitude,
              }}
              waypoints={intermediateWaypoints}
              showsRecenterButton={false}
              followRider={false}
              style={styles.map}
            />
          </Card>
        )}

        {/* Telemetry Metrics Grid */}
        <View style={styles.metricsGrid}>
          <Card variant="glass" style={styles.metricBox}>
            <Text style={styles.metricLabel}>DISTANCE</Text>
            <Text style={styles.metricValue}>
              {ride.estimatedDistanceKm ? `${ride.estimatedDistanceKm} KM` : '64 KM'}
            </Text>
          </Card>

          <Card variant="glass" style={styles.metricBox}>
            <Text style={styles.metricLabel}>EST. RIDE TIME</Text>
            <Text style={styles.metricValue}>
              {ride.estimatedDurationMinutes ? `${ride.estimatedDurationMinutes} MIN` : '90 MIN'}
            </Text>
          </Card>

          <Card variant="glass" style={styles.metricBox}>
            <Text style={styles.metricLabel}>STOPS</Text>
            <Text style={styles.metricValue}>{intermediateWaypoints.length}</Text>
          </Card>

          <Card variant="glass" style={styles.metricBox}>
            <Text style={styles.metricLabel}>SQUAD SIZE</Text>
            <Text style={styles.metricValue}>
              {ride.currentParticipantCount ?? participants.length}
              {ride.maxParticipants ? ` / ${ride.maxParticipants}` : ''}
            </Text>
          </Card>
        </View>

        {/* Fuel Range Planning */}
        <FuelPlanningCard
          tripDistanceKm={ride.estimatedDistanceKm || 64}
          bikeTankCapacityL={activeBike?.fuelTankCapacityLiters || 15}
          bikeAvgMileageKmpl={activeBike?.averageMileageKmpl || 28}
        />

        {/* Route Checkpoints & Stops */}
        <CheckpointList checkpoints={fullTimelineCheckpoints} />

        {/* Approved Rider Squad Roster */}
        <RideParticipantList
          participants={participants}
          maxParticipants={ride.maxParticipants}
          currentUserId={currentUserId}
        />
      </ScrollView>

      {/* Floating Action Footer */}
      <View style={styles.footer}>
        {isApproved ? (
          <View style={styles.approvedActionRow}>
            <Button
              title={
                isLive
                  ? 'JOIN LIVE SQUAD RADAR 🟢'
                  : isOrganizer
                  ? 'START SQUAD RIDE 🏍️'
                  : 'ENTER SQUAD COCKPIT 🏍️'
              }
              onPress={handleStartMyRide}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<Radio size={20} color="#FFFFFF" />}
            />
          </View>
        ) : isPending ? (
          <View style={styles.pendingFooterBox}>
            <View style={styles.pendingStatusIndicator}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingFooterText}>
                REQUEST PENDING ORGANIZER APPROVAL
              </Text>
            </View>
            <TouchableOpacity onPress={handleLeave} style={styles.cancelRequestBtn}>
              <Text style={styles.cancelRequestText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            title={isFull ? 'SQUAD AT FULL CAPACITY' : 'REQUEST TO JOIN SQUAD'}
            onPress={handleJoin}
            variant="primary"
            size="lg"
            fullWidth
            disabled={isJoinLoading || isFull}
            loading={isJoinLoading}
            rightIcon={<Users size={18} color="#FFFFFF" />}
          />
        )}
      </View>

      {/* Organizer / Leader Requests Modal */}
      <JoinRequestsBottomSheet
        visible={showRequestsSheet}
        rideId={id as string}
        rideTitle={ride.title}
        onClose={() => setShowRequestsSheet(false)}
        onRequestHandled={() => refetch()}
      />

      {/* Ride Squad Chat Modal */}
      <RideChatModal
        visible={showChatModal}
        rideId={id as string}
        rideTitle={ride.title}
        onClose={() => setShowChatModal(false)}
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
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1.5,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
  },
  errorSubtitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  headerCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
    gap: SPACING.md,
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#00E676',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E676',
  },
  liveBannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00E676',
    letterSpacing: 0.5,
  },
  liveBannerSub: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  countdownCard: {
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.35)',
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  countdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  timeBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 54,
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  timeUnit: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.text.muted,
    marginTop: 2,
  },
  timeColon: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text.muted,
    marginBottom: 10,
  },
  rideDayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
  },
  rideDayText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#00E676',
    letterSpacing: 1,
  },
  timingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  timingItem: {
    alignItems: 'center',
  },
  timingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 0.8,
  },
  timingVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 2,
  },
  timingDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border.subtle,
  },
  codeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  codeLeft: {
    gap: 2,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1,
  },
  codeVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surface,
    borderWidth: 1,
    borderColor: COLORS.border.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  codeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
  },
  pendingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    borderWidth: 1,
    borderColor: '#FFB020',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFB020',
  },
  pendingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFB020',
  },
  briefingCard: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  briefingTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1,
  },
  briefingText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  mapCard: {
    height: 180,
    overflow: 'hidden',
    padding: 0,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  waypointsCard: {
    padding: SPACING.md,
    gap: 12,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waypointDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waypointInfo: {
    flex: 1,
  },
  waypointLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 0.8,
  },
  waypointName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 1,
  },
  waypointLine: {
    height: 1,
    backgroundColor: COLORS.border.subtle,
    marginLeft: 34,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metricBox: {
    flex: 1,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(8, 10, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.md,
  },
  approvedActionRow: {
    width: '100%',
  },
  pendingFooterBox: {
    backgroundColor: COLORS.background.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.card,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    gap: 6,
  },
  pendingStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB020',
  },
  pendingFooterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFB020',
  },
  cancelRequestBtn: {
    paddingVertical: 2,
  },
  cancelRequestText: {
    fontSize: 11,
    color: COLORS.text.muted,
    textDecorationLine: 'underline',
  },
});
