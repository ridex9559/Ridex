import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  AlertTriangle,
  Wrench,
  Fuel,
  MapPin,
  HeartPulse,
  Send,
  Disc,
} from 'lucide-react-native';
import { safetyService } from '@/services/safety/SafetyService';
import { HelpCategory } from '@/types/safety';
import { useAuthStore } from '@/store/authStore';
import { Button, Card } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

interface EmergencyHelpModalProps {
  visible: boolean;
  rideId: string;
  currentLatitude?: number;
  currentLongitude?: number;
  onClose: () => void;
  onAlertSent?: () => void;
}

const CATEGORIES: {
  id: HelpCategory;
  title: string;
  desc: string;
  icon: any;
  color: string;
}[] = [
  {
    id: 'FLAT_TYRE',
    title: 'Flat Tyre / Puncture',
    desc: 'Need portable inflator, puncture kit, or tube',
    icon: Disc,
    color: '#FFB020',
  },
  {
    id: 'MECHANICAL',
    title: 'Mechanical Breakdown',
    desc: 'Chain, clutch cable, electrical, or brake issue',
    icon: Wrench,
    color: '#FF6B00',
  },
  {
    id: 'FUEL_EMPTY',
    title: 'Fuel Empty / Running on Reserve',
    desc: 'Need fuel transfer or nearest petrol pump escort',
    icon: Fuel,
    color: '#00E5FF',
  },
  {
    id: 'ASSISTANCE',
    title: 'Need Squad Regroup / Lost Route',
    desc: 'Separated from lead pack, need waypoint guide',
    icon: MapPin,
    color: '#A855F7',
  },
  {
    id: 'EMERGENCY',
    title: 'Medical / Road Emergency',
    desc: 'Crash, injury, or severe emergency assistance',
    icon: HeartPulse,
    color: '#FF3B30',
  },
];

export const EmergencyHelpModal: React.FC<EmergencyHelpModalProps> = ({
  visible,
  rideId,
  currentLatitude = 18.5204,
  currentLongitude = 73.8567,
  onClose,
  onAlertSent,
}) => {
  const user = useAuthStore((s) => s.user);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('FLAT_TYRE');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async () => {
    setIsSending(true);
    try {
      await safetyService.broadcastAlert({
        rideId,
        riderId: user?.id || 'rider-self',
        riderName: user?.name || user?.username || 'Squad Rider',
        riderAvatar: user?.avatarUrl,
        category: selectedCategory,
        message: message.trim() || undefined,
        latitude: currentLatitude,
        longitude: currentLongitude,
      });

      Alert.alert(
        'SOS Broadcast Sent 🚨',
        'Your alert and live GPS location have been broadcast to the Road Captain, Leaders, and all squad riders.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onAlertSent?.();
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Could not send alert. Please check connection.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <AlertTriangle size={22} color="#FF3B30" />
              <View>
                <Text style={styles.title}>SQUAD HELP & SOS</Text>
                <Text style={styles.subTitle}>BROADCAST LIVE ALERT TO ENTIRE SQUAD</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>SELECT ASSISTANCE NEEDED</Text>

          {/* 5 Categories List */}
          <View style={styles.categoriesList}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const IconComp = cat.icon;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && { borderColor: cat.color, backgroundColor: 'rgba(18, 23, 34, 0.95)' },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${cat.color}22` }]}>
                    <IconComp size={18} color={cat.color} />
                  </View>
                  <View style={styles.catInfo}>
                    <Text
                      style={[
                        styles.catTitle,
                        isSelected && { color: cat.color, fontWeight: '900' },
                      ]}
                    >
                      {cat.title}
                    </Text>
                    <Text style={styles.catDesc}>{cat.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Note */}
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Add optional notes (e.g. at HP petrol pump milestone 42)..."
              placeholderTextColor={COLORS.text.muted}
              value={message}
              onChangeText={setMessage}
              maxLength={120}
            />
          </View>

          {/* Submit Button */}
          <Button
            title="BROADCAST TO SQUAD RADAR 🚨"
            onPress={handleBroadcast}
            variant="danger"
            size="lg"
            fullWidth
            loading={isSending}
            rightIcon={<Send size={18} color="#FFFFFF" />}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.background.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 59, 48, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '900',
    color: '#FF3B30',
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  categoriesList: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 1.5,
    borderColor: COLORS.border.card,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
    gap: 2,
  },
  catTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  catDesc: {
    fontSize: 10,
    color: COLORS.text.muted,
  },
  inputBox: {
    backgroundColor: COLORS.background.dark,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  input: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});
