import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FuelPlanSummary, fuelPlanningService } from '../../services/fuel/FuelPlanningService';

export interface FuelPlanningCardProps {
  plan?: FuelPlanSummary;
  tripDistanceKm?: number;
  bikeTankCapacityL?: number;
  bikeAvgMileageKmpl?: number;
}

export const FuelPlanningCard: React.FC<FuelPlanningCardProps> = ({
  plan,
  tripDistanceKm,
  bikeTankCapacityL,
  bikeAvgMileageKmpl,
}) => {
  const activePlan: FuelPlanSummary =
    plan ||
    fuelPlanningService.calculateFuelPlan({
      distanceKm: tripDistanceKm || 50,
      tankCapacityLiters: bikeTankCapacityL,
      averageMileageKmpl: bikeAvgMileageKmpl,
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={16} color="#06B6D4" />
          <Text style={styles.headerTitle}>FUEL & RANGE TELEMETRY</Text>
        </View>
        <Text style={styles.costBadge}>₹{activePlan.estimatedCostInr} EST. COST</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>FUEL REQUIRED</Text>
          <Text style={styles.metricValue}>{activePlan.requiredFuelLiters} L</Text>
          <Text style={styles.metricSub}>@ ₹{activePlan.fuelPricePerLiter}/L</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>TANK CAPACITY</Text>
          <Text style={styles.metricValue}>{activePlan.tankCapacityLiters} L</Text>
          <Text style={styles.metricSub}>{activePlan.averageMileageKmpl} km/l avg</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>FULL RANGE</Text>
          <Text style={styles.metricValue}>{activePlan.fullRangeKm || activePlan.maxTankRangeKm} KM</Text>
          <Text style={styles.metricSub}>Single Tank</Text>
        </View>
      </View>

      {/* Range Status Alert */}
      {activePlan.exceedsSingleTank ? (
        <View style={styles.refuelWarning}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>⚠ REFUEL REQUIRED</Text>
            <Text style={styles.refuelWarningText}>
              Route distance ({activePlan.distanceKm} km) exceeds safe single tank range ({activePlan.suggestedStopIntervalKm} km). Plan at least {activePlan.refuelStopsNeeded} fuel stop(s).
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.safeRangeBox}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <View style={styles.alertContent}>
            <Text style={styles.safeTitle}>SAFE SINGLE TANK RIDE</Text>
            <Text style={styles.safeRangeText}>
              {activePlan.distanceKm} km of {activePlan.fullRangeKm || activePlan.maxTankRangeKm} km full tank capacity (Remaining: {activePlan.remainingRangeKm} km).
            </Text>
          </View>
        </View>
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
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  costBadge: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#0B1120',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  metricSub: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  safeTitle: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  refuelWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 10,
  },
  refuelWarningText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  safeRangeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 10,
  },
  safeRangeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
});
