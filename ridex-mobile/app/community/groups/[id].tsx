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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  MapPin,
  Shield,
  Crown,
  Star,
  Plus,
  Calendar,
  ChevronRight,
  Bike,
} from 'lucide-react-native';
import { Card, Badge, Button, Avatar } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'RIDES' | 'MEMBERS' | 'ABOUT'>('RIDES');
  const [isJoined, setIsJoined] = useState(true);

  const group = {
    id: id || 'grp-1',
    name: 'RoadRiders Pune',
    description:
      'Premier motorcycle community for touring, adventure ghat runs, and weekend morning rides around Pune and the Western Ghats.',
    city: 'Pune, Maharashtra',
    coverImage:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
    membersCount: 245,
    organizer: {
      name: 'Pratik Sharma',
      username: 'pratik_lead',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
      bike: 'Royal Enfield Himalayan 450',
    },
    admins: [
      {
        name: 'Rahul Kulkarni',
        username: 'rahul_390',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        bike: 'KTM Adventure 390',
      },
      {
        name: 'Amit Deshmukh',
        username: 'amit_tiger',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        bike: 'Triumph Tiger 900',
      },
    ],
    upcomingRides: [
      {
        id: 'ride-1',
        title: 'Tamhini Ghat Sunday Ride',
        route: 'Pune → Tamhini Ghat',
        date: 'Sunday, Sept 14',
        time: '6:00 AM',
        distance: '64 km',
        riders: 13,
        maxRiders: 20,
        rideCode: 'RIDEX-7X92K',
      },
      {
        id: 'ride-2',
        title: 'Lavasa Sunrise Twisties',
        route: 'Pune → Lavasa',
        date: 'Saturday, Sept 20',
        time: '5:30 AM',
        distance: '58 km',
        riders: 8,
        maxRiders: 15,
        rideCode: 'RIDEX-9L41P',
      },
    ],
    members: [
      {
        id: 'm1',
        name: 'Pratik Sharma',
        role: 'ORGANIZER',
        bike: 'Himalayan 450',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
      },
      {
        id: 'm2',
        name: 'Rahul Kulkarni',
        role: 'ADMIN',
        bike: 'KTM 390',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      },
      {
        id: 'm3',
        name: 'Amit Deshmukh',
        role: 'ADMIN',
        bike: 'Tiger 900',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      },
      {
        id: 'm4',
        name: 'Vishal Gaikwad',
        role: 'MEMBER',
        bike: 'BMW G310GS',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      },
      {
        id: 'm5',
        name: 'Karan Patil',
        role: 'MEMBER',
        bike: 'Interceptor 650',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80',
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.name.toUpperCase()}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Image & Overlay */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: group.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
          <View style={styles.coverBadgeBox}>
            <View style={styles.locationPill}>
              <MapPin size={12} color="#00E5FF" />
              <Text style={styles.locationText}>{group.city}</Text>
            </View>
            <View style={styles.memberPill}>
              <Users size={12} color="#FFFFFF" />
              <Text style={styles.memberText}>{group.membersCount} RIDERS</Text>
            </View>
          </View>
        </View>

        {/* Group Name & Join Action */}
        <View style={styles.groupInfoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupBio}>{group.description}</Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <Button
            title={isJoined ? 'JOINED SQUAD' : 'JOIN GROUP'}
            onPress={() => setIsJoined(!isJoined)}
            variant={isJoined ? 'secondary' : 'primary'}
            size="md"
            style={{ flex: 1 }}
          />
          <Button
            title="HOST RIDE"
            onPress={() => router.push('/rides/create')}
            variant="outline"
            size="md"
            leftIcon={<Plus size={16} color={COLORS.primary.DEFAULT} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Key Leadership Row */}
        <Card variant="glass" style={styles.leadershipCard}>
          <Text style={styles.leaderSectionTitle}>GROUP LEADERSHIP</Text>
          <View style={styles.leaderRow}>
            {/* Organizer */}
            <View style={styles.leaderItem}>
              <View style={styles.crownIconWrap}>
                <Crown size={12} color="#FFB020" />
              </View>
              <Avatar uri={group.organizer.avatar} name={group.organizer.name} size={42} />
              <Text style={styles.leaderName} numberOfLines={1}>
                {group.organizer.name}
              </Text>
              <Text style={styles.leaderRole}>ORGANIZER</Text>
            </View>

            {/* Admins */}
            {group.admins.map((admin, idx) => (
              <View key={idx} style={styles.leaderItem}>
                <View style={styles.starIconWrap}>
                  <Star size={12} color="#00E5FF" />
                </View>
                <Avatar uri={admin.avatar} name={admin.name} size={42} />
                <Text style={styles.leaderName} numberOfLines={1}>
                  {admin.name}
                </Text>
                <Text style={styles.leaderRole}>ADMIN</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Tabs Bar */}
        <View style={styles.tabNav}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'RIDES' && styles.tabItemActive]}
            onPress={() => setActiveTab('RIDES')}
          >
            <Text style={[styles.tabText, activeTab === 'RIDES' && styles.tabTextActive]}>
              UPCOMING RIDES ({group.upcomingRides.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'MEMBERS' && styles.tabItemActive]}
            onPress={() => setActiveTab('MEMBERS')}
          >
            <Text style={[styles.tabText, activeTab === 'MEMBERS' && styles.tabTextActive]}>
              MEMBERS ({group.members.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* =========================================================================
            TAB 1: UPCOMING GROUP RIDES
           ========================================================================= */}
        {activeTab === 'RIDES' && (
          <View style={{ gap: SPACING.md }}>
            {group.upcomingRides.map((ride) => (
              <Card key={ride.id} variant="elevated" style={styles.rideCard}>
                <View style={styles.rideHeaderRow}>
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>{ride.rideCode}</Text>
                  </View>
                  <Text style={styles.rideDistance}>{ride.distance}</Text>
                </View>

                <Text style={styles.rideTitle}>{ride.title}</Text>
                <Text style={styles.rideRoute}>📍 {ride.route}</Text>

                <View style={styles.rideMetaRow}>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color={COLORS.text.muted} />
                    <Text style={styles.metaText}>
                      {ride.date} • {ride.time}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Users size={14} color={COLORS.primary.DEFAULT} />
                    <Text style={styles.metaText}>
                      {ride.riders} / {ride.maxRiders} Riders
                    </Text>
                  </View>
                </View>

                <Button
                  title="VIEW RIDE LOBBY"
                  onPress={() => router.push(`/rides/${ride.id}` as any)}
                  variant="primary"
                  size="md"
                  fullWidth
                  rightIcon={<ChevronRight size={18} color="#FFFFFF" />}
                  style={{ marginTop: SPACING.sm }}
                />
              </Card>
            ))}
          </View>
        )}

        {/* =========================================================================
            TAB 2: GROUP MEMBERS ROSTER
           ========================================================================= */}
        {activeTab === 'MEMBERS' && (
          <View style={{ gap: SPACING.sm }}>
            {group.members.map((member) => (
              <Card key={member.id} variant="glass" style={styles.memberCard}>
                <Avatar uri={member.avatar} name={member.name} size={44} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberBike}>🏍️ {member.bike}</Text>
                </View>
                <Badge
                  label={member.role}
                  variant={
                    member.role === 'ORGANIZER'
                      ? 'primary'
                      : member.role === 'ADMIN'
                      ? 'outline'
                      : 'secondary'
                  }
                  size="sm"
                />
              </Card>
            ))}
          </View>
        )}
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
    maxWidth: 240,
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
  coverWrap: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.md,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 10, 15, 0.45)',
  },
  coverBadgeBox: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E5FF',
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  memberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupInfoRow: {
    marginBottom: SPACING.md,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  groupBio: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  leadershipCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  leaderSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leaderItem: {
    alignItems: 'center',
    width: 80,
    position: 'relative',
  },
  crownIconWrap: {
    position: 'absolute',
    top: -6,
    right: 18,
    zIndex: 2,
    backgroundColor: COLORS.background.dark,
    padding: 2,
    borderRadius: 8,
  },
  starIconWrap: {
    position: 'absolute',
    top: -6,
    right: 18,
    zIndex: 2,
    backgroundColor: COLORS.background.dark,
    padding: 2,
    borderRadius: 8,
  },
  leaderName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  leaderRole: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.8,
  },
  tabNav: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
    marginBottom: SPACING.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.sm,
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
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: COLORS.primary.DEFAULT,
  },
  rideCard: {
    padding: SPACING.md,
  },
  rideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  liveTag: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.4)',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1,
  },
  rideDistance: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.secondary,
  },
  rideTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  rideRoute: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#00E5FF',
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  rideMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
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
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  memberName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  memberBike: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});
