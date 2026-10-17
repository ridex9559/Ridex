import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRideDiscovery } from '../../src/hooks/useRideDiscovery';
import { RideCard } from '../../src/components/rides/RideCard';
import { RideCategory } from '../../src/types/groupRide';
import { MOCK_ROUTES } from '../../src/data/routes';
import { Route } from '../../src/types/route';
import { formatDistance, formatDuration } from '../../src/utils/formatters';

const GROUP_CATEGORIES: { label: string; value: RideCategory | 'ALL' }[] = [
  { label: 'ALL SQUADS', value: 'ALL' },
  { label: 'TOURING', value: 'TOURING' },
  { label: 'ADVENTURE', value: 'ADVENTURE' },
  { label: 'PASS', value: 'MOUNTAIN_PASS' },
  { label: 'HIGHWAY', value: 'HIGHWAY' },
  { label: 'WEEKEND', value: 'WEEKEND' },
  { label: 'TRACK', value: 'TRACK' },
  { label: 'OFF-ROAD', value: 'OFF_ROAD' },
  { label: 'CASUAL', value: 'CASUAL' },
];

const TWISTIE_CATEGORIES = [
  { label: 'ALL ROUTES', value: 'ALL' },
  { label: 'TWISTIES', value: 'TWISTIES' },
  { label: 'MOUNTAIN PASS', value: 'MOUNTAIN_PASS' },
  { label: 'COASTAL', value: 'COASTAL' },
  { label: 'OFF-ROAD', value: 'OFF_ROAD' },
  { label: 'TRACK', value: 'TRACK' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'GROUP_RIDES' | 'TWISTIES'>('GROUP_RIDES');

  // Step 8: Group Ride Discovery Hook
  const {
    rides: groupRides,
    isLoading: isLoadingGroupRides,
    filters,
    setSearchQuery,
    setCategory,
    refetch: refetchGroupRides,
  } = useRideDiscovery();

  // Twisties Route State
  const [twistieSearch, setTwistieSearch] = useState('');
  const [selectedTwistieCategory, setSelectedTwistieCategory] = useState('ALL');
  const [downloadedRoutes, setDownloadedRoutes] = useState<Record<string, boolean>>({});

  const filteredTwisties = MOCK_ROUTES.filter((route: Route) => {
    const matchesCategory =
      selectedTwistieCategory === 'ALL' || route.category === selectedTwistieCategory;
    const matchesSearch =
      route.title.toLowerCase().includes(twistieSearch.toLowerCase()) ||
      route.startLocationName.toLowerCase().includes(twistieSearch.toLowerCase()) ||
      route.endLocationName.toLowerCase().includes(twistieSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (routeId: string) => {
    setDownloadedRoutes((prev) => ({ ...prev, [routeId]: !prev[routeId] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Segmented Dual Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'GROUP_RIDES' && styles.tabButtonActive]}
          onPress={() => setActiveTab('GROUP_RIDES')}
        >
          <Ionicons
            name="people"
            size={16}
            color={activeTab === 'GROUP_RIDES' ? '#06B6D4' : '#64748B'}
          />
          <Text
            style={[styles.tabText, activeTab === 'GROUP_RIDES' && styles.tabTextActive]}
          >
            COMMUNITY SQUADS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'TWISTIES' && styles.tabButtonActive]}
          onPress={() => setActiveTab('TWISTIES')}
        >
          <Ionicons
            name="trail-sign"
            size={16}
            color={activeTab === 'TWISTIES' ? '#06B6D4' : '#64748B'}
          />
          <Text
            style={[styles.tabText, activeTab === 'TWISTIES' && styles.tabTextActive]}
          >
            SCENIC TWISTIES
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: GROUP RIDES FEED */}
      {activeTab === 'GROUP_RIDES' && (
        <View style={styles.feedContainer}>
          {/* Search & Filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                placeholder="Search squad rides, rendezvous points, cities..."
                placeholderTextColor="#64748B"
                value={filters.searchQuery || ''}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {filters.searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {GROUP_CATEGORIES.map((cat) => {
                const isSelected =
                  cat.value === 'ALL'
                    ? filters.category === 'ALL' || !filters.category
                    : filters.category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Group Rides List */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingGroupRides}
                onRefresh={refetchGroupRides}
                tintColor="#06B6D4"
              />
            }
          >
            <View style={styles.headerInfoRow}>
              <Text style={styles.resultCount}>
                {groupRides.length} SQUAD RIDES SCHEDULED
              </Text>
              <TouchableOpacity
                style={styles.hostBtnSmall}
                onPress={() => router.push('/rides/create')}
              >
                <Ionicons name="add" size={14} color="#06B6D4" />
                <Text style={styles.hostBtnSmallText}>HOST A RIDE</Text>
              </TouchableOpacity>
            </View>

            {isLoadingGroupRides && groupRides.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#06B6D4" />
                <Text style={styles.loadingText}>SCANNING SQUAD RADAR...</Text>
              </View>
            ) : groupRides.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bicycle-outline" size={48} color="#334155" />
                <Text style={styles.emptyTitle}>NO SQUAD RIDES FOUND</Text>
                <Text style={styles.emptyDesc}>
                  Be the first road captain to host a group ride in this area.
                </Text>
                <TouchableOpacity
                  style={styles.createFirstBtn}
                  onPress={() => router.push('/rides/create')}
                >
                  <Ionicons name="add-circle" size={18} color="#090D16" />
                  <Text style={styles.createFirstBtnText}>CREATE GROUP RIDE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groupRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onPress={() => router.push(`/rides/${ride.id}`)}
                />
              ))
            )}
          </ScrollView>

          {/* Floating Action Button for Create Ride */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fab}
            onPress={() => router.push('/rides/create')}
          >
            <Ionicons name="add" size={26} color="#090D16" />
            <Text style={styles.fabText}>HOST RIDE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TAB 2: SCENIC TWISTIES PASSES */}
      {activeTab === 'TWISTIES' && (
        <View style={styles.feedContainer}>
          {/* Header & Search */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                placeholder="Search mountain passes, hairpins, towns..."
                placeholderTextColor="#64748B"
                value={twistieSearch}
                onChangeText={setTwistieSearch}
                style={styles.searchInput}
              />
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {TWISTIE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setSelectedTwistieCategory(cat.value)}
                  style={[
                    styles.filterChip,
                    selectedTwistieCategory === cat.value && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedTwistieCategory === cat.value && styles.filterChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Route Cards Feed */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.resultCount}>
              FOUND {filteredTwisties.length} CURATED MOTORCYCLE PASSES
            </Text>

            {filteredTwisties.map((route: Route) => {
              const isDownloaded = downloadedRoutes[route.id];
              return (
                <View key={route.id} style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <View>
                      <Text style={styles.routeCategory}>{route.category}</Text>
                      <Text style={styles.routeTitle}>{route.title}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDownload(route.id)}
                      style={[
                        styles.downloadBtn,
                        isDownloaded && styles.downloadBtnActive,
                      ]}
                    >
                      <Ionicons
                        name={isDownloaded ? 'checkmark-circle' : 'cloud-download-outline'}
                        size={16}
                        color={isDownloaded ? '#10B981' : '#94A3B8'}
                      />
                      <Text
                        style={[
                          styles.downloadText,
                          isDownloaded && styles.downloadTextActive,
                        ]}
                      >
                        {isDownloaded ? 'OFFLINE' : 'SAVE'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.routeWaypoints}>
                    <View style={styles.pointRow}>
                      <Ionicons name="flag" size={14} color="#10B981" />
                      <Text style={styles.pointText}>{route.startLocationName}</Text>
                    </View>
                    <View style={styles.pointRow}>
                      <Ionicons name="location" size={14} color="#EF4444" />
                      <Text style={styles.pointText}>{route.endLocationName}</Text>
                    </View>
                  </View>

                  <View style={styles.routeStatsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>DISTANCE</Text>
                      <Text style={styles.statVal}>{formatDistance(route.distanceKm)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>DURATION</Text>
                      <Text style={styles.statVal}>
                        {formatDuration((route.estimatedDurationHours || 1) * 3600)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>CURVATURE</Text>
                      <Text style={[styles.statVal, { color: '#06B6D4' }]}>
                        {route.curvatureIndex ? `${route.curvatureIndex}/10` : '8.5/10'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#06B6D4',
  },
  tabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: '#F8FAFC',
  },
  feedContainer: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#090D16',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  filterScroll: {
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: '#06B6D4',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  hostBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  hostBtnSmallText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  createFirstBtnText: {
    color: '#090D16',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    gap: 6,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#090D16',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  routeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
    gap: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeCategory: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  routeTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  downloadBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  downloadText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  downloadTextActive: {
    color: '#10B981',
  },
  routeWaypoints: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statVal: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
});
