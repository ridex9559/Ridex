import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, Gauge, Compass, Zap } from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR'>('WEEK');

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
        <Text style={styles.headerTitle}>TELEMETRY ANALYTICS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['WEEK', 'MONTH', 'YEAR'] as const).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodChip,
                period === p && styles.periodChipActive,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.periodTextActive,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Distance Velocity Chart Card */}
        <Card variant="glass" style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>DISTANCE & SPEED DYNAMICS</Text>
              <Text style={styles.chartSub}>Aggregate riding telemetry breakdown</Text>
            </View>
            <Badge label="+24% VS PREV" variant="success" size="sm" />
          </View>

          {/* Graphical Bar Histogram */}
          <View style={styles.histogram}>
            {[
              { day: 'MON', val: 45, speed: 112 },
              { day: 'TUE', val: 28, speed: 94 },
              { day: 'WED', val: 78, speed: 145 },
              { day: 'THU', val: 52, speed: 120 },
              { day: 'FRI', val: 95, speed: 168 },
              { day: 'SAT', val: 184, speed: 204 },
              { day: 'SUN', val: 142, speed: 186 },
            ].map(item => (
              <View key={item.day} style={styles.barColumn}>
                <Text style={styles.barValue}>{item.val}</Text>
                <View style={[styles.barFill, { height: Math.max(16, item.val * 0.7) }]} />
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Lean Angle Distribution */}
        <Text style={styles.sectionHeader}>CORNERING & LEAN DISTRIBUTION</Text>
        <Card variant="elevated" style={styles.leanCard}>
          <View style={styles.leanRow}>
            <View style={styles.leanStat}>
              <Text style={styles.leanStatLabel}>LEFT APEX MAX</Text>
              <Text style={styles.leanStatVal}>49° L</Text>
            </View>
            <View style={styles.leanCenter}>
              <Zap size={28} color={COLORS.accent.telemetryCyan} />
              <Text style={styles.leanCenterText}>52° PEAK</Text>
            </View>
            <View style={styles.leanStat}>
              <Text style={styles.leanStatLabel}>RIGHT APEX MAX</Text>
              <Text style={styles.leanStatVal}>52° R</Text>
            </View>
          </View>
        </Card>

        {/* Riding Insights */}
        <Text style={styles.sectionHeader}>AI RIDING INSIGHTS</Text>
        <Card variant="flat" style={styles.insightCard}>
          <Text style={styles.insightTitle}>🔥 Corner Entry Efficiency: 91%</Text>
          <Text style={styles.insightBody}>
            Your trail-braking smoothness improved by 14% on high-speed twisties this week. Smooth throttle roll-on detected across alpine hairpin curves.
          </Text>
        </Card>
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
  periodRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  periodChip: {
    flex: 1,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: COLORS.primary.DEFAULT,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  chartSub: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  histogram: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: SPACING.md,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text.muted,
    marginBottom: 4,
  },
  barFill: {
    width: 14,
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: RADIUS.sm,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.secondary,
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  leanCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  leanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leanStat: {
    alignItems: 'center',
  },
  leanStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  leanStatVal: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  leanCenter: {
    alignItems: 'center',
  },
  leanCenterText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent.telemetryCyan,
    marginTop: 2,
  },
  insightCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  insightTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  insightBody: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});
