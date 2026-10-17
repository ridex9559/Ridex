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
import { ArrowLeft, Plus, Wrench, Bike } from 'lucide-react-native';
import { Card, Badge, Button } from '@/components/ui';
import { useBikeStore } from '@/store/bikeStore';
import { Motorcycle } from '@/types/motorcycle';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

import { MaintenanceSection } from '@/components/garage/MaintenanceSection';

export default function GarageScreen() {
  const router = useRouter();
  const { motorcycles, activeMotorcycleId, setActiveMotorcycle } = useBikeStore();

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
        <Text style={styles.headerTitle}>DIGITAL GARAGE</Text>
        <TouchableOpacity
          onPress={() => router.push('/garage/add-bike')}
          style={styles.iconBtn}
        >
          <Plus size={20} color={COLORS.primary.DEFAULT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>REGISTERED FLEET ({motorcycles.length})</Text>

        {motorcycles.length === 0 ? (
          <Card variant="glass" style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Bike size={36} color={COLORS.primary.DEFAULT} />
            </View>
            <Text style={styles.emptyTitle}>GARAGE IS EMPTY</Text>
            <Text style={styles.emptyDesc}>
              No motorcycles registered to your account yet. Add your machine to start tracking telemetry, specs, and ride logs.
            </Text>
            <Button
              title="REGISTER YOUR FIRST BIKE"
              onPress={() => router.push('/garage/add-bike')}
              variant="primary"
              size="md"
              leftIcon={<Plus size={18} color="#FFFFFF" />}
              style={styles.emptyBtn}
            />
          </Card>
        ) : (
          motorcycles.map((bike: Motorcycle) => {
            const isActive = bike.id === activeMotorcycleId;
            return (
              <View key={bike.id} style={{ marginBottom: 16 }}>
                <Card
                  variant={isActive ? 'glass' : 'elevated'}
                  style={isActive ? [styles.bikeCard, styles.activeBikeCard] : styles.bikeCard}
                >
                  {/* Card Header */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push(`/garage/${bike.id}` as any)}
                    style={styles.bikeHeader}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bikeCategory}>{bike.category || 'ADVENTURE'}</Text>
                      <Text style={styles.bikeName}>
                        {bike.brand || bike.make} {bike.model}
                      </Text>
                      {bike.registrationNumber ? (
                        <Text style={styles.regNumber}>{bike.registrationNumber}</Text>
                      ) : null}
                      {bike.nickname ? (
                        <Text style={styles.nickname}>"{bike.nickname}"</Text>
                      ) : null}
                    </View>

                    {isActive ? (
                      <Badge label="ACTIVE RIDE" variant="primary" size="sm" />
                    ) : (
                      <TouchableOpacity
                        onPress={() => setActiveMotorcycle(bike.id)}
                        style={styles.selectBtn}
                      >
                        <Text style={styles.selectBtnText}>SELECT</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  {/* Specs Grid */}
                  <View style={styles.specsGrid}>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>DISPLACEMENT</Text>
                      <Text style={styles.specVal}>{bike.displacementCc} CC</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>TANK</Text>
                      <Text style={styles.specVal}>{bike.fuelTankCapacityLiters || 15} L</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>MILEAGE</Text>
                      <Text style={styles.specVal}>{bike.averageMileageKmpl || 22} KM/L</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>ODOMETER</Text>
                      <Text style={styles.specVal}>{(bike.odometerKm || bike.mileageKm || 4500).toLocaleString()} KM</Text>
                    </View>
                  </View>

                  {/* Maintenance Section Integration */}
                  <MaintenanceSection bike={bike} />
                </Card>
              </View>
            );
          })
        )}

        {motorcycles.length > 0 ? (
          <Button
            title="ADD NEW MOTORCYCLE"
            onPress={() => router.push('/garage/add-bike')}
            variant="outline"
            size="lg"
            fullWidth
            leftIcon={<Plus size={20} color={COLORS.primary.DEFAULT} />}
            style={{ marginTop: SPACING.md }}
          />
        ) : null}
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
  sectionHeader: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  bikeCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  activeBikeCard: {
    borderColor: 'rgba(255, 90, 31, 0.4)',
    borderWidth: 1.5,
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  bikeCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1,
    marginBottom: 2,
  },
  bikeName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  nickname: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  regNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06B6D4',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  selectBtn: {
    backgroundColor: COLORS.background.surfaceLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  selectBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  specBox: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  specVal: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  maintenanceText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.2)',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 90, 31, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  emptyBtn: {
    width: '100%',
  },
});
