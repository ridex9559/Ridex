import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateRide } from '../../src/hooks/useCreateRide';
import { LocationPicker, LocationPickerResult, LocationPickerMode } from '../../src/components/rides/create/LocationPicker';
import { CheckpointList } from '../../src/components/connectRide/CheckpointList';
import { RidexMap } from '../../src/components/maps/RidexMap';
import { RideCategory, RideDifficulty, LocationAnchor } from '../../src/types/groupRide';
import { RouteOptionsSelector, RoutePreferences } from '../../src/components/rides/RouteOptionsSelector';
import { FuelPlanningCard } from '../../src/components/rides/FuelPlanningCard';
import { useBikeStore } from '../../src/store/bikeStore';

const CATEGORIES: { label: string; value: RideCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Touring', value: 'TOURING', icon: 'map' },
  { label: 'Adventure', value: 'ADVENTURE', icon: 'trail-sign' },
  { label: 'Pass', value: 'MOUNTAIN_PASS', icon: 'flash' },
  { label: 'Highway', value: 'HIGHWAY', icon: 'compass' },
  { label: 'Weekend', value: 'WEEKEND', icon: 'bicycle' },
  { label: 'Track', value: 'TRACK', icon: 'flag' },
  { label: 'Off-Road', value: 'OFF_ROAD', icon: 'fitness' },
  { label: 'Casual', value: 'CASUAL', icon: 'people' },
];

const DIFFICULTIES: { label: string; value: RideDifficulty; color: string }[] = [
  { label: 'Beginner (Cruising)', value: 'BEGINNER', color: '#10B981' },
  { label: 'Intermediate (Paced)', value: 'INTERMEDIATE', color: '#38BDF8' },
  { label: 'Advanced (Twisties)', value: 'ADVANCED', color: '#F59E0B' },
  { label: 'Expert (Demanding)', value: 'EXPERT', color: '#EF4444' },
];

const CAPACITIES = [
  { label: 'Squad (5)', value: 5 },
  { label: 'Group (10)', value: 10 },
  { label: 'Pack (15)', value: 15 },
  { label: 'Convoy (25)', value: 25 },
  { label: 'Unlimited', value: null },
];

export default function CreateRideScreen() {
  const router = useRouter();
  const totalSteps = 5;
  const activeBike = useBikeStore((state) => state.getActiveMotorcycle());

  const {
    draft,
    waypoints,
    totalDistanceKm,
    totalDurationMinutes,
    routeCoordinates,
    fuelPlan,
    errors,
    step,
    isPublishing,
    updateDraft,
    updateStartLocation,
    updateDestination,
    addWaypoint,
    removeWaypoint,
    getAllCheckpoints,
    nextStep,
    prevStep,
    publishRide,
  } = useCreateRide();

  // Unified Location Picker Modal State
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    mode: LocationPickerMode;
    initialLocation?: LocationAnchor | null;
    initialCategory?: string;
    initialDuration?: number;
  }>({
    visible: false,
    mode: 'start',
    initialLocation: null,
  });

  // Route preferences state
  const [routePrefs, setRoutePrefs] = useState<RoutePreferences>({
    profile: 'SCENIC',
    avoidTolls: false,
    avoidHighways: false,
    motorcycleFriendly: true,
  });

  const handleLocationPicked = (result: LocationPickerResult) => {
    const isStart = pickerModal.mode === 'start' || result.type === 'start';
    const isDest = pickerModal.mode === 'destination' || result.type === 'destination';

    if (isStart) {
      updateStartLocation({
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    } else if (isDest) {
      updateDestination({
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    } else {
      addWaypoint({
        id: result.id,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        type: result.type,
        category: result.category,
        stopDuration: result.stopDuration,
      });
    }
    setPickerModal((prev) => ({ ...prev, visible: false }));
  };

  const handleAddStop = () => {
    setPickerModal({
      visible: true,
      mode: 'waypoint',
      initialLocation: null,
      initialCategory: 'BREAKFAST',
      initialDuration: 30,
    });
  };

  const handleRemoveStop = (index: number) => {
    // Note: allCheckpoints contains [Start (if set), ...waypoints, Destination (if set)]
    const hasStart = !!(draft.startLocation && typeof draft.startLocation.latitude === 'number');
    const waypointIndex = hasStart ? index - 1 : index;
    if (waypointIndex >= 0 && waypointIndex < waypoints.length) {
      removeWaypoint(waypointIndex);
    }
  };

  const handlePublish = async () => {
    try {
      const result = await publishRide();
      if (result) {
        router.replace({
          pathname: '/rides/created-success',
          params: {
            rideId: result.id,
            rideCode: result.rideCode,
            title: draft.title,
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Publish Failed', err.message || 'Could not publish ride. Please check required fields.');
    }
  };

  const allCheckpoints = getAllCheckpoints();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? prevStep() : router.back())}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>CREATE GROUP RIDE</Text>
          <Text style={styles.headerSubtitle}>
            STEP {step} OF {totalSteps}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>RIDE DETAILS</Text>
            <Text style={styles.stepDescription}>
              Give your squad ride a compelling title and briefing description.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RIDE TITLE *</Text>
              <TextInput
                style={[styles.input, errors.title ? styles.inputError : null]}
                placeholder="e.g. Sunday Morning Lavasa Explorer"
                placeholderTextColor="#475569"
                value={draft.title}
                onChangeText={(val) => updateDraft({ title: val })}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>BRIEFING & NOTES</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share meetup details, riding gear requirements, pace, and route highlights..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={4}
                value={draft.description}
                onChangeText={(val) => updateDraft({ description: val })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RIDE CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = draft.category === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.catCard, isSelected && styles.catCardSelected]}
                      onPress={() => updateDraft({ category: cat.value })}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={20}
                        color={isSelected ? '#06B6D4' : '#64748B'}
                      />
                      <Text style={[styles.catLabel, isSelected && styles.catLabelSelected]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Locations & Route Preferences */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>START & DESTINATION</Text>
            <Text style={styles.stepDescription}>
              Pin the rendezvous coordinates on the live satellite map.
            </Text>

            {/* Start Location Card */}
            <TouchableOpacity
              style={[styles.locationBox, errors.startLocation ? styles.inputError : null]}
              onPress={() =>
                setPickerModal({
                  visible: true,
                  mode: 'start',
                  initialLocation: draft.startLocation,
                })
              }
            >
              <View style={[styles.locationIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="flag" size={18} color="#10B981" />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationTypeLabel}>START / RENDEZVOUS</Text>
                <Text style={styles.locationName} numberOfLines={1}>
                  {draft.startLocation?.name || 'Tap to select start point on map'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
            {errors.startLocation ? (
              <Text style={styles.errorText}>{errors.startLocation}</Text>
            ) : null}

            {/* Destination Location Card */}
            <TouchableOpacity
              style={[styles.locationBox, errors.destination ? styles.inputError : null]}
              onPress={() =>
                setPickerModal({
                  visible: true,
                  mode: 'destination',
                  initialLocation: draft.destination,
                })
              }
            >
              <View style={[styles.locationIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="location" size={18} color="#EF4444" />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationTypeLabel}>FINAL DESTINATION</Text>
                <Text style={styles.locationName} numberOfLines={1}>
                  {draft.destination?.name || 'Tap to select destination point on map'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
            {errors.destination ? (
              <Text style={styles.errorText}>{errors.destination}</Text>
            ) : null}

            {/* Route Preferences Selector */}
            <RouteOptionsSelector
              preferences={routePrefs}
              onChange={setRoutePrefs}
            />
          </View>
        )}

        {/* STEP 3: Route Checkpoints & Fuel Planning (⭐) */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>ROUTE CHECKPOINTS & FUEL PLAN</Text>
            <Text style={styles.stepDescription}>
              Add fuel stations, breakfast spots, and verify fuel range comparison.
            </Text>

            {/* Fuel Consumption & Range Planning Card */}
            <FuelPlanningCard
              plan={fuelPlan}
              tripDistanceKm={totalDistanceKm}
              bikeTankCapacityL={activeBike?.fuelTankCapacityLiters || 15}
              bikeAvgMileageKmpl={activeBike?.averageMileageKmpl || 28}
            />

            <CheckpointList
              checkpoints={allCheckpoints}
              editable={true}
              onAddStop={handleAddStop}
              onRemoveStop={handleRemoveStop}
            />
          </View>
        )}

        {/* STEP 4: Schedule, Limits & Privacy */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>SCHEDULE & SQUAD LIMITS</Text>
            <Text style={styles.stepDescription}>
              Configure start time, squad capacity, pace, and visibility.
            </Text>

            {/* Time Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>START TIME (HH:MM) *</Text>
              <TextInput
                style={[styles.input, errors.scheduledTime ? styles.inputError : null]}
                placeholder="06:00"
                placeholderTextColor="#475569"
                value={draft.scheduledTime}
                onChangeText={(val) => updateDraft({ scheduledTime: val })}
              />
            </View>

            {/* Difficulty Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>RIDE DIFFICULTY</Text>
              <View style={styles.diffGrid}>
                {DIFFICULTIES.map((diff) => {
                  const isSelected = draft.difficulty === diff.value;
                  return (
                    <TouchableOpacity
                      key={diff.value}
                      style={[
                        styles.diffCard,
                        isSelected && { borderColor: diff.color, backgroundColor: 'rgba(15, 23, 42, 0.9)' },
                      ]}
                      onPress={() => updateDraft({ difficulty: diff.value })}
                    >
                      <View style={[styles.diffDot, { backgroundColor: diff.color }]} />
                      <Text style={[styles.diffLabel, isSelected && { color: diff.color, fontWeight: '800' }]}>
                        {diff.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Max Participants */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MAX SQUAD CAPACITY</Text>
              <View style={styles.capacityRow}>
                {CAPACITIES.map((cap) => {
                  const isSelected = draft.maxParticipants === cap.value;
                  return (
                    <TouchableOpacity
                      key={cap.label}
                      style={[styles.capPill, isSelected && styles.capPillSelected]}
                      onPress={() => updateDraft({ maxParticipants: cap.value })}
                    >
                      <Text style={[styles.capText, isSelected && styles.capTextSelected]}>
                        {cap.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Privacy Switch */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>VISIBILITY</Text>
              <View style={styles.visibilityRow}>
                <TouchableOpacity
                  style={[
                    styles.visBtn,
                    draft.visibility === 'PUBLIC' && styles.visBtnSelected,
                  ]}
                  onPress={() => updateDraft({ visibility: 'PUBLIC' })}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={draft.visibility === 'PUBLIC' ? '#06B6D4' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.visText,
                      draft.visibility === 'PUBLIC' && styles.visTextSelected,
                    ]}
                  >
                    PUBLIC RADAR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.visBtn,
                    draft.visibility === 'PRIVATE' && styles.visBtnSelected,
                  ]}
                  onPress={() => updateDraft({ visibility: 'PRIVATE' })}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={draft.visibility === 'PRIVATE' ? '#06B6D4' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.visText,
                      draft.visibility === 'PRIVATE' && styles.visTextSelected,
                    ]}
                  >
                    PRIVATE SQUAD
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* STEP 5: Review & Publish */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>REVIEW & PUBLISH</Text>
            <Text style={styles.stepDescription}>
              Verify the squad journey before broadcasting to the RideX live radar.
            </Text>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{draft.title}</Text>
              <Text style={styles.summaryDesc} numberOfLines={2}>
                {draft.description || 'No briefing notes provided.'}
              </Text>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Ionicons name="flag" size={16} color="#10B981" />
                <Text style={styles.summaryVal}>Start: {draft.startLocation?.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <Text style={styles.summaryVal}>Dest: {draft.destination?.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="time" size={16} color="#38BDF8" />
                <Text style={styles.summaryVal}>
                  Date: {draft.scheduledDate.toLocaleDateString()} at {draft.scheduledTime}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="git-branch" size={16} color="#06B6D4" />
                <Text style={styles.summaryVal}>
                  Route: {routePrefs.profile} {routePrefs.motorcycleFriendly ? '• Moto-Friendly' : ''}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="speedometer" size={16} color="#10B981" />
                <Text style={styles.summaryVal}>
                  Distance: {totalDistanceKm} KM • Est. Time: {totalDurationMinutes} MIN
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="shield" size={16} color="#F59E0B" />
                <Text style={styles.summaryVal}>
                  {waypoints.length} Route Stop{waypoints.length === 1 ? '' : 's'} • Limit: {draft.maxParticipants || 'Unlimited'} Riders
                </Text>
              </View>
            </View>

            {/* Checkpoints Preview */}
            <CheckpointList checkpoints={allCheckpoints} editable={false} />

            {/* Route Map Preview */}
            {draft.startLocation && draft.destination && (
              <View style={styles.mapPreviewBox}>
                <RidexMap
                  startCoordinate={{
                    latitude: draft.startLocation.latitude,
                    longitude: draft.startLocation.longitude,
                  }}
                  endCoordinate={{
                    latitude: draft.destination.latitude,
                    longitude: draft.destination.longitude,
                  }}
                  waypoints={waypoints}
                  routeCoordinates={routeCoordinates}
                  showsRecenterButton={false}
                  followRider={false}
                  style={styles.mapPreview}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={prevStep}
            disabled={isPublishing}
          >
            <Text style={styles.secondaryBtnText}>BACK</Text>
          </TouchableOpacity>
        ) : null}

        {step < totalSteps ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
            <Text style={styles.primaryBtnText}>NEXT STEP</Text>
            <Ionicons name="arrow-forward" size={18} color="#090D16" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.publishBtn]}
            onPress={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <ActivityIndicator color="#090D16" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#090D16" />
                <Text style={styles.primaryBtnText}>PUBLISH GROUP RIDE</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Reusable Location & Waypoint Picker Modal */}
      <LocationPicker
        visible={pickerModal.visible}
        mode={pickerModal.mode}
        initialLocation={pickerModal.initialLocation}
        initialCategory={pickerModal.initialCategory}
        initialDuration={pickerModal.initialDuration}
        existingWaypoints={waypoints}
        startCoordinate={
          draft.startLocation
            ? { latitude: draft.startLocation.latitude, longitude: draft.startLocation.longitude }
            : null
        }
        endCoordinate={
          draft.destination
            ? { latitude: draft.destination.latitude, longitude: draft.destination.longitude }
            : null
        }
        onConfirm={handleLocationPicked}
        onClose={() => setPickerModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 6,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06B6D4',
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#1E293B',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#06B6D4',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 16,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  stepDescription: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: -8,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '23%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  catCardSelected: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  catLabelSelected: {
    color: '#F8FAFC',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  diffGrid: {
    gap: 8,
  },
  diffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  diffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  diffLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  capacityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  capPillSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  capText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  capTextSelected: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  visBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  visBtnSelected: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  visText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  visTextSelected: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  summaryDesc: {
    fontSize: 13,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryVal: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  mapPreviewBox: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 8,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#090D16',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  publishBtn: {
    backgroundColor: '#10B981',
  },
  primaryBtnText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
