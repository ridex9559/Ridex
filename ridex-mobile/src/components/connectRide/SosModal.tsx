import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SosIssueType, SosAlert } from '../../types/connectRide';
import { emergencyContactService } from '../../services/EmergencyContactService';
import { useAuthStore } from '../../store/authStore';
import { MapCoordinate } from '../../services/maps/mapTypes';

interface SosModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSos: (issueType: SosIssueType, note?: string) => Promise<void>;
  activeAlerts: SosAlert[];
  currentUserId?: string;
  currentCoordinate?: MapCoordinate | null;
  onResolveSos?: (alertId: string) => Promise<void>;
  onFocusSosLocation?: (alert: SosAlert) => void;
}

const SOS_OPTIONS: { type: SosIssueType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'FLAT_TYRE', label: 'Flat Tyre / Puncture', icon: 'disc', color: '#F59E0B' },
  { type: 'MECHANICAL', label: 'Bike Breakdown', icon: 'construct', color: '#EF4444' },
  { type: 'OUT_OF_FUEL', label: 'Out of Fuel', icon: 'water', color: '#06B6D4' },
  { type: 'MEDICAL', label: 'Medical Assistance', icon: 'medkit', color: '#EC4899' },
  { type: 'LOST', label: 'Lost / Detoured', icon: 'compass', color: '#A855F7' },
];

export const SosModal: React.FC<SosModalProps> = ({
  visible,
  onClose,
  onSubmitSos,
  activeAlerts,
  currentUserId,
  currentCoordinate,
  onResolveSos,
  onFocusSosLocation,
}) => {
  const user = useAuthStore(state => state.user);
  const [selectedType, setSelectedType] = useState<SosIssueType>('FLAT_TYRE');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 5-Second Countdown State
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const primaryContact = user?.emergencyContacts?.[0];

  useEffect(() => {
    if (!visible) {
      handleCancelCountdown();
    }
  }, [visible]);

  useEffect(() => {
    if (isCountingDown) {
      if (countdown > 0) {
        countdownTimerRef.current = setTimeout(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        // Countdown finished -> trigger actual broadcast
        executeSosBroadcast();
      }
    }
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [isCountingDown, countdown]);

  const handleStartCountdown = () => {
    setCountdown(5);
    setIsCountingDown(true);
  };

  const handleCancelCountdown = () => {
    setIsCountingDown(false);
    setCountdown(5);
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const executeSosBroadcast = async () => {
    handleCancelCountdown();
    setIsSubmitting(true);
    try {
      await onSubmitSos(selectedType, note);
      setNote('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallGuardian = () => {
    if (primaryContact?.phone) {
      emergencyContactService.callContact(primaryContact.phone);
    }
  };

  const handleSmsGuardian = () => {
    if (primaryContact) {
      const riderName = user?.fullName || 'RIDEX Rider';
      emergencyContactService.sendEmergencySms(
        primaryContact,
        riderName,
        currentCoordinate,
        `${selectedType.replace('_', ' ')}: ${note || 'Immediate Assistance Needed'}`
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        {/* 5-Second Countdown Fullscreen Guard */}
        {isCountingDown ? (
          <View style={styles.countdownSheet}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownSecLabel}>SECONDS</Text>
            </View>

            <Text style={styles.countdownHeading}>BROADCASTING SOS ALERT</Text>
            <Text style={styles.countdownSub}>
              Alerting squad leader and captains with GPS coordinates in {countdown}s...
            </Text>

            <View style={styles.countdownButtons}>
              <TouchableOpacity
                style={styles.cancelCountdownBtn}
                onPress={handleCancelCountdown}
              >
                <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                <Text style={styles.cancelCountdownText}>CANCEL SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendNowBtn}
                onPress={executeSosBroadcast}
              >
                <Ionicons name="flash" size={18} color="#000" />
                <Text style={styles.sendNowText}>SEND NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.sosIconBox}>
                  <Ionicons name="warning" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.headerTitle}>SQUAD SOS EMERGENCY</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.headerDesc}>
              Instantly alert the squad leader and road captains with your live coordinates.
            </Text>

            {/* Offline Guardian Direct Options */}
            {primaryContact && (
              <View style={styles.guardianBar}>
                <View style={styles.guardianInfo}>
                  <Text style={styles.guardianLabel}>EMERGENCY GUARDIAN</Text>
                  <Text style={styles.guardianName}>{primaryContact.name} ({primaryContact.relationship})</Text>
                </View>
                <View style={styles.guardianActions}>
                  <TouchableOpacity style={styles.guardianCallBtn} onPress={handleCallGuardian}>
                    <Ionicons name="call" size={14} color="#FFF" />
                    <Text style={styles.guardianBtnText}>CALL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.guardianSmsBtn} onPress={handleSmsGuardian}>
                    <Ionicons name="chatbubble-ellipses" size={14} color="#FFF" />
                    <Text style={styles.guardianBtnText}>GPS SMS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Active Alerts List (if any) */}
            {activeAlerts.length > 0 && (
              <View style={styles.activeAlertsSection}>
                <Text style={styles.activeAlertsTitle}>ACTIVE SQUAD EMERGENCIES</Text>
                {activeAlerts.map((alert) => (
                  <View key={alert.id} style={styles.activeAlertCard}>
                    <View style={styles.activeAlertInfo}>
                      <Text style={styles.activeAlertName}>{alert.userName}</Text>
                      <Text style={styles.activeAlertType}>{alert.issueType.replace('_', ' ')}</Text>
                    </View>
                    <View style={styles.activeAlertActions}>
                      <TouchableOpacity
                        style={styles.locateBtn}
                        onPress={() => onFocusSosLocation?.(alert)}
                      >
                        <Ionicons name="locate" size={14} color="#090D16" />
                        <Text style={styles.locateBtnText}>MAP</Text>
                      </TouchableOpacity>
                      {(alert.userId === currentUserId || onResolveSos) && (
                        <TouchableOpacity
                          style={styles.resolveBtn}
                          onPress={() => onResolveSos?.(alert.id)}
                        >
                          <Text style={styles.resolveBtnText}>RESOLVE</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Issue Options */}
            <Text style={styles.sectionLabel}>SELECT EMERGENCY TYPE</Text>
            <View style={styles.optionsGrid}>
              {SOS_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.optCard,
                      isSelected && { borderColor: opt.color, backgroundColor: `${opt.color}15` },
                    ]}
                    onPress={() => setSelectedType(opt.type)}
                  >
                    <Ionicons name={opt.icon} size={20} color={isSelected ? opt.color : '#64748B'} />
                    <Text style={[styles.optText, isSelected && { color: '#F8FAFC', fontWeight: '800' }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note Input */}
            <View style={styles.noteGroup}>
              <Text style={styles.sectionLabel}>ADDITIONAL DETAILS (OPTIONAL)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="e.g. Near milestone 42, waiting under shelter..."
                placeholderTextColor="#475569"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Broadcast Action Button */}
            <TouchableOpacity
              style={styles.broadcastBtn}
              onPress={handleStartCountdown}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="megaphone" size={18} color="#FFFFFF" />
                  <Text style={styles.broadcastBtnText}>START 5-SECOND SOS COUNTDOWN</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0B1120',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  countdownSheet: {
    backgroundColor: '#1E1010',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    borderColor: '#EF4444',
    padding: 28,
    paddingBottom: 44,
    alignItems: 'center',
    gap: 16,
  },
  countdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 4,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  countdownNumber: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
  },
  countdownSecLabel: {
    color: '#FCA5A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  countdownHeading: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  countdownSub: {
    color: '#E2E8F0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  countdownButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  cancelCountdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  cancelCountdownText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sendNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  sendNowText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },
  headerDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  guardianBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  guardianInfo: {
    flex: 1,
  },
  guardianLabel: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guardianName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  guardianActions: {
    flexDirection: 'row',
    gap: 6,
  },
  guardianCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  guardianSmsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  guardianBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  activeAlertsSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  activeAlertsTitle: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  activeAlertCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 8,
  },
  activeAlertInfo: {
    flex: 1,
  },
  activeAlertName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  activeAlertType: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  activeAlertActions: {
    flexDirection: 'row',
    gap: 6,
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  locateBtnText: {
    color: '#090D16',
    fontSize: 10,
    fontWeight: '900',
  },
  resolveBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resolveBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  optionsGrid: {
    gap: 8,
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  optText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  noteGroup: {
    gap: 6,
  },
  noteInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
