import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RideParticipant } from '../../types/groupRide';

interface RideParticipantListProps {
  participants: RideParticipant[];
  maxParticipants?: number | null;
  currentUserId?: string;
}

export const RideParticipantList: React.FC<RideParticipantListProps> = ({
  participants,
  maxParticipants,
  currentUserId,
}) => {
  const getRoleBadge = (role: RideParticipant['role']) => {
    switch (role) {
      case 'ORGANIZER':
        return {
          label: '👑 ORGANIZER',
          bg: '#3A2E10',
          text: '#F59E0B',
          icon: 'ribbon-outline' as const,
        };
      case 'LEADER':
      case 'ROAD_CAPTAIN':
        return {
          label: '⭐ LEADER',
          bg: '#16333E',
          text: '#06B6D4',
          icon: 'compass-outline' as const,
        };
      case 'SWEEPER':
        return {
          label: '🛡️ SWEEPER',
          bg: '#271F36',
          text: '#A855F7',
          icon: 'shield-outline' as const,
        };
      default:
        return {
          label: '🏍️ RIDER',
          bg: '#1A231C',
          text: '#10B981',
          icon: 'bicycle-outline' as const,
        };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderParticipant = ({ item }: { item: RideParticipant }) => {
    const roleConfig = getRoleBadge(item.role);
    const userId = item.userId ?? (item as any).user_id;
    const isSelf = userId === currentUserId;
    const displayName = item.user?.name || item.user?.fullName || 'Anonymous Rider';
    const handle = item.user?.username || (item.user as any)?.handle;
    const avatarUrl = item.user?.avatarUrl || (item.user as any)?.avatar_url;

    return (
      <View style={[styles.card, isSelf && styles.cardSelf]}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            {isSelf && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          {handle ? (
            <Text style={styles.userHandle} numberOfLines={1}>
              @{handle}
            </Text>
          ) : (
            <Text style={styles.userHandle}>Squad Member</Text>
          )}
        </View>

        <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
          <Ionicons name={roleConfig.icon} size={12} color={roleConfig.text} style={{ marginRight: 4 }} />
          <Text style={[styles.roleText, { color: roleConfig.text }]}>{roleConfig.label}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={16} color="#06B6D4" />
          <Text style={styles.headerTitle}>RIDER ROSTER</Text>
        </View>
        <Text style={styles.headerCount}>
          {participants.length}
          {maxParticipants ? ` / ${maxParticipants} Max` : ' Riders'}
        </Text>
      </View>

      {participants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={28} color="#475569" />
          <Text style={styles.emptyText}>No riders joined yet. Be the first to join!</Text>
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id || item.userId || (item as any).user_id}
          renderItem={renderParticipant}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardSelf: {
    borderColor: 'rgba(6, 182, 212, 0.4)',
    backgroundColor: '#162238',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  userHandle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  youBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
});
