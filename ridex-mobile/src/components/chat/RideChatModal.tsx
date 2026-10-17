import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send, MessageSquare, Radio, Sparkles } from 'lucide-react-native';
import { rideChatService, ChatMessage } from '@/services/chat/RideChatService';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

interface RideChatModalProps {
  visible: boolean;
  rideId: string;
  rideTitle?: string;
  onClose: () => void;
}

const QUICK_EMOJIS = ['🏍️', '👍', '☕', '⛽', '🏁', '🔥', '📍'];

export const RideChatModal: React.FC<RideChatModalProps> = ({
  visible,
  rideId,
  rideTitle,
  onClose,
}) => {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible || !rideId) return;

    const unsub = rideChatService.subscribeToRideChat(rideId, (updated) => {
      setMessages(updated);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return unsub;
  }, [visible, rideId]);

  const handleSend = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text || !user) return;

    setInputText('');
    await rideChatService.sendMessage(
      rideId,
      user.id,
      user.name || user.username || 'Rider',
      text
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <MessageSquare size={20} color={COLORS.primary.DEFAULT} />
              <View>
                <Text style={styles.headerTitle}>RIDE SQUAD CHAT</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {rideTitle || 'Lonavala Sunrise Ride'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Messages Stream */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesScroll}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isSelf = msg.userId === user?.id;

              if (msg.isSystem) {
                return (
                  <View key={msg.id} style={styles.systemMessageWrap}>
                    <View style={styles.systemBadge}>
                      <Sparkles size={11} color={COLORS.primary.DEFAULT} />
                      <Text style={styles.systemText}>{msg.message}</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isSelf ? styles.messageRowSelf : styles.messageRowOther,
                  ]}
                >
                  {!isSelf && (
                    <Avatar uri={msg.userAvatar} name={msg.userName} size={30} />
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isSelf ? styles.messageBubbleSelf : styles.messageBubbleOther,
                    ]}
                  >
                    {!isSelf && (
                      <Text style={styles.senderName}>{msg.userName}</Text>
                    )}
                    <Text style={[styles.messageText, isSelf && styles.messageTextSelf]}>
                      {msg.message}
                    </Text>
                    <Text style={styles.messageTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Quick Emoji Bar */}
          <View style={styles.emojiBar}>
            {QUICK_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => handleSend(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Footer */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Message your ride squad..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <Send size={16} color={inputText.trim() ? '#080B12' : '#64748B'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#111722',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: '80%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
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
  messagesList: {
    flex: 1,
  },
  messagesScroll: {
    padding: SPACING.md,
    gap: 12,
  },
  systemMessageWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    gap: 6,
  },
  systemText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.3,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowSelf: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageBubbleSelf: {
    backgroundColor: '#FF6B00',
    borderBottomRightRadius: 2,
  },
  messageBubbleOther: {
    backgroundColor: '#171E2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 2,
  },
  senderName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
  },
  messageTextSelf: {
    color: '#080B12',
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: '#080B12',
    borderTopWidth: 1,
    borderTopColor: COLORS.border.subtle,
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#111722',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#171E2B',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#171E2B',
  },
});
