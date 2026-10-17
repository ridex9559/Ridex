import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherCondition, WeatherAlert } from '../../services/weather/WeatherService';

interface WeatherHUDProps {
  weather: WeatherCondition | null;
  alerts?: WeatherAlert[];
  compact?: boolean;
}

export const WeatherHUD: React.FC<WeatherHUDProps> = ({ weather, alerts = [], compact = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!weather) return null;

  const hasCritical = alerts.some(a => a.severity === 'critical');
  const hasWarning = alerts.some(a => a.severity === 'warning');

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          compact && styles.containerCompact,
          hasCritical && styles.containerCritical,
          !hasCritical && hasWarning && styles.containerWarning
        ]}
        onPress={() => setShowDetails(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>{weather.icon}</Text>
        <View style={styles.infoCol}>
          <Text style={styles.tempText}>{weather.temperature}°C</Text>
          {!compact && (
            <Text style={styles.conditionText} numberOfLines={1}>
              {weather.condition}
            </Text>
          )}
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metricsCol}>
          <View style={styles.metricRow}>
            <Ionicons name="rainy-outline" size={11} color="#60A5FA" />
            <Text style={styles.metricText}>{weather.precipitationProbability}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Ionicons name="speedometer-outline" size={11} color="#A1A1AA" />
            <Text style={styles.metricText}>{weather.windSpeed} km/h</Text>
          </View>
        </View>

        {alerts.length > 0 && (
          <View style={[styles.alertDot, hasCritical ? styles.dotCritical : styles.dotWarning]}>
            <Ionicons name="warning" size={10} color="#000" />
          </View>
        )}
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal visible={showDetails} transparent animationType="fade" onRequestClose={() => setShowDetails(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDetails(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalBigIcon}>{weather.icon}</Text>
                <View>
                  <Text style={styles.modalTitle}>{weather.condition}</Text>
                  <Text style={styles.modalSubtitle}>Open-Meteo Live Radar</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Temperature</Text>
                <Text style={styles.gridValue}>{weather.temperature}°C</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Precipitation</Text>
                <Text style={[styles.gridValue, { color: '#60A5FA' }]}>{weather.precipitationProbability}%</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Wind Speed</Text>
                <Text style={styles.gridValue}>{weather.windSpeed} km/h</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Humidity</Text>
                <Text style={styles.gridValue}>{weather.humidity}%</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Visibility</Text>
                <Text style={styles.gridValue}>{weather.visibilityKm} km</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Day/Night</Text>
                <Text style={styles.gridValue}>{weather.isDay ? '☀️ Daytime' : '🌙 Night'}</Text>
              </View>
            </View>

            {alerts.length > 0 && (
              <View style={styles.alertsContainer}>
                <Text style={styles.alertsTitle}>Rider Weather Advisories ({alerts.length})</Text>
                {alerts.map(alert => (
                  <View
                    key={alert.id}
                    style={[
                      styles.alertCard,
                      alert.severity === 'critical' ? styles.alertCardCritical : styles.alertCardWarning
                    ]}
                  >
                    <View style={styles.alertHeader}>
                      <Ionicons
                        name={alert.severity === 'critical' ? 'alert-circle' : 'warning'}
                        size={16}
                        color={alert.severity === 'critical' ? '#EF4444' : '#F59E0B'}
                      />
                      <Text style={styles.alertCardTitle}>{alert.title}</Text>
                    </View>
                    <Text style={styles.alertCardDesc}>{alert.description}</Text>
                    <Text style={styles.alertCardAction}>💡 {alert.recommendedAction}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6
  },
  containerCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16
  },
  containerCritical: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(50, 10, 10, 0.9)'
  },
  containerWarning: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(40, 25, 10, 0.9)'
  },
  icon: {
    fontSize: 20,
    marginRight: 6
  },
  infoCol: {
    marginRight: 8
  },
  tempText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  conditionText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    maxWidth: 90
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 8
  },
  metricsCol: {
    justifyContent: 'center',
    gap: 2
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  metricText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '600'
  },
  alertDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  dotCritical: {
    backgroundColor: '#EF4444'
  },
  dotWarning: {
    backgroundColor: '#F59E0B'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  modalBigIcon: {
    fontSize: 32
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800'
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 11
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  gridItem: {
    width: '31%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center'
  },
  gridLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '600'
  },
  gridValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800'
  },
  alertsContainer: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12
  },
  alertsTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8
  },
  alertCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4
  },
  alertCardCritical: {
    borderLeftColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  alertCardWarning: {
    borderLeftColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)'
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  alertCardTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  alertCardDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6
  },
  alertCardAction: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600'
  }
});
