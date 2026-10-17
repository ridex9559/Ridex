import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Bike } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { useBikeStore } from '@/store/bikeStore';
import { MotorcycleCategory } from '@/types/motorcycle';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

const POPULAR_BRANDS = [
  'Royal Enfield',
  'KTM',
  'BMW Motorrad',
  'Triumph',
  'Ducati',
  'Kawasaki',
  'Honda',
  'Yamaha',
  'Harley-Davidson',
  'Suzuki',
  'Bajaj',
  'TVS',
];

const CATEGORIES: MotorcycleCategory[] = [
  'ADVENTURE',
  'TOURING',
  'SPORT',
  'NAKED',
  'CRUISER',
  'SUPERMOTO',
  'CAFE_RACER',
  'COMMUTER',
];

export default function AddBikeScreen() {
  const router = useRouter();
  const addMotorcycle = useBikeStore((state) => state.addMotorcycle);

  const [brand, setBrand] = useState('Royal Enfield');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState('2024');
  const [color, setColor] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [displacementCc, setDisplacementCc] = useState('450');
  const [fuelTankCapacityLiters, setFuelTankCapacityLiters] = useState('17');
  const [averageMileageKmpl, setAverageMileageKmpl] = useState('28');
  const [category, setCategory] = useState<MotorcycleCategory>('ADVENTURE');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!brand.trim() || !model.trim()) return;

    setIsLoading(true);
    await addMotorcycle({
      brand: brand.trim(),
      make: brand.trim(),
      model: model.trim(),
      variant: variant.trim() || undefined,
      year: parseInt(year, 10) || 2024,
      color: color.trim() || undefined,
      displacementCc: parseInt(displacementCc, 10) || 450,
      odometerKm: 0,
      registrationNumber: registrationNumber.trim() || undefined,
      fuelTankCapacityLiters: parseFloat(fuelTankCapacityLiters) || 15,
      averageMileageKmpl: parseFloat(averageMileageKmpl) || 25,
      category,
      isPrimary: false,
    });
    setIsLoading(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ADD MOTORCYCLE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Selector */}
          <Text style={styles.label}>SELECT BRAND</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandScroll}
          >
            {POPULAR_BRANDS.map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => setBrand(b)}
                style={[styles.brandChip, brand === b && styles.brandChipActive]}
              >
                <Text
                  style={[styles.brandText, brand === b && styles.brandTextActive]}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Picker */}
          <Text style={styles.label}>MOTORCYCLE CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
              >
                <Text
                  style={[styles.categoryText, category === cat && styles.categoryTextActive]}
                >
                  {cat.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="MODEL NAME *"
              placeholder="e.g. Himalayan 450, Duke 390, Tiger 900"
              value={model}
              onChangeText={setModel}
              leftIcon={<Bike size={18} color={COLORS.primary.DEFAULT} />}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Input
                  label="VARIANT / EDITION"
                  placeholder="e.g. Rally Pro, Standard"
                  value={variant}
                  onChangeText={setVariant}
                />
              </View>
              <View style={{ width: 110 }}>
                <Input
                  label="YEAR"
                  placeholder="2024"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Input
                  label="COLOR"
                  placeholder="e.g. Black / Orange"
                  value={color}
                  onChangeText={setColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="DISPLACEMENT (CC)"
                  placeholder="450"
                  value={displacementCc}
                  onChangeText={setDisplacementCc}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="REGISTRATION NUMBER (OPTIONAL)"
              placeholder="e.g. MH 12 AB 1234"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              autoCapitalize="characters"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Input
                  label="TANK CAPACITY (L)"
                  placeholder="17"
                  value={fuelTankCapacityLiters}
                  onChangeText={setFuelTankCapacityLiters}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="AVG MILEAGE (KM/L)"
                  placeholder="28"
                  value={averageMileageKmpl}
                  onChangeText={setAverageMileageKmpl}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Button
              title="ADD TO MY GARAGE"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={isLoading}
              fullWidth
              rightIcon={<Check size={20} color="#FFFFFF" />}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: SPACING.xs + 2,
  },
  brandScroll: {
    gap: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  brandChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background.surface,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  brandChipActive: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: COLORS.primary.DEFAULT,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  brandTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    gap: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    borderColor: COLORS.primary.DEFAULT,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  categoryTextActive: {
    color: COLORS.primary.DEFAULT,
  },
  form: {
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
  },
});
