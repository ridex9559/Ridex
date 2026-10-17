import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';
import { TYPOGRAPHY } from '@/theme/typography';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ visible, onClose, title, children }) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.contentContainer}>
          <View style={styles.dragHandle} />

          {title ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeBtn}
              >
                <X size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.body}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  contentContainer: {
    backgroundColor: COLORS.background.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border.subtle,
    maxHeight: '85%',
    paddingBottom: SPACING.xxl,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.background.surfaceLight,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  body: {
    padding: SPACING.lg,
  },
});
