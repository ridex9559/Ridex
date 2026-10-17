import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroupSeparationState, SeparatedRiderInfo } from '../../types/connectRide';

interface SeparationAlertBannerProps {
  separationState: GroupSeparationState;
  onFocusRider?: (rider: SeparatedRiderInfo) => void;
}

export const SeparationAlertBanner: React.FC<SeparationAlertBannerProps> = ({
  separationState,
  onFocusRider,
}) => {
  const { status, message, separatedRiders } = separationState;

  if (status === 'TOGETHER') {
    return (
      <View style={[styles.container, styles.togetherBg]}>
        <View style={styles.dotGreen} />
        <Text style={styles.togetherText} numberOfLines={1}>
          SQUAD TOGETHER • WITHIN 500M
        </Text>
      </View>
    );
  }

  if (status === 'SPREAD') {
    return (
      <View style={[styles.container, styles.spreadBg]}>
        <View style={styles.dotYellow} />
        <Text style={styles.spreadText} numberOfLines={1}>
          {message || 'SQUAD SPREAD ALONG ROUTE'}
        </Text>
      </View>
    );
  }

  // SEPARATED STATUS (Red Warning)
  const separatedRider = separatedRiders[0];

  return (
    <View style={[styles.container, styles.separatedBg]}>
      <View style={styles.alertLeft}>
        <View style={styles.pulseRed}>
          <Ionicons name="warning" size={14} color="#EF4444" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.separatedTitle}>RIDER SEPARATED</Text>
          <Text style={styles.separatedDesc} numberOfLines={1}>
            {separatedRider
              ? `${separatedRider.name} is ${separatedRider.distanceBehindKm} km behind`
              : message}
          </Text>
        </View>
      </View>

      {separatedRider && onFocusRider ? (
        <TouchableOpacity
          style={styles.focusBtn}
          activeOpacity={0.8}
          onPress={() => onFocusRider(separatedRider)}
        >
          <Ionicons name="locate" size={12} color="#FFFFFF" />
          <Text style={styles.focusBtnText}>LOCATE</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
    zIndex: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  togetherBg: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    gap: 8,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  togetherText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  spreadBg: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    justifyContent: 'center',
    gap: 8,
  },
  dotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  spreadText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  separatedBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  pulseRed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  separatedTitle: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  separatedDesc: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  focusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  focusBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
