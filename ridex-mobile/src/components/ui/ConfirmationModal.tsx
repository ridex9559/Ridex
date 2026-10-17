import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDestructive ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 107, 0, 0.15)' },
            ]}
          >
            {isDestructive ? (
              <AlertTriangle size={24} color="#FF3B30" />
            ) : (
              <Info size={24} color={COLORS.primary.DEFAULT} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: isDestructive ? '#FF3B30' : COLORS.primary.DEFAULT },
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.background.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.card,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
