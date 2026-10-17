import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Mic,
  MicOff,
  Radio,
  Volume2,
  Wifi,
  WifiOff,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  VolumeX,
} from 'lucide-react-native';
import { voiceService } from '@/services/voice/VoiceService';
import { VoiceChannel } from '@/types/voice';
import { useAuthStore } from '@/store/authStore';
import { Avatar, Badge } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

interface IntercomBottomSheetProps {
  visible: boolean;
  rideId?: string;
  rideTitle?: string;
  onClose: () => void;
}

export const IntercomBottomSheet: React.FC<IntercomBottomSheetProps> = ({
  visible,
  rideId = 'ride-live',
  rideTitle = 'Group Ride',
  onClose,
}) => {
  const user = useAuthStore((s) => s.user);
  const [channel, setChannel] = useState<VoiceChannel>(voiceService.getChannel());
  const [isPressing, setIsPressing] = useState(false);
  const [isAudioActivated, setIsAudioActivated] = useState(
    Platform.OS !== 'web' || voiceService.isAudioUnlocked()
  );
  const [isActivating, setIsActivating] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  const isWeb = Platform.OS === 'web';
  const isHttps = voiceService.isHttpsContext();
  const isHardwareVoiceSupported = voiceService.isVoiceHardwareSupported();

  useEffect(() => {
    if (!visible) return;

    if (user) {
      voiceService.connectToRideVoice(
        rideId,
        user.id,
        user.name || user.username || 'Rider',
        'RIDER'
      );
    }

    const unsub = voiceService.subscribe((updated) => {
      setChannel(updated);
    });

    return () => {
      unsub();
    };
  }, [visible, rideId, user]);

  const handleActivateAudioAndMic = async () => {
    setIsActivating(true);
    try {
      await voiceService.unlockAudioContext();
      await voiceService.requestMicrophonePermission();
      setIsAudioActivated(true);
    } finally {
      setIsActivating(false);
    }
  };

  const handlePressIn = async () => {
    if (!isHardwareVoiceSupported || channel.isMuted || channel.state === 'ERROR' || channel.state === 'CONNECTING') return;

    // Ensure Web Audio is unlocked on first touch
    if (isWeb && !isAudioActivated) {
      await voiceService.unlockAudioContext();
      setIsAudioActivated(true);
    }

    setIsPressing(true);
    voiceService.startTransmitting(user?.id || 'self', user?.name || user?.username || 'You');

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  };

  const handlePressOut = () => {
    setIsPressing(false);
    voiceService.stopTransmitting();
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleToggleMute = () => {
    voiceService.toggleMute();
  };

  const handleRetry = () => {
    if (user) {
      voiceService.connectToRideVoice(
        rideId,
        user.id,
        user.name || user.username || 'Rider',
        'RIDER'
      );
    }
  };

  const isTransmitting = channel.state === 'TRANSMITTING';
  const isReceiving = channel.state === 'RECEIVING';
  const isConnecting = channel.state === 'CONNECTING';
  const isError = channel.state === 'ERROR';
  const isMuted = channel.isMuted;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Radio size={20} color={COLORS.primary.DEFAULT} />
              <View>
                <Text style={styles.title}>RIDE VOICE INTERCOM</Text>
                <Text style={styles.subTitle} numberOfLines={1}>
                  {rideTitle} •{' '}
                  {isConnecting ? 'CONNECTING...' : `🟢 CONNECTED • ${channel.participantsCount} RIDERS`}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleToggleMute}
                style={[styles.muteBtn, isMuted && styles.mutedBtnActive]}
                disabled={isConnecting || isError || !isHardwareVoiceSupported}
              >
                {isMuted ? (
                  <MicOff size={16} color="#FF3B30" />
                ) : (
                  <Mic size={16} color={COLORS.text.primary} />
                )}
                <Text style={[styles.muteBtnText, isMuted && { color: '#FF3B30' }]}>
                  {isMuted ? 'UNMUTE' : 'MUTE'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Native Missing Hardware Module Banner (e.g. Expo Go) */}
          {!isWeb && !isHardwareVoiceSupported && (
            <View style={styles.warningBox}>
              <AlertTriangle size={18} color="#FFB020" />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>⚠️ Development Build Required for Voice</Text>
                <Text style={styles.warningSub}>
                  Voice intercom requires the RIDEX development build (custom native audio module). Live map, GPS radar, squad separation, and chat remain 100% active.
                </Text>
              </View>
            </View>
          )}

          {/* iOS Web Insecure HTTP Warning Banner */}
          {isWeb && !isHttps && (
            <View style={styles.warningBox}>
              <Lock size={18} color="#FFB020" />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>⚠️ Insecure Context Detected</Text>
                <Text style={styles.warningSub}>
                  iPhone Safari/Chrome blocks microphone access on plain HTTP. Please open the Expo
                  Tunnel URL (https://...) on your iPhone to enable voice intercom.
                </Text>
              </View>
            </View>
          )}

          {/* Web / iOS One-Tap Audio & Mic Unlock Banner */}
          {isWeb && !isAudioActivated && isHttps && (
            <TouchableOpacity
              style={styles.activateAudioBox}
              onPress={handleActivateAudioAndMic}
              disabled={isActivating}
            >
              {isActivating ? (
                <ActivityIndicator size="small" color="#080B12" />
              ) : (
                <Sparkles size={18} color="#080B12" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.activateAudioTitle}>
                  {isActivating ? 'ACTIVATING HARDWARE...' : '⚡ TAP TO ACTIVATE SQUAD AUDIO & MIC'}
                </Text>
                <Text style={styles.activateAudioSub}>
                  Enables iPhone speaker playback and prompts browser microphone permission
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Connection Error Fallback Card */}
          {isError ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={20} color="#FF3B30" />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>⚠️ Voice connection unavailable</Text>
                <Text style={styles.errorSub}>
                  Check your internet connection. Voice intercom requires network connectivity.
                </Text>
              </View>
              <TouchableOpacity style={styles.errorRetryBtn} onPress={handleRetry}>
                <RotateCcw size={14} color="#080B12" />
                <Text style={styles.errorRetryText}>RETRY</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Active Speaker Status Bar */
            <View
              style={[
                styles.speakerStatusBox,
                isTransmitting && styles.transmittingBox,
                isReceiving && styles.receivingBox,
                isMuted && styles.mutedBox,
              ]}
            >
              {isConnecting ? (
                <>
                  <ActivityIndicator size="small" color="#00E5FF" />
                  <Text style={styles.channelStandbyText}>Connecting to squad frequency...</Text>
                </>
              ) : isTransmitting ? (
                <>
                  <View style={[styles.liveDot, { backgroundColor: '#FF6B00' }]} />
                  <Text style={styles.transmittingText}>🎙️ TRANSMITTING AUDIO TO SQUAD...</Text>
                </>
              ) : isReceiving ? (
                <>
                  <Volume2 size={16} color="#00E676" />
                  <Text style={styles.receivingText}>
                    🔊 {channel.activeSpeaker?.name || 'Rider'} is speaking...
                  </Text>
                </>
              ) : isMuted ? (
                <>
                  <MicOff size={16} color="#FF3B30" />
                  <Text style={styles.mutedText}>🔇 Microphone muted. Tap Unmute to talk.</Text>
                </>
              ) : (
                <>
                  <Wifi size={14} color="#00E676" />
                  <Text style={styles.channelStandbyText}>
                    Frequency clear • Hold button below to speak
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Massive Push-To-Talk Button */}
          <View style={styles.pttContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!isHardwareVoiceSupported || isMuted || isError || isConnecting}
                style={[
                  styles.pttButton,
                  isPressing && styles.pttButtonPressed,
                  (!isHardwareVoiceSupported || isMuted || isError || isConnecting) && styles.pttButtonMuted,
                ]}
              >
                <View style={styles.pttInner}>
                  <Mic
                    size={36}
                    color={!isHardwareVoiceSupported || isMuted || isError ? '#64748B' : isPressing ? '#080A0F' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.pttText,
                      isPressing && { color: '#080A0F' },
                      (!isHardwareVoiceSupported || isMuted || isError) && { color: '#64748B' },
                    ]}
                  >
                    {!isHardwareVoiceSupported
                      ? 'DEV BUILD REQ'
                      : isPressing
                      ? 'TRANSMITTING'
                      : 'HOLD TO TALK'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.pttHelpText}>
              {!isHardwareVoiceSupported
                ? 'Voice intercom requires RIDEX development build'
                : isPressing
                ? 'Release when done talking'
                : 'Push-to-Talk • Press and hold while speaking'}
            </Text>
          </View>

          {/* Squad Participants Roster */}
          <View style={styles.rosterSection}>
            <View style={styles.rosterHeader}>
              <View style={styles.rosterHeaderLeft}>
                <Users size={14} color={COLORS.text.secondary} />
                <Text style={styles.rosterTitle}>SQUAD IN VOICE ROOM</Text>
              </View>
              <Text style={styles.rosterCount}>{channel.participants.length} Online</Text>
            </View>

            <ScrollView
              style={styles.rosterList}
              contentContainerStyle={styles.rosterScroll}
              showsVerticalScrollIndicator={false}
            >
              {channel.participants.map((participant) => (
                <View key={participant.userId} style={styles.participantRow}>
                  <Avatar uri={participant.avatarUrl} name={participant.name} size={30} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantRole}>
                      {participant.role === 'ORGANIZER'
                        ? '👑 ORGANIZER'
                        : participant.role === 'LEADER'
                        ? '⭐ RIDE LEADER'
                        : '🏍️ RIDER'}
                    </Text>
                  </View>

                  {participant.isTalking ? (
                    <Badge label="TALKING" variant="success" size="sm" />
                  ) : participant.isMuted ? (
                    <View style={styles.signalWrap}>
                      <MicOff size={12} color="#94A3B8" />
                      <Text style={[styles.signalText, { color: '#94A3B8' }]}>MUTED</Text>
                    </View>
                  ) : (
                    <View style={styles.signalWrap}>
                      <Wifi size={12} color="#00E676" />
                      <Text style={styles.signalText}>ONLINE</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
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
    backgroundColor: '#111722',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171E2B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mutedBtnActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  muteBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#171E2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.4)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    gap: 10,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFB020',
  },
  warningSub: {
    fontSize: 10,
    color: '#F8FAFC',
    marginTop: 2,
    lineHeight: 14,
  },
  activateAudioBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5FF',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    gap: 10,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  activateAudioTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#080B12',
    letterSpacing: 0.5,
  },
  activateAudioSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#0B2027',
    marginTop: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    gap: 10,
  },
  errorTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B30',
  },
  errorSub: {
    fontSize: 10,
    color: '#F8FAFC',
    marginTop: 2,
    lineHeight: 14,
  },
  errorRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  errorRetryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#080B12',
  },
  speakerStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080B12',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  transmittingBox: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderColor: '#FF6B00',
  },
  receivingBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  mutedBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: '#FF3B30',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transmittingText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  receivingText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00E676',
    letterSpacing: 0.5,
  },
  mutedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
  },
  channelStandbyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  pttContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  pttButton: {
    width: 135,
    height: 135,
    borderRadius: 68,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FF8533',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  pttButtonPressed: {
    backgroundColor: '#00E676',
    borderColor: '#69F0AE',
    shadowColor: '#00E676',
  },
  pttButtonMuted: {
    backgroundColor: '#171E2B',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  pttInner: {
    alignItems: 'center',
    gap: 6,
  },
  pttText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pttHelpText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: SPACING.md,
  },
  rosterSection: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
    paddingTop: SPACING.md,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rosterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rosterTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  rosterCount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
  },
  rosterList: {
    maxHeight: 120,
  },
  rosterScroll: {
    gap: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171E2B',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  participantRole: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  signalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E676',
  },
});
