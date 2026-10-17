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
import { ArrowLeft, Bell, Heart, Users, Award, ShieldAlert } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { MOCK_NOTIFICATIONS } from '@/data/achievements';
import { AppNotification } from '@/types/achievement';
import { formatTimeAgo } from '@/utils/formatters';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';

export default function NotificationsScreen() {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT':
        return <Award size={18} color={COLORS.accent.gold} />;
      case 'SOCIAL':
        return <Heart size={18} color={COLORS.status.error} />;
      case 'GROUP_RIDE':
        return <Users size={18} color={COLORS.primary.DEFAULT} />;
      case 'SOS_ALERT':
        return <ShieldAlert size={18} color={COLORS.status.error} />;
      default:
        return <Bell size={18} color={COLORS.text.secondary} />;
    }
  };

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
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_NOTIFICATIONS.map((item: AppNotification) => (
          <Card
            key={item.id}
            variant={item.isRead ? 'flat' : 'elevated'}
            style={item.isRead ? styles.itemCard : [styles.itemCard, styles.unreadCard]}
          >
            <View style={styles.itemHeader}>
              <View style={styles.iconCircle}>{getIcon(item.type)}</View>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMessage}>{item.message}</Text>
              </View>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
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
  itemCard: {
    marginBottom: SPACING.sm + 4,
    padding: SPACING.md,
  },
  unreadCard: {
    borderColor: 'rgba(255, 90, 31, 0.3)',
    backgroundColor: 'rgba(255, 90, 31, 0.04)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  itemMessage: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 10,
    color: COLORS.text.muted,
  },
});
