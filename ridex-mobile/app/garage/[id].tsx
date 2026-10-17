import React from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trash2, CheckCircle2, Shield, Fuel, Gauge, Calendar, Palette, Bike } from 'lucide-react-native';
import { Button, Card, Badge } from '@/components/ui';
import { useBikeStore } from '@/store/bikeStore';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function BikeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { motorcycles, activeMotorcycleId, setActiveMotorcycle, deleteMotorcycle } = useBikeStore();

  const bike = motorcycles.find((b) => b.id === id) || motorcycles[0];

  if (!bike) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MOTORCYCLE NOT FOUND</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
    );
  }

  const isPrimary = bike.id === activeMotorcycleId;

  const handleDelete = () => {
    Alert.alert(
      'Remove Motorcycle',
      `Are you sure you want to remove ${bike.brand || bike.make} ${bike.model} from your garage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteMotorcycle(bike.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleMakePrimary = async () => {
    await setActiveMotorcycle(bike.id);
    Alert.alert('Primary Steed', `${bike.model} is now your active motorcycle for rides.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MOTORCYCLE DETAILS</Text>
        <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, styles.deleteBtn]}>
          <Trash2 size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bike Photo Hero */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                bike.imageUrl ||
                bike.image ||
                'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
            }}
            style={styles.heroImage}
          />
          <View style={styles.imageOverlay} />
          <View style={styles.badgeRow}>
            <Badge label={bike.category || 'ADVENTURE'} variant="primary" size="sm" />
            {isPrimary ? (
              <Badge label="PRIMARY BIKE" variant="outline" size="sm" />
            ) : null}
          </View>
        </View>

        {/* Title Header */}
        <View style={styles.titleSection}>
          <Text style={styles.brandSubtitle}>{(bike.brand || bike.make || 'Royal Enfield').toUpperCase()}</Text>
          <Text style={styles.bikeTitle}>{bike.model}</Text>
          {bike.variant ? <Text style={styles.variantText}>Edition: {bike.variant}</Text> : null}
          {bike.registrationNumber ? (
            <View style={styles.regBadge}>
              <Text style={styles.regText}>{bike.registrationNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* Primary Selection Action */}
        {!isPrimary ? (
          <Button
            title="SET AS PRIMARY RIDE MACHINE"
            onPress={handleMakePrimary}
            variant="outline"
            size="md"
            fullWidth
            leftIcon={<CheckCircle2 size={18} color={COLORS.primary.DEFAULT} />}
            style={{ marginBottom: SPACING.md }}
          />
        ) : null}

        {/* Specs Grid */}
        <Text style={styles.sectionHeading}>MACHINE SPECIFICATIONS</Text>
        <View style={styles.specsGrid}>
          <Card variant="glass" style={styles.specCard}>
            <Calendar size={18} color={COLORS.primary.DEFAULT} />
            <Text style={styles.specLabel}>MODEL YEAR</Text>
            <Text style={styles.specVal}>{bike.year || 2024}</Text>
          </Card>

          <Card variant="glass" style={styles.specCard}>
            <Gauge size={18} color="#00E5FF" />
            <Text style={styles.specLabel}>DISPLACEMENT</Text>
            <Text style={styles.specVal}>{bike.displacementCc || 450} CC</Text>
          </Card>

          <Card variant="glass" style={styles.specCard}>
            <Fuel size={18} color="#FFB020" />
            <Text style={styles.specLabel}>TANK CAPACITY</Text>
            <Text style={styles.specVal}>{bike.fuelTankCapacityLiters || 17} L</Text>
          </Card>

          <Card variant="glass" style={styles.specCard}>
            <Palette size={18} color="#00E676" />
            <Text style={styles.specLabel}>COLOR</Text>
            <Text style={styles.specVal}>{bike.color || 'Standard'}</Text>
          </Card>
        </View>

        {/* Document Validity */}
        <Text style={[styles.sectionHeading, { marginTop: SPACING.lg }]}>DOCUMENTATION</Text>
        <Card variant="glass" style={styles.docCard}>
          <View style={styles.docRow}>
            <Shield size={18} color="#00E676" />
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>Insurance Policy</Text>
              <Text style={styles.docSub}>Valid until {bike.insuranceExpiryDate || '2027-03-15'}</Text>
            </View>
            <Badge label="ACTIVE" variant="outline" size="sm" />
          </View>
        </Card>
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
  deleteBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 10, 15, 0.35)',
  },
  badgeRow: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  bikeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text.primary,
  },
  variantText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  regBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  regText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 1,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: SPACING.md,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    marginTop: SPACING.xs,
    marginBottom: 2,
  },
  specVal: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  docCard: {
    padding: SPACING.md,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  docTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  docSub: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});
