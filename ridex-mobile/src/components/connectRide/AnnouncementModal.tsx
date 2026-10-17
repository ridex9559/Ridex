import React, { useState } from 'react';
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
import { AnnouncementType, RideAnnouncement } from '../../types/connectRide';

interface AnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onBroadcast: (message: string, type: AnnouncementType) => Promise<void>;
  latestAnnouncement?: RideAnnouncement | null;
}

const QUICK_PRESETS = [
  { message: 'Regrouping at the next fuel stop.', type: 'STOP' as const },
  { message: 'Stopping for breakfast for 30 minutes.', type: 'STOP' as const },
  { message: 'Caution: Road work / gravel ahead.', type: 'HAZARD' as const },
  { message: 'Pace check: maintain 60 km/h cruising speed.', type: 'GENERAL' as const },
];

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  visible,
  onClose,
  onBroadcast,
}) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await onBroadcast(message.trim(), type);
      setMessage('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = (preset: { message: string; type: AnnouncementType }) => {
    setMessage(preset.message);
    setType(preset.type);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.annIconBox}>
                <Ionicons name="megaphone" size={18} color="#06B6D4" />
              </View>
              <Text style={styles.headerTitle}>SQUAD BROADCAST</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerDesc}>
            Send instant visual briefings to all connected squad members.
          </Text>

          {/* Quick Presets */}
          <Text style={styles.sectionLabel}>QUICK BRIEFINGS</Text>
          <View style={styles.presetList}>
            {QUICK_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.message}
                style={styles.presetChip}
                onPress={() => handleSelectPreset(p)}
              >
                <Text style={styles.presetText} numberOfLines={1}>
                  "{p.message}"
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.sectionLabel}>CUSTOM MESSAGE</Text>
            <TextInput
              style={styles.input}
              placeholder="Type message for the squad..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              value={message}
              onChangeText={setMessage}
            />
          </View>

          {/* Broadcast Action */}
          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#090D16" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={16} color="#090D16" />
                <Text style={styles.sendBtnText}>BROADCAST TO SQUAD</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  annIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
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
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  presetList: {
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  presetText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    height: 70,
    textAlignVertical: 'top',
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
  },
  sendBtnText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
