/**
 * Logout Confirmation Modal
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Modal, Button } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
}) => {
  return (
    <Modal visible={visible} onClose={onClose} title="SIGN OUT?">
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <LogOut size={28} color={COLORS.status.error} />
        </View>

        <Text style={styles.message}>
          Are you sure you want to sign out of RIDEX? Your local rides and offline data will remain safe.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={onClose}
            style={styles.cancelBtn}
            disabled={loading}
          />
          <Button
            title="Sign Out"
            variant="danger"
            onPress={onConfirm}
            loading={loading}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});

export default SignOutModal;
