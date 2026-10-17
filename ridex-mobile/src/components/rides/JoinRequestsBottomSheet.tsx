import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Check, UserX, ShieldCheck, Bike, Sparkles } from 'lucide-react-native';
import { Avatar, Badge, Button } from '@/components/ui';
import { rideService } from '@/services/rides/RideService';
import { RideParticipant } from '@/types/groupRide';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

interface JoinRequestsBottomSheetProps {
  visible: boolean;
  rideId: string;
  rideTitle?: string;
  onClose: () => void;
  onRequestHandled?: () => void;
}

export const JoinRequestsBottomSheet: React.FC<JoinRequestsBottomSheetProps> = ({
  visible,
  rideId,
  rideTitle,
  onClose,
  onRequestHandled,
}) => {
  const [participants, setParticipants] = useState<RideParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const all = await rideService.getRideParticipants(rideId);
      setParticipants(all.filter((p) => p.approvalStatus === 'PENDING'));
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && rideId) {
      fetchRequests();
    }
  }, [visible, rideId]);

  const handleApprove = async (participant: RideParticipant) => {
    setProcessingId(participant.userId);
    try {
      await rideService.approveJoinRequest(rideId, participant.userId);
      setParticipants((prev) => prev.filter((p) => p.userId !== participant.userId));
      onRequestHandled?.();
    } catch {
      Alert.alert('Error', 'Could not approve request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (participant: RideParticipant) => {
    setProcessingId(participant.userId);
    try {
      await rideService.rejectJoinRequest(rideId, participant.userId);
      setParticipants((prev) => prev.filter((p) => p.userId !== participant.userId));
      onRequestHandled?.();
    } catch {
      Alert.alert('Error', 'Could not decline request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const renderParticipantItem = ({ item }: { item: RideParticipant }) => {
    const isProcessing = processingId === item.userId;
    const riderName = item.user?.name || item.user?.username || 'Rider';
    const bikeInfo = item.motorcycle
      ? `${item.motorcycle.brand} ${item.motorcycle.model}`
      : 'Motorcycle details pending';

    return (
      <View style={styles.requestCard}>
        <View style={styles.riderRow}>
          <Avatar uri={item.user?.avatarUrl} name={riderName} size={44} />
          <View style={styles.riderInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.riderName}>{riderName}</Text>
              <Badge label="PENDING" variant="warning" size="sm" />
            </View>
            <View style={styles.bikeRow}>
              <Bike size={12} color={COLORS.text.muted} />
              <Text style={styles.bikeText}>{bikeInfo}</Text>
            </View>
            {item.user?.city && (
              <Text style={styles.cityText}>📍 {item.user.city}</Text>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isProcessing && styles.disabledBtn]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            <UserX size={15} color="#FF3B30" />
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveBtn, isProcessing && styles.disabledBtn]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#080A0F" />
            ) : (
              <>
                <Check size={16} color="#080A0F" strokeWidth={3} />
                <Text style={styles.approveText}>Approve Rider</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <ShieldCheck size={20} color={COLORS.primary.DEFAULT} />
                <Text style={styles.sheetTitle}>JOIN REQUESTS</Text>
                {participants.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{participants.length}</Text>
                  </View>
                )}
              </View>
              {rideTitle && <Text style={styles.rideSubTitle}>{rideTitle}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* List or Loading or Empty */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : participants.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={28} color={COLORS.text.muted} />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyDesc}>
                There are no pending join requests for this group ride right now.
              </Text>
              <Button
                title="Close"
                onPress={onClose}
                variant="secondary"
                size="sm"
                style={{ marginTop: SPACING.md }}
              />
            </View>
          ) : (
            <FlatList
              data={participants}
              keyExtractor={(item) => item.id || item.userId}
              renderItem={renderParticipantItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
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
  sheetContainer: {
    backgroundColor: COLORS.background.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
    minHeight: 320,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#080A0F',
  },
  rideSubTitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: SPACING.xs,
    gap: SPACING.md,
  },
  requestCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.card,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  riderInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  bikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bikeText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  cityText: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
  },
  rejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3B30',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00E676',
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
  },
  approveText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#080A0F',
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
