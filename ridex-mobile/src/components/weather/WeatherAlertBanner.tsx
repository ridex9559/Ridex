import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherAlert } from '../../services/weather/WeatherService';

interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
}

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({ alerts }) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0 || dismissed) return null;

  const topAlert = alerts[0];
  const isCritical = alerts.some(a => a.severity === 'critical');

  return (
    <View style={[styles.container, isCritical ? styles.containerCritical : styles.containerWarning]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isCritical ? 'warning' : 'information-circle'}
          size={18}
          color={isCritical ? '#EF4444' : '#F59E0B'}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{topAlert.title}</Text>
          <Text style={styles.actionPreview} numberOfLines={1}>
            {topAlert.recommendedAction}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#94A3B8"
        />
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          style={styles.dismissBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.descText}>{topAlert.description}</Text>
          <View style={styles.actionBox}>
            <Text style={styles.actionLabel}>Rider Safety Advisory:</Text>
            <Text style={styles.actionText}>{topAlert.recommendedAction}</Text>
          </View>
          {alerts.length > 1 && (
            <Text style={styles.moreAlertsText}>+{alerts.length - 1} more weather conditions active</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  },
  containerCritical: {
    backgroundColor: 'rgba(35, 10, 10, 0.95)',
    borderColor: '#EF4444'
  },
  containerWarning: {
    backgroundColor: 'rgba(30, 20, 10, 0.95)',
    borderColor: '#F59E0B'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  titleContainer: {
    flex: 1
  },
  titleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  actionPreview: {
    color: '#94A3B8',
    fontSize: 10
  },
  dismissBtn: {
    padding: 4
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  descText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6
  },
  actionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 8,
    marginTop: 6
  },
  actionLabel: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2
  },
  actionText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '500'
  },
  moreAlertsText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right'
  }
});
