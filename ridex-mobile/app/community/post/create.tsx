import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Send, Image as ImageIcon, MapPin, Bike } from 'lucide-react-native';
import { Card, Avatar, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useBikeStore } from '@/store/bikeStore';
import { communityService } from '@/services/api/community';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function CreatePostScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const activeBike = useBikeStore(state => state.getActiveMotorcycle());

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await communityService.createPost({
        content,
        motorcycleId: activeBike?.id,
      });
      router.back();
    } catch (err) {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHARE TO PACK</Text>
        <Button
          title="POST"
          onPress={handlePost}
          variant="primary"
          size="sm"
          disabled={!content.trim()}
          loading={isSubmitting}
          rightIcon={<Send size={14} color="#FFFFFF" />}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Author & Bike Tag */}
        <View style={styles.authorRow}>
          <Avatar
            uri={user?.avatarUrl}
            name={user?.name || 'Rider'}
            size={46}
          />
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{user?.name || 'Alex Turner'}</Text>
            {activeBike ? (
              <Text style={styles.bikeTag}>
                🏍️ {activeBike.make} {activeBike.model}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Content Input */}
        <TextInput
          placeholder="Share your latest ride, canyon conditions, or route recommendations..."
          placeholderTextColor={COLORS.text.muted}
          value={content}
          onChangeText={setContent}
          multiline
          style={styles.textInput}
          autoFocus
        />

        {/* Attachment Options */}
        <Card variant="glass" style={styles.attachCard}>
          <Text style={styles.attachTitle}>ATTACH TELEMETRY OR MEDIA</Text>
          <View style={styles.attachButtons}>
            <TouchableOpacity style={styles.attachBtn}>
              <ImageIcon size={20} color={COLORS.primary.DEFAULT} />
              <Text style={styles.attachBtnText}>Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachBtn}>
              <MapPin size={20} color={COLORS.accent.telemetryCyan} />
              <Text style={styles.attachBtnText}>Tagged Route</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachBtn}>
              <Bike size={20} color={COLORS.accent.gold} />
              <Text style={styles.attachBtnText}>Bike Specs</Text>
            </TouchableOpacity>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  authorMeta: {
    marginLeft: SPACING.sm,
  },
  authorName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  bikeTag: {
    fontSize: 11,
    color: COLORS.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
  },
  textInput: {
    minHeight: 180,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  attachCard: {
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  attachTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  attachButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.background.surfaceLight,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  attachBtnText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
});
