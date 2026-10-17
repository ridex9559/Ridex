import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Check, ChevronRight, Bike, MapPin, User, ArrowLeft } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useBikeStore } from '@/store/bikeStore';
import { RidingExperienceLevel, RidingInterest } from '@/types/user';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

const RIDING_LEVELS: { id: RidingExperienceLevel; label: string; desc: string }[] = [
  { id: 'BEGINNER', label: 'Beginner', desc: '1-2 years of riding experience' },
  { id: 'INTERMEDIATE', label: 'Intermediate', desc: '3-5 years, comfortable on highways & twisties' },
  { id: 'EXPERIENCED', label: 'Experienced', desc: '5+ years, veteran tourer & squad leader' },
];

const RIDING_INTERESTS: { id: RidingInterest; label: string; icon: string }[] = [
  { id: 'WEEKEND', label: 'Weekend Rides', icon: '⚡' },
  { id: 'TOURING', label: 'Long Distance Touring', icon: '🛣️' },
  { id: 'ADVENTURE', label: 'Adventure & Ghats', icon: '🏔️' },
  { id: 'HIGHWAY', label: 'Highway Cruises', icon: '🏍️' },
  { id: 'MOUNTAIN', label: 'Mountain Passes', icon: '🌲' },
  { id: 'OFF_ROAD', label: 'Off-Road Trails', icon: '🏜️' },
];

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

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { addMotorcycle } = useBikeStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState(user?.name || user?.fullName || 'Pratik');
  const [username, setUsername] = useState(user?.username || 'pratik_rider');
  const [city, setCity] = useState(user?.city || 'Pune');
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80'
  );

  // Step 2: Riding Info
  const [experience, setExperience] = useState<RidingExperienceLevel>('INTERMEDIATE');
  const [interests, setInterests] = useState<RidingInterest[]>(['WEEKEND', 'TOURING', 'ADVENTURE']);

  // Step 3: First Bike
  const [brand, setBrand] = useState('Royal Enfield');
  const [model, setModel] = useState('Himalayan 450');
  const [variant, setVariant] = useState('Kamet White');
  const [year, setYear] = useState('2024');
  const [color, setColor] = useState('White / Black');
  const [regNumber, setRegNumber] = useState('MH 12 AB 9999');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (interest: RidingInterest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);

      // 1. Update user profile
      updateUser({
        name: fullName,
        fullName,
        username: username.startsWith('@') ? username.slice(1) : username,
        city,
        avatarUrl,
        ridingExperience: experience,
        ridingInterests: interests,
        profileSetupCompleted: true,
      });

      // 2. Add first motorcycle to Digital Garage
      await addMotorcycle({
        brand,
        make: brand,
        model,
        variant,
        year: parseInt(year, 10) || 2024,
        color,
        registrationNumber: regNumber,
        category: 'ADVENTURE',
        fuelTankCapacityLiters: 17,
        averageMileageKmpl: 28,
        displacementCc: 452,
        isPrimary: true,
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
      });

      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Profile Setup', err?.message || 'Failed to complete setup. Continuing to Home...');
      router.replace('/(tabs)/home');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Step Indicator */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={() => setStep((s) => (s - 1) as any)} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP {step} OF 3</Text>
        </View>
        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Line */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* =========================================================================
            STEP 1: BASIC INFORMATION
           ========================================================================= */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>WELCOME RIDER 👋</Text>
            <Text style={styles.stepSubtitle}>Let's set up your RIDEX identity.</Text>

            {/* Profile Photo Picker */}
            <View style={styles.photoContainer}>
              <View style={styles.photoWrap}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                <TouchableOpacity
                  style={styles.photoEditBadge}
                  onPress={() => {
                    // Cycle sample avatar for fast preview
                    const avatars = [
                      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
                    ];
                    const next = avatars[(avatars.indexOf(avatarUrl) + 1) % avatars.length];
                    setAvatarUrl(next);
                  }}
                >
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.photoHint}>Tap camera icon to change photo</Text>
            </View>

            <Input
              label="FULL NAME"
              placeholder="e.g. Pratik Sharma"
              value={fullName}
              onChangeText={setFullName}
              leftIcon={<User size={18} color={COLORS.text.secondary} />}
            />

            <Input
              label="RIDER USERNAME"
              placeholder="e.g. pratik_rider"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Input
              label="HOME CITY"
              placeholder="e.g. Pune, Maharashtra"
              value={city}
              onChangeText={setCity}
              leftIcon={<MapPin size={18} color={COLORS.primary.DEFAULT} />}
            />

            <Button
              title="CONTINUE TO RIDING INFO"
              onPress={() => setStep(2)}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ChevronRight size={20} color="#FFFFFF" />}
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        )}

        {/* =========================================================================
            STEP 2: RIDING INFORMATION
           ========================================================================= */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>RIDING PROFILE 🏍️</Text>
            <Text style={styles.stepSubtitle}>Tell us about your saddle experience.</Text>

            <Text style={styles.fieldSectionLabel}>RIDING EXPERIENCE</Text>
            <View style={styles.levelsList}>
              {RIDING_LEVELS.map((lvl) => {
                const isSelected = experience === lvl.id;
                return (
                  <TouchableOpacity
                    key={lvl.id}
                    style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                    onPress={() => setExperience(lvl.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                        {lvl.label}
                      </Text>
                      <Text style={styles.levelDesc}>{lvl.desc}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldSectionLabel, { marginTop: SPACING.lg }]}>
              RIDING INTERESTS (SELECT ALL THAT APPLY)
            </Text>
            <View style={styles.interestsGrid}>
              {RIDING_INTERESTS.map((int) => {
                const isSelected = interests.includes(int.id);
                return (
                  <TouchableOpacity
                    key={int.id}
                    style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                    onPress={() => toggleInterest(int.id)}
                  >
                    <Text style={styles.interestIcon}>{int.icon}</Text>
                    <Text
                      style={[
                        styles.interestText,
                        isSelected && styles.interestTextSelected,
                      ]}
                    >
                      {int.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="CONTINUE TO ADD BIKE"
              onPress={() => setStep(3)}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ChevronRight size={20} color="#FFFFFF" />}
              style={{ marginTop: SPACING.xl }}
            />
          </View>
        )}

        {/* =========================================================================
            STEP 3: ADD FIRST BIKE TO GARAGE
           ========================================================================= */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>ADD YOUR MACHINE 🏍️</Text>
            <Text style={styles.stepSubtitle}>
              Every rider has a steed. Add your first bike to My Garage.
            </Text>

            {/* Brand Carousel Selector */}
            <Text style={styles.fieldSectionLabel}>MOTORCYCLE BRAND</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandScroll}
            >
              {POPULAR_BRANDS.map((b) => {
                const isSelected = brand === b;
                return (
                  <TouchableOpacity
                    key={b}
                    style={[styles.brandChip, isSelected && styles.brandChipSelected]}
                    onPress={() => setBrand(b)}
                  >
                    <Text style={[styles.brandText, isSelected && styles.brandTextSelected]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Input
              label="MODEL"
              placeholder="e.g. Himalayan 450, Duke 390, Tiger 900"
              value={model}
              onChangeText={setModel}
              leftIcon={<Bike size={18} color={COLORS.primary.DEFAULT} />}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Input
                  label="VARIANT / COLOR"
                  placeholder="e.g. Kamet White"
                  value={variant}
                  onChangeText={setVariant}
                />
              </View>
              <View style={{ width: 100 }}>
                <Input
                  label="YEAR"
                  placeholder="2024"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="REGISTRATION NUMBER (OPTIONAL)"
              placeholder="e.g. MH 12 AB 1234"
              value={regNumber}
              onChangeText={setRegNumber}
              autoCapitalize="characters"
            />

            <Button
              title="COMPLETE SETUP & ENTER RIDEX"
              onPress={handleFinish}
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              leftIcon={<Check size={20} color="#FFFFFF" />}
              style={{ marginTop: SPACING.xl }}
            />
          </View>
        )}
      </ScrollView>
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
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1.2,
  },
  skipBtn: {
    padding: SPACING.xs,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border.subtle,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary.DEFAULT,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  photoWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary.DEFAULT,
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.dark,
  },
  photoHint: {
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: 8,
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  levelsList: {
    gap: SPACING.sm,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  levelCardSelected: {
    borderColor: COLORS.primary.DEFAULT,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  levelLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  levelLabelSelected: {
    color: COLORS.primary.DEFAULT,
  },
  levelDesc: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: COLORS.primary.DEFAULT,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    gap: 6,
  },
  interestChipSelected: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderColor: COLORS.primary.DEFAULT,
  },
  interestIcon: {
    fontSize: 14,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  interestTextSelected: {
    color: COLORS.primary.DEFAULT,
  },
  brandScroll: {
    gap: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  brandChip: {
    backgroundColor: COLORS.background.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  brandChipSelected: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: COLORS.primary.DEFAULT,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.secondary,
  },
  brandTextSelected: {
    color: '#FFFFFF',
  },
  rowInputs: {
    flexDirection: 'row',
  },
});
