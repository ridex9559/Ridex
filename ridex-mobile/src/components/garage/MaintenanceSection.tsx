import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Motorcycle, MaintenanceItem } from '../../types/motorcycle';
import { maintenanceService } from '../../services/MaintenanceService';

interface MaintenanceSectionProps {
  bike: Motorcycle;
  onLogService?: (itemName: string) => void;
}

export const MaintenanceSection: React.FC<MaintenanceSectionProps> = ({
  bike,
  onLogService,
}) => {
  const maintenance = bike.maintenance || maintenanceService.evaluateMaintenance(bike);
  const insurance = maintenanceService.getDaysUntilExpiry(bike.insuranceExpiryDate);
  const puc = maintenanceService.getDaysUntilExpiry(bike.pucExpiryDate);

  const items: MaintenanceItem[] = Object.values(maintenance);

  const handleMarkServiced = (item: MaintenanceItem) => {
    Alert.alert(
      'Log Service',
      `Mark ${item.name} as serviced today at ${bike.odometerKm || bike.mileageKm || 4500} km?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Service',
          onPress: () => onLogService?.(item.name),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Ionicons name="build" size={16} color="#06B6D4" />
          <Text style={styles.headerTitle}>MAINTENANCE & HEALTH TRACKER</Text>
        </View>
      </View>

      {/* Document Expiry Badges */}
      <View style={styles.docRow}>
        <View style={[styles.docCard, insurance.status === 'EXPIRING_SOON' && styles.docCardWarning, insurance.status === 'EXPIRED' && styles.docCardDanger]}>
          <View style={styles.docIconWrap}>
            <Ionicons name="document-text" size={16} color={insurance.status === 'VALID' ? '#10B981' : '#F59E0B'} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docLabel}>INSURANCE EXPIRY</Text>
            <Text style={styles.docVal}>
              {insurance.days > 0 ? `Expires in ${insurance.days} days` : 'Renewal Due'}
            </Text>
          </View>
        </View>

        <View style={[styles.docCard, puc.status === 'EXPIRING_SOON' && styles.docCardWarning, puc.status === 'EXPIRED' && styles.docCardDanger]}>
          <View style={styles.docIconWrap}>
            <Ionicons name="shield-checkmark" size={16} color={puc.status === 'VALID' ? '#06B6D4' : '#F59E0B'} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docLabel}>PUC EMISSIONS</Text>
            <Text style={styles.docVal}>
              {puc.days > 0 ? `Valid for ${puc.days} days` : 'Renewal Due'}
            </Text>
          </View>
        </View>
      </View>

      {/* Service Reminders List */}
      <View style={styles.serviceList}>
        {items.map((item) => {
          const progressPercent = Math.min(
            100,
            Math.max(0, ((item.intervalKm - item.dueInKm) / item.intervalKm) * 100)
          );

          const isOverdue = item.status === 'OVERDUE';
          const isDueSoon = item.status === 'DUE_SOON';

          return (
            <View key={item.id} style={styles.serviceItem}>
              <View style={styles.serviceItemTop}>
                <View style={styles.serviceNameCol}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={[styles.dueText, isOverdue && styles.dueTextDanger, isDueSoon && styles.dueTextWarning]}>
                    {isOverdue
                      ? '⚠️ OVERDUE FOR SERVICE'
                      : `Due in ${item.dueInKm.toLocaleString()} km (Every ${item.intervalKm.toLocaleString()} km)`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.logServiceBtn}
                  onPress={() => handleMarkServiced(item)}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color="#06B6D4" />
                  <Text style={styles.logServiceText}>LOG</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                    isOverdue && { backgroundColor: '#EF4444' },
                    isDueSoon && { backgroundColor: '#F59E0B' },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
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
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  docRow: {
    flexDirection: 'row',
    gap: 10,
  },
  docCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  docCardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  docCardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  docIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  docVal: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  serviceList: {
    gap: 10,
  },
  serviceItem: {
    backgroundColor: '#0B1120',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  serviceItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceNameCol: {
    flex: 1,
  },
  serviceName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  dueText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  dueTextWarning: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  dueTextDanger: {
    color: '#EF4444',
    fontWeight: '900',
  },
  logServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  logServiceText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06B6D4',
    borderRadius: 2,
  },
});
