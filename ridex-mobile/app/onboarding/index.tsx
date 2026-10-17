import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bike, MapPin, Mic, ArrowRight, Check } from 'lucide-react-native';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: (color: string) => React.ReactNode;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    id: '1',
    badge: 'MOTORCYCLE COMMUNITY',
    title: 'RIDE TOGETHER',
    subtitle: 'Discover, host, and organize unforgettable motorcycle group rides with your crew.',
    icon: (color) => <Bike size={58} color={color} strokeWidth={2.2} />,
  },
  {
    id: '2',
    badge: 'LIVE SQUAD RADAR',
    title: 'STAY CONNECTED',
    subtitle: 'See your fellow riders on a shared live map with live GPS tracking and separation detection.',
    icon: (color) => <MapPin size={58} color={color} strokeWidth={2.2} />,
  },
  {
    id: '3',
    badge: 'RIDEX INTERCOM',
    title: 'TALK TOGETHER',
    subtitle: 'Stay connected throughout the journey with real-time push-to-talk group voice communication.',
    icon: (color) => <Mic size={58} color={color} strokeWidth={2.2} />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboardingCompleted = useAppStore(state => state.setOnboardingCompleted);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    await setOnboardingCompleted(true);
    router.replace('/auth/login');
  };

  const isLast = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Brand Badge & Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>RIDEX</Text>
        </View>

        {!isLast && (
          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconCircle}>
              {item.icon(COLORS.primary.DEFAULT)}
            </View>

            <View style={styles.slideBadge}>
              <Text style={styles.slideBadgeText}>{item.badge}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Button
          title={isLast ? 'GET STARTED' : 'CONTINUE'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={
            isLast ? (
              <Check size={20} color="#FFFFFF" />
            ) : (
              <ArrowRight size={20} color="#FFFFFF" />
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  brandBadge: {
    backgroundColor: COLORS.background.surfaceLight,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  brandText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 2,
  },
  skipBtn: {
    padding: SPACING.xs,
  },
  skipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.text.secondary,
    letterSpacing: 1.5,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.background.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary.DEFAULT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  slideBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    marginBottom: SPACING.md,
  },
  slideBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.background.surfaceLight,
  },
  dotActive: {
    width: 28,
    backgroundColor: COLORS.primary.DEFAULT,
  },
});
