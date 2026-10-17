import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { X, Bike, Check, Radio, Shield, Sparkles } from 'lucide-react-native';
import { useBikeStore } from '@/store/bikeStore';
import { Motorcycle } from '@/types/motorcycle';
import { Button, Card, Badge } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

interface StartRideModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmStart: (selectedBike: Motorcycle) => void;
}

export const StartRideModal: React.FC<StartRideModalProps> = ({
  visible,
  onClose,
  onConfirmStart,
}) => {
  const { motorcycles, activeMotorcycleId } = useBikeStore();
  const [selectedId, setSelectedId] = useState<string>(
    activeMotorcycleId || (motorcycles.length > 0 ? motorcycles[0].id : 'default-bike')
  );

  const fallbackBikes: Motorcycle[] = [
    {
      id: 'default-bike',
      userId: 'self',
      brand: 'Royal Enfield',
      model: 'Himalayan 450',
      variant: 'Kamet White',
      year: 2024,
      color: 'White',
      isPrimary: true,
      displacementCc: 452,
      fuelTankCapacityLiters: 17,
      averageMileageKmpl: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const bikeList = motorcycles.length > 0 ? motorcycles : fallbackBikes;
  const currentSelected =
    bikeList.find((b) => b.id === selectedId) || bikeList[0];

  const handleStart = () => {
    onConfirmStart(currentSelected);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Bike size={20} color={COLORS.primary.DEFAULT} />
              <View>
                <Text style={styles.title}>START MY RIDE</Text>
                <Text style={styles.subTitle}>SELECT YOUR MOTORCYCLE FOR THIS RIDE</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hintText}>
            Select the motorcycle from your garage that you are taking on this group ride:
          </Text>

          {/* Motorcycle List */}
          <ScrollView
            style={styles.bikeList}
            contentContainerStyle={styles.bikeListScroll}
            showsVerticalScrollIndicator={false}
          >
            {bikeList.map((bike) => {
              const isSelected = bike.id === selectedId;

              return (
                <TouchableOpacity
                  key={bike.id}
                  style={[
                    styles.bikeCard,
                    isSelected && styles.bikeCardSelected,
                  ]}
                  onPress={() => setSelectedId(bike.id)}
                >
                  <View style={styles.bikeIconBox}>
                    <Bike
                      size={24}
                      color={isSelected ? COLORS.primary.DEFAULT : COLORS.text.secondary}
                    />
                  </View>

                  <View style={styles.bikeInfo}>
                    <View style={styles.bikeTitleRow}>
                      <Text style={styles.bikeName}>
                        {bike.brand} {bike.model}
                      </Text>
                      {bike.isPrimary && (
                        <Badge label="GARAGE PRIMARY" variant="primary" size="sm" />
                      )}
                    </View>
                    <Text style={styles.bikeVariant}>
                      {bike.variant || `${bike.year} Edition`} • {bike.displacementCc || 400}cc
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Safety Reassurance */}
          <View style={styles.safetyPill}>
            <Shield size={14} color="#00E676" />
            <Text style={styles.safetyText}>
              Your live location will only be shared with approved squad members.
            </Text>
          </View>

          {/* Start Button */}
          <Button
            title="CONFIRM & START MY RIDE 🏍️"
            onPress={handleStart}
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<Radio size={18} color="#FFFFFF" />}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.background.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
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
  hintText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  bikeList: {
    maxHeight: 220,
    marginBottom: SPACING.sm,
  },
  bikeListScroll: {
    gap: 8,
  },
  bikeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border.card,
    gap: 12,
  },
  bikeCardSelected: {
    borderColor: COLORS.primary.DEFAULT,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  bikeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeInfo: {
    flex: 1,
    gap: 2,
  },
  bikeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bikeName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  bikeVariant: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.primary.DEFAULT,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary.DEFAULT,
  },
  safetyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    gap: 8,
    marginTop: SPACING.xs,
  },
  safetyText: {
    fontSize: 11,
    color: '#00E676',
    fontWeight: '600',
    flex: 1,
  },
});
