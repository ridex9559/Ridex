import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Users,
  MapPin,
  Plus,
  Shield,
  Crown,
  ChevronRight,
  Flame,
} from 'lucide-react-native';
import { Card, Badge, Button, Avatar } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

const RIDER_GROUPS = [
  {
    id: 'grp-1',
    name: 'RoadRiders Pune',
    description:
      'Premier motorcycle community for touring, adventure ghat runs, and weekend morning rides around Pune.',
    city: 'Pune',
    membersCount: 245,
    upcomingRidesCount: 2,
    badge: 'LEAD SQUAD',
    isJoined: true,
    organizer: 'Pratik Sharma',
    coverImage:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
  },
  {
    id: 'grp-2',
    name: 'Sahyadri Moto Explorers',
    description:
      'Ghat specialists covering Tamhini, Varandha, Malshej, and coastal Konkan twisties.',
    city: 'Pune & Konkan',
    membersCount: 180,
    upcomingRidesCount: 3,
    badge: 'GHATS CREW',
    isJoined: true,
    organizer: 'Amit Deshmukh',
    coverImage:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80',
  },
  {
    id: 'grp-3',
    name: 'Deccan Royal Enfield Guild',
    description:
      'Dedicated to Himalayan 450, Interceptor 650, and Classic tourers across Maharashtra.',
    city: 'Pune & Mumbai',
    membersCount: 310,
    upcomingRidesCount: 1,
    badge: 'COMMUNITY',
    isJoined: false,
    organizer: 'Rahul Kulkarni',
    coverImage:
      'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800&q=80',
  },
  {
    id: 'grp-4',
    name: 'Mumbai Coastal Cruisers',
    description:
      'Night highway blasts & weekend coastal highway runs from Bandra to Alibaug.',
    city: 'Mumbai',
    membersCount: 420,
    upcomingRidesCount: 4,
    badge: 'METRO CLUB',
    isJoined: false,
    organizer: 'Vikram Mehta',
    coverImage:
      'https://images.unsplash.com/photo-1515777315835-281b94c9589f?w=800&q=80',
  },
];

export default function GroupsTabScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'MY_GROUPS' | 'DISCOVER'>('MY_GROUPS');

  const filteredGroups =
    tab === 'MY_GROUPS'
      ? RIDER_GROUPS.filter((g) => g.isJoined)
      : RIDER_GROUPS;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>RIDER GROUPS</Text>
          <Text style={styles.headerSubtitle}>Motorcycle Communities & Squads</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/rides/create')}
          style={styles.hostBtn}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.hostBtnText}>HOST RIDE</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'MY_GROUPS' && styles.tabItemActive]}
          onPress={() => setTab('MY_GROUPS')}
        >
          <Text style={[styles.tabText, tab === 'MY_GROUPS' && styles.tabTextActive]}>
            MY SQUADS (2)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === 'DISCOVER' && styles.tabItemActive]}
          onPress={() => setTab('DISCOVER')}
        >
          <Text style={[styles.tabText, tab === 'DISCOVER' && styles.tabTextActive]}>
            DISCOVER ALL ({RIDER_GROUPS.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* City Location Pill */}
        <View style={styles.cityPillRow}>
          <MapPin size={14} color={COLORS.primary.DEFAULT} />
          <Text style={styles.cityPillText}>GROUPS IN PUNE & WESTERN GHATS</Text>
        </View>

        {filteredGroups.map((group) => (
          <Card key={group.id} variant="elevated" style={styles.groupCard}>
            {/* Cover Image Banner */}
            <View style={styles.cardCoverWrap}>
              <Image source={{ uri: group.coverImage }} style={styles.cardCover} />
              <View style={styles.cardCoverOverlay} />
              <View style={styles.cardBadgeBox}>
                <Badge label={group.badge} variant="primary" size="sm" />
                {group.isJoined ? (
                  <Badge label="MEMBER" variant="outline" size="sm" />
                ) : null}
              </View>
            </View>

            {/* Content */}
            <View style={styles.cardBody}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDesc} numberOfLines={2}>
                {group.description}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Users size={14} color={COLORS.text.secondary} />
                  <Text style={styles.metaText}>{group.membersCount} Riders</Text>
                </View>

                <View style={styles.metaItem}>
                  <Crown size={14} color="#FFB020" />
                  <Text style={styles.metaText}>Lead: {group.organizer}</Text>
                </View>

                {group.upcomingRidesCount > 0 ? (
                  <View style={styles.metaItem}>
                    <Flame size={14} color={COLORS.primary.DEFAULT} />
                    <Text style={[styles.metaText, { color: COLORS.primary.DEFAULT }]}>
                      {group.upcomingRidesCount} Rides
                    </Text>
                  </View>
                ) : null}
              </View>

              <Button
                title={group.isJoined ? 'ENTER GROUP HUB' : 'VIEW & JOIN GROUP'}
                onPress={() => router.push(`/community/groups/${group.id}` as any)}
                variant={group.isJoined ? 'primary' : 'outline'}
                size="md"
                fullWidth
                rightIcon={<ChevronRight size={18} color={group.isJoined ? '#FFFFFF' : COLORS.primary.DEFAULT} />}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
  },
  hostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.DEFAULT,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  hostBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
    backgroundColor: COLORS.background.surface,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary.DEFAULT,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: COLORS.primary.DEFAULT,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  cityPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  cityPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  groupCard: {
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    padding: 0,
  },
  cardCoverWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  cardCover: {
    width: '100%',
    height: '100%',
  },
  cardCoverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 10, 15, 0.45)',
  },
  cardBadgeBox: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  cardBody: {
    padding: SPACING.md,
  },
  groupName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  groupDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    marginBottom: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
});
