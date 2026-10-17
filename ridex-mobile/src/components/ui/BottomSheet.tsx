import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  title,
  onClose,
  children,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.handleBar} />
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                    <X size={18} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.content}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.background.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.card,
    paddingBottom: SPACING.xl,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.background.surfaceLight,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.md,
  },
});
