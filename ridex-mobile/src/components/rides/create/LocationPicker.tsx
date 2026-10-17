/**
 * RIDEX — Universal Location & Waypoint Picker Component
 * Reusable full-screen modal supporting 'start', 'destination', and 'waypoint' modes.
 * Features free OSM Nominatim search, map tap coordinate selection, reverse geocoding,
 * waypoint category & duration chips, and robust validation.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, MapPin, Locate, Search, Clock } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { RidexMap } from '../../maps/RidexMap';
import { Button } from '../../ui/Button';
import { LocationAnchor } from '../../../types/groupRide';
import { CheckpointType } from '../../../types/connectRide';
import { MapCoordinate, MapRegion } from '../../../services/maps/mapTypes';
import { useCurrentLocation } from '../../../hooks/useCurrentLocation';
import { geocodingService, GeocodedPlace } from '../../../services/maps/GeocodingService';
import { COLORS } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { SPACING } from '../../../theme/spacing';
import { RADIUS } from '../../../theme/radius';

export type LocationPickerMode = 'start' | 'destination' | 'waypoint';

export interface WaypointCategoryConfig {
  type: CheckpointType | 'LUNCH' | 'COFFEE' | 'REST' | 'CUSTOM';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  defaultDuration: number;
}

export const WAYPOINT_CATEGORIES: WaypointCategoryConfig[] = [
  { type: 'REGROUP', label: 'Regroup Point', icon: 'location', color: '#38BDF8', defaultDuration: 15 },
  { type: 'FUEL', label: 'Fuel Stop', icon: 'flash', color: '#06B6D4', defaultDuration: 15 },
  { type: 'BREAKFAST', label: 'Breakfast / Food', icon: 'cafe', color: '#F59E0B', defaultDuration: 30 },
  { type: 'LUNCH', label: 'Lunch Stop', icon: 'restaurant', color: '#FB923C', defaultDuration: 45 },
  { type: 'COFFEE', label: 'Tea / Coffee', icon: 'pint', color: '#EAB308', defaultDuration: 15 },
  { type: 'VIEWPOINT', label: 'Scenic Viewpoint', icon: 'camera', color: '#A855F7', defaultDuration: 20 },
  { type: 'REST', label: 'Rest Stop', icon: 'bed', color: '#10B981', defaultDuration: 15 },
  { type: 'CUSTOM', label: 'Custom Stop', icon: 'pin', color: '#EC4899', defaultDuration: 15 },
];

export const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60];

export interface LocationPickerResult {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'destination' | 'waypoint' | CheckpointType;
  category?: string;
  stopDuration?: number;
  estimatedStopMinutes?: number;
}

export interface LocationPickerProps {
  visible: boolean;
  mode?: LocationPickerMode;
  title?: string;
  initialLocation?: LocationAnchor | null;
  initialCategory?: string;
  initialDuration?: number;
  existingWaypoints?: any[];
  startCoordinate?: MapCoordinate | null;
  endCoordinate?: MapCoordinate | null;
  onConfirm: (location: LocationPickerResult) => void;
  onClose: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  mode = 'waypoint',
  title,
  initialLocation,
  initialCategory,
  initialDuration,
  existingWaypoints = [],
  startCoordinate = null,
  endCoordinate = null,
  onConfirm,
  onClose,
}) => {
  const { coordinate: currentGps, refreshLocation } = useCurrentLocation();

  // Selected state
  const [locationName, setLocationName] = useState('');
  const [selectedCoord, setSelectedCoord] = useState<MapCoordinate>({
    latitude: 18.5204,
    longitude: 73.8567, // Default Pune
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('BREAKFAST');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map Region
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  // Derived Title and Button Text
  const defaultTitle =
    mode === 'start'
      ? 'SELECT START RENDEZVOUS'
      : mode === 'destination'
      ? 'SELECT FINAL DESTINATION'
      : 'ADD ROUTE CHECKPOINT';

  const headerTitle = title || defaultTitle;

  const confirmButtonTitle =
    mode === 'start'
      ? 'CONFIRM START LOCATION'
      : mode === 'destination'
      ? 'CONFIRM FINAL DESTINATION'
      : 'ADD WAYPOINT STOP';

  // Synchronize state when modal becomes visible or initialLocation changes
  useEffect(() => {
    if (!visible) return;

    if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
      setSelectedCoord({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      });
      setLocationName(initialLocation.name || '');
      setMapRegion((prev) => ({
        ...prev,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      }));
    } else if (currentGps) {
      setSelectedCoord(currentGps);
      setLocationName('');
      setMapRegion((prev) => ({
        ...prev,
        latitude: currentGps.latitude,
        longitude: currentGps.longitude,
      }));
    } else {
      setSelectedCoord({ latitude: 18.5204, longitude: 73.8567 });
      setLocationName('');
    }

    if (initialCategory) {
      setSelectedCategory(initialCategory);
    } else if (mode === 'waypoint') {
      setSelectedCategory('BREAKFAST');
    }

    if (initialDuration) {
      setSelectedDuration(initialDuration);
    } else {
      const matched = WAYPOINT_CATEGORIES.find((c) => c.type === (initialCategory || 'BREAKFAST'));
      setSelectedDuration(matched ? matched.defaultDuration : 15);
    }

    setSearchQuery('');
    setSearchResults([]);
  }, [visible, initialLocation, mode, initialCategory, initialDuration, currentGps]);

  // Handle Map Region Change Complete
  const handleRegionChange = useCallback((region: MapRegion) => {
    setMapRegion(region);
  }, []);

  // Reverse geocodes given coordinate and sets name
  const triggerReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      const matchedCategory = WAYPOINT_CATEGORIES.find((c) => c.type === selectedCategory);
      const fallback =
        mode === 'start'
          ? 'Start Rendezvous'
          : mode === 'destination'
          ? 'Final Destination'
          : (matchedCategory ? matchedCategory.label : 'Waypoint Stop');

      const geocoded = await geocodingService.reverseGeocode(lat, lng, fallback);
      setIsGeocoding(false);
      setLocationName(geocoded);
    },
    [mode, selectedCategory]
  );

  // Handle Map Tap / Click
  const handleMapPress = useCallback(
    (coord: MapCoordinate) => {
      if (!coord || !coord.latitude || !coord.longitude) return;
      setSelectedCoord(coord);
      setMapRegion((prev) => ({
        ...prev,
        latitude: coord.latitude,
        longitude: coord.longitude,
      }));
      triggerReverseGeocode(coord.latitude, coord.longitude);
    },
    [triggerReverseGeocode]
  );

  // Handle "MY LOCATION" GPS button
  const handleUseCurrentLocation = async () => {
    try {
      const loc = await refreshLocation();
      if (loc && loc.latitude && loc.longitude) {
        setSelectedCoord(loc);
        setMapRegion((prev) => ({
          ...prev,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));
        triggerReverseGeocode(loc.latitude, loc.longitude);
      } else {
        Alert.alert(
          'Location Unavailable',
          'Unable to access your current GPS location. Please select a point directly on the map.'
        );
      }
    } catch {
      Alert.alert(
        'Location Unavailable',
        'Unable to access your current location. Please tap a point on the map.'
      );
    }
  };

  // Handle Place Search Query Input
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await geocodingService.searchPlaces(text);
      setSearchResults(results);
      setIsSearching(false);
    }, 450);
  };

  // Handle Search Result Selection
  const handleSelectSearchResult = (place: GeocodedPlace) => {
    const coord: MapCoordinate = {
      latitude: place.latitude,
      longitude: place.longitude,
    };
    setSelectedCoord(coord);
    setLocationName(place.name || place.displayName.split(',')[0]);
    setSearchResults([]);
    setSearchQuery('');
    setMapRegion((prev) => ({
      ...prev,
      latitude: place.latitude,
      longitude: place.longitude,
    }));
  };

  // Handle Category Change
  const handleCategorySelect = (cat: WaypointCategoryConfig) => {
    setSelectedCategory(cat.type);
    setSelectedDuration(cat.defaultDuration);
    if (!locationName || locationName.includes('Stop') || locationName.includes('Point') || locationName.includes('Rendezvous')) {
      setLocationName(`${cat.label}`);
    }
  };

  // Handle Confirmation
  const handleConfirmLocation = () => {
    if (!selectedCoord || !selectedCoord.latitude || !selectedCoord.longitude) {
      Alert.alert('Invalid Location', 'Please select a location point on the map first.');
      return;
    }

    const matchedCategory = WAYPOINT_CATEGORIES.find((c) => c.type === selectedCategory);
    const defaultFallbackName =
      mode === 'start'
        ? 'Start Rendezvous'
        : mode === 'destination'
        ? 'Final Destination'
        : (matchedCategory ? matchedCategory.label : 'Waypoint Stop');

    const finalName = locationName.trim() || defaultFallbackName;

    const result: LocationPickerResult = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: finalName,
      latitude: selectedCoord.latitude,
      longitude: selectedCoord.longitude,
      type: mode === 'start' ? 'start' : mode === 'destination' ? 'destination' : (selectedCategory as CheckpointType),
      category: selectedCategory,
      stopDuration: selectedDuration,
      estimatedStopMinutes: selectedDuration,
    };

    onConfirm(result);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close Picker">
            <X size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{headerTitle.toUpperCase()}</Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'waypoint' ? 'TAP MAP TO PIN CHECKPOINT' : 'TAP MAP TO PIN COORDINATES'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleConfirmLocation}
            style={styles.doneBtn}
            accessibilityLabel="Confirm Location"
          >
            <Check size={20} color="#FF5722" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Location Search Bar & Autocomplete */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <Search size={16} color="#06B6D4" />
            <TextInput
              placeholder="Search place (e.g. Starbucks Wakad, Lonavala)..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={handleSearchChange}
              style={styles.searchInput}
            />
            {isSearching ? <ActivityIndicator size="small" color="#06B6D4" /> : null}
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsDropdown}>
              {searchResults.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.latitude}-${item.longitude}-${idx}`}
                  style={styles.resultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <MapPin size={16} color="#06B6D4" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Location Name Custom Input */}
          <View style={styles.nameInputWrap}>
            <MapPin size={16} color="#FF5722" />
            <TextInput
              placeholder="Location name (e.g. Rendezvous Point)..."
              placeholderTextColor="#64748B"
              value={locationName}
              onChangeText={setLocationName}
              style={styles.nameInput}
            />
            {isGeocoding && <ActivityIndicator size="small" color="#FF5722" />}
          </View>
        </View>

        {/* Interactive Map View */}
        <View style={styles.mapWrapper}>
          <RidexMap
            initialRegion={mapRegion}
            currentLocation={selectedCoord}
            startCoordinate={mode !== 'start' ? startCoordinate : null}
            endCoordinate={mode !== 'destination' ? endCoordinate : null}
            waypoints={existingWaypoints}
            onRegionChangeComplete={handleRegionChange}
            onMapPress={handleMapPress}
            showsRecenterButton={false}
            followRider={false}
          />

          {/* Center Target Crosshair Pin */}
          <View style={styles.crosshairWrapper} pointerEvents="none">
            <View style={styles.crosshairPin}>
              <MapPin size={34} color="#FF5722" fill="#FF5722" />
            </View>
          </View>

          {/* Map Tap Hint */}
          <View style={styles.mapHintBadge} pointerEvents="none">
            <Text style={styles.mapHintText}>📍 Tap anywhere on map to reposition pin</Text>
          </View>

          {/* Use My GPS Location Button */}
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.8}
            accessibilityLabel="Use Current GPS Location"
          >
            <Locate size={16} color="#FFFFFF" />
            <Text style={styles.gpsButtonText}>MY LOCATION</Text>
          </TouchableOpacity>
        </View>

        {/* Waypoint Categories & Duration (Only when mode === 'waypoint') */}
        {mode === 'waypoint' && (
          <View style={styles.waypointOptionsBox}>
            <Text style={styles.sectionLabel}>STOP CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {WAYPOINT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.type;
                return (
                  <TouchableOpacity
                    key={cat.type}
                    style={[
                      styles.categoryPill,
                      isSelected && {
                        borderColor: cat.color,
                        backgroundColor: `${cat.color}20`,
                      },
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isSelected ? cat.color : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected && { color: '#F8FAFC', fontWeight: '800' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.durationRow}>
              <View style={styles.durationLabelWrap}>
                <Clock size={13} color="#94A3B8" />
                <Text style={styles.sectionLabel}>STOP DURATION</Text>
              </View>
              <View style={styles.durationChips}>
                {DURATION_OPTIONS.map((mins) => {
                  const isSelected = selectedDuration === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.durationChip, isSelected && styles.durationChipSelected]}
                      onPress={() => setSelectedDuration(mins)}
                    >
                      <Text
                        style={[
                          styles.durationChipText,
                          isSelected && styles.durationChipTextSelected,
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Bottom Confirm Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.coordPreview}>
            <Text style={styles.coordLabel}>SELECTED COORDINATES</Text>
            <Text style={styles.coordVal}>
              {selectedCoord.latitude.toFixed(5)}, {selectedCoord.longitude.toFixed(5)}
            </Text>
          </View>

          <Button
            title={confirmButtonTitle}
            onPress={handleConfirmLocation}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Check size={18} color="#090D16" />}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

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
    backgroundColor: '#0F172A',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#06B6D4',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 87, 34, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
    zIndex: 20,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  resultsDropdown: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    overflow: 'hidden',
    marginTop: 2,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  resultName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  resultAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  nameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  crosshairWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairPin: {
    marginBottom: 34,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  mapHintBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapHintText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  gpsButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)',
    gap: 6,
    zIndex: 10,
  },
  gpsButtonText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  waypointOptionsBox: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  durationLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationChips: {
    flexDirection: 'row',
    gap: 6,
  },
  durationChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  durationChipSelected: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  durationChipTextSelected: {
    color: '#06B6D4',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#090D16',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  coordPreview: {
    alignItems: 'center',
    marginBottom: 10,
  },
  coordLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 2,
  },
  coordVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#06B6D4',
    fontVariant: ['tabular-nums'],
  },
});
