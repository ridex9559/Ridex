/**
 * RIDEX V2 — Real-time Group Ride Chat Service
 * Synchronizes squad text messages, emoji reactions, and automated ride system events
 * across Android APK, Expo Go, and Web clients via Supabase Realtime.
 */

import { supabaseClient } from '../supabase/client';
import { logger } from '../../utils/logger';

export interface ChatMessage {
  id: string;
  rideId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  isSystem: boolean;
  createdAt: string;
}

type ChatListener = (messages: ChatMessage[]) => void;

class RideChatService {
  private activeSubscriptions: Map<string, any> = new Map();
  private messagesCache: Map<string, ChatMessage[]> = new Map();
  private listeners: Map<string, Set<ChatListener>> = new Map();

  /**
   * Subscribe to real-time chat messages for a specific ride
   */
  public subscribeToRideChat(rideId: string, listener: ChatListener): () => void {
    if (!this.listeners.has(rideId)) {
      this.listeners.set(rideId, new Set());
    }
    this.listeners.get(rideId)!.add(listener);

    // Provide cached messages immediately
    const cached = this.messagesCache.get(rideId) || [];
    listener(cached);

    // Fetch initial chat history from Supabase
    this.fetchChatHistory(rideId);

    // Setup Supabase Realtime channel if not already active
    if (!this.activeSubscriptions.has(rideId)) {
      const channel = supabaseClient
        .channel(`ride_chat:${rideId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ride_id=eq.${rideId}`,
          },
          async (payload) => {
            const newRow = payload.new;
            let senderName = 'Rider';
            let senderAvatar = undefined;

            try {
              const { data: prof } = await (supabaseClient.from('profiles') as any)
                .select('full_name, username, avatar_url')
                .eq('id', newRow.user_id)
                .maybeSingle();

              if (prof) {
                senderName = prof.full_name || prof.username || senderName;
                senderAvatar = prof.avatar_url;
              }
            } catch {}

            const msg: ChatMessage = {
              id: newRow.id,
              rideId: newRow.ride_id,
              userId: newRow.user_id,
              userName: senderName,
              userAvatar: senderAvatar,
              message: newRow.message,
              isSystem: !!newRow.is_system,
              createdAt: newRow.created_at,
            };

            this.appendMessage(rideId, msg);
          }
        )
        .subscribe();

      this.activeSubscriptions.set(rideId, channel);
    }

    return () => {
      const set = this.listeners.get(rideId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          const ch = this.activeSubscriptions.get(rideId);
          if (ch) {
            ch.unsubscribe();
            this.activeSubscriptions.delete(rideId);
          }
        }
      }
    };
  }

  /**
   * Fetch chat history from Supabase database
   */
  public async fetchChatHistory(rideId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await (supabaseClient.from('messages') as any)
        .select(`
          id,
          ride_id,
          user_id,
          message,
          is_system,
          created_at,
          user:profiles(id, full_name, username, avatar_url)
        `)
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        const parsed: ChatMessage[] = data.map((row: any) => ({
          id: row.id,
          rideId: row.ride_id,
          userId: row.user_id,
          userName: row.user?.full_name || row.user?.username || 'Rider',
          userAvatar: row.user?.avatar_url,
          message: row.message,
          isSystem: !!row.is_system,
          createdAt: row.created_at,
        }));

        this.messagesCache.set(rideId, parsed);
        this.notifyListeners(rideId);
        return parsed;
      }
    } catch (e) {
      logger.warn('[RideChatService] fetchChatHistory warning:', e);
    }

    // Default system welcome message if empty
    const defaultMsg: ChatMessage[] = [
      {
        id: `sys-${rideId}`,
        rideId,
        userId: 'system',
        userName: 'RIDEX RADAR',
        message: 'Ride squad frequency open. Coordinate meetups and share updates.',
        isSystem: true,
        createdAt: new Date().toISOString(),
      },
    ];
    this.messagesCache.set(rideId, defaultMsg);
    this.notifyListeners(rideId);
    return defaultMsg;
  }

  /**
   * Sends a user chat message to the ride squad
   */
  public async sendMessage(
    rideId: string,
    userId: string,
    userName: string,
    messageText: string
  ): Promise<boolean> {
    const text = messageText.trim();
    if (!text) return false;

    // Optimistic local add
    const optimisticMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      rideId,
      userId,
      userName,
      message: text,
      isSystem: false,
      createdAt: new Date().toISOString(),
    };
    this.appendMessage(rideId, optimisticMsg);

    try {
      const { error } = await (supabaseClient.from('messages') as any).insert({
        ride_id: rideId,
        user_id: userId,
        message: text,
        is_system: false,
      });

      if (error) {
        logger.error('[RideChatService] Error inserting message to database:', error);
        return false;
      }
      return true;
    } catch (err) {
      logger.warn('[RideChatService] sendMessage network error:', err);
      return false;
    }
  }

  /**
   * Broadcasts an automated system event to the group chat
   */
  public async sendSystemMessage(rideId: string, systemEventText: string): Promise<void> {
    try {
      const { data: session } = await supabaseClient.auth.getSession();
      const currentUserId = session?.session?.user?.id;
      if (!currentUserId) return;

      await (supabaseClient.from('messages') as any).insert({
        ride_id: rideId,
        user_id: currentUserId,
        message: systemEventText,
        is_system: true,
      });
    } catch (e) {
      logger.warn('[RideChatService] sendSystemMessage warning:', e);
    }
  }

  private appendMessage(rideId: string, msg: ChatMessage) {
    const list = this.messagesCache.get(rideId) || [];
    // Prevent duplicate entries
    if (!list.some((m) => m.id === msg.id || (m.userId === msg.userId && m.message === msg.message && Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1000))) {
      list.push(msg);
      this.messagesCache.set(rideId, list);
      this.notifyListeners(rideId);
    }
  }

  private notifyListeners(rideId: string) {
    const set = this.listeners.get(rideId);
    const messages = this.messagesCache.get(rideId) || [];
    if (set) {
      set.forEach((fn) => fn([...messages]));
    }
  }
}

export const rideChatService = new RideChatService();
export default rideChatService;
