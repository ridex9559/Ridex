import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Link2, Search, Check, Calendar, Users, MapPin, ArrowRight } from 'lucide-react-native';
import { Button, Card, Badge, Avatar } from '@/components/ui';
import { rideService } from '@/services/rides/RideService';
import { RideEvent } from '@/types/groupRide';
import { useAuthStore } from '@/store/authStore';
import { useBikeStore } from '@/store/bikeStore';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

interface JoinRideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const JoinRideModal: React.FC<JoinRideModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeBike = useBikeStore((s) => s.getActiveMotorcycle());

  const [inputCode, setInputCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundRide, setFoundRide] = useState<RideEvent | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const handleInputChange = (text: string) => {
    setErrorText(null);
    setFoundRide(null);
    setHasRequested(false);

    // Automatically convert to uppercase
    const upper = text.toUpperCase();
    setInputCode(upper);
  };

  const handleSearch = async () => {
    if (!inputCode.trim()) return;

    setIsSearching(true);
    setErrorText(null);
    setFoundRide(null);

    try {
      const ride = await rideService.getRideByCode(inputCode);
      if (ride) {
        setFoundRide(ride);
      } else {
        setErrorText('No active group ride found for this ID. Please verify the code.');
      }
    } catch {
      setErrorText('Error searching for ride. Please check network.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!foundRide) return;

    setIsRequesting(true);
    try {
      await rideService.requestToJoinRide(
        foundRide.id,
        {
          id: user?.id || `rider-${Date.now()}`,
          name: user?.name || 'Rider',
          username: user?.username || 'rider',
          avatarUrl: user?.avatarUrl,
        },
        activeBike ? { model: activeBike.model, engineCc: activeBike.displacementCc } : undefined
      );

      setHasRequested(true);
      Alert.alert(
        'Request Sent! 🏍️',
        `Your request to join "${foundRide.title}" has been sent to the ride organizer. You will be notified once approved!`,
        [
          {
            text: 'View Ride Lobby',
            onPress: () => {
              onClose();
              router.push(`/rides/${foundRide.id}` as any);
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Could not send join request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalSheet}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleBox}>
              <Link2 size={18} color={COLORS.primary.DEFAULT} />
              <Text style={styles.sheetTitle}>JOIN WITH RIDE ID</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hintText}>
            Enter the 6-character Ride ID (e.g. RIDEX-7X92K) shared by your ride organizer.
          </Text>

          {/* Ride ID Input Box */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="RIDEX-XXXXX"
              placeholderTextColor={COLORS.text.muted}
              value={inputCode}
              onChangeText={handleInputChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
              disabled={isSearching || !inputCode.trim()}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Search size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {errorText && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          )}

          {/* Found Ride Preview Card */}
          {foundRide && (
            <Card variant="glass" style={styles.foundCard}>
              <View style={styles.foundHeader}>
                <Badge label={foundRide.category} variant="primary" size="sm" />
                <Text style={styles.foundDistance}>{foundRide.estimatedDistanceKm} KM</Text>
              </View>

              <Text style={styles.foundTitle}>{foundRide.title}</Text>
              <Text style={styles.foundRoute}>
                📍 {foundRide.startLocation.name} → {foundRide.destination.name}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Calendar size={13} color={COLORS.text.muted} />
                  <Text style={styles.metaText}>{foundRide.meetingTime || '06:00 AM'}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Users size={13} color={COLORS.primary.DEFAULT} />
                  <Text style={styles.metaText}>
                    {foundRide.currentParticipantCount} / {foundRide.maxParticipants || '∞'} Riders
                  </Text>
                </View>
              </View>

              {foundRide.organizer && (
                <View style={styles.organizerRow}>
                  <Avatar uri={foundRide.organizer.avatarUrl} name={foundRide.organizer.name} size={32} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.organizerLabel}>ORGANIZER</Text>
                    <Text style={styles.organizerName}>{foundRide.organizer.name}</Text>
                  </View>
                </View>
              )}

              <Button
                title={hasRequested ? 'REQUEST PENDING APPROVAL' : 'REQUEST TO JOIN SQUAD'}
                onPress={handleRequestJoin}
                variant={hasRequested ? 'secondary' : 'primary'}
                size="md"
                fullWidth
                loading={isRequesting}
                rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
                style={{ marginTop: SPACING.md }}
              />
            </Card>
          )}
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
  modalSheet: {
    backgroundColor: COLORS.background.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  sheetHeader: {
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
  sheetTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
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
  inputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  codeInput: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
    borderWidth: 1.5,
    borderColor: COLORS.border.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  searchBtn: {
    width: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    textAlign: 'center',
  },
  foundCard: {
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.35)',
  },
  foundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foundDistance: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.secondary,
  },
  foundTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '900',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  foundRoute: {
    fontSize: 11,
    color: '#00E5FF',
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    marginBottom: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  organizerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
  },
  organizerName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
});
