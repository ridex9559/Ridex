import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Shield, MapPin, ChevronRight, Plus } from 'lucide-react-native';
import { Card, Badge, Button } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

const MOCK_GROUPS = [
  {
    id: 'grp-1',
    name: 'Alpine Twisties & Passes Squad',
    membersCount: 1420,
    region: 'Alps / Switzerland & Italy',
    badge: 'PRO CLUB',
    description: 'Weekly weekend blasts across Stelvio, Grossglockner & Furka Pass. Fast-paced, high lean angle tours.',
  },
  {
    id: 'grp-2',
    name: 'Ducati Superquadro Syndicate',
    membersCount: 840,
    region: 'Europe Wide',
    badge: 'MARQUE',
    description: 'Dedicated to Panigale, Streetfighter & Multistrada V4 riders. Trackdays and canyon tours.',
  },
  {
    id: 'grp-3',
    name: 'Midnight Black Forest Runners',
    membersCount: 620,
    region: 'Schwarzwald, Germany',
    badge: 'NIGHT SQUAD',
    description: 'Sunset and twilight runs through B500 with radar beacons and safety sweepers.',
  },
];

export default function GroupsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RIDER GROUPS & CLUBS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>EXPLORE PACKS & CLUBS</Text>

        {MOCK_GROUPS.map(group => (
          <Card key={group.id} variant="elevated" style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={{ flex: 1 }}>
                <Badge label={group.badge} variant="primary" size="sm" style={{ marginBottom: 4 }} />
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={12} color={COLORS.text.muted} />
                  <Text style={styles.locationText}>{group.region}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.groupDesc}>{group.description}</Text>

            <View style={styles.groupFooter}>
              <View style={styles.membersRow}>
                <Users size={14} color={COLORS.text.secondary} />
                <Text style={styles.membersText}>{group.membersCount.toLocaleString()} RIDERS</Text>
              </View>

              <Button
                title="JOIN PACK"
                onPress={() => {}}
                variant="secondary"
                size="sm"
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
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  groupCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  groupName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
  groupDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginVertical: SPACING.sm,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membersText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
});
