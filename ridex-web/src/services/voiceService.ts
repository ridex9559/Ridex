/**
 * RIDEX Web — Push-to-Talk (PTT) Squad Intercom Service
 * Real-time audio walkie-talkie powered by Web MediaRecorder, AudioContext,
 * and Supabase Realtime binary/base64 packet broadcast.
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { VoiceChannelState } from '../types';

type VoiceStateListener = (state: VoiceChannelState) => void;

class WebVoiceService {
  private activeRideId: string | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private currentUserId: string = '';
  private currentUserName: string = '';

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private state: VoiceChannelState = {
    id: 'squad-intercom',
    rideId: '',
    name: 'Squad Main Intercom',
    state: 'DISCONNECTED',
    activeSpeaker: null,
    participantsCount: 1,
    isMuted: false,
    micPermission: 'prompt',
  };

  private listeners: Set<VoiceStateListener> = new Set();

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach((fn) => fn(copy));
  }

  public getState(): VoiceChannelState {
    return { ...this.state };
  }

  /**
   * Checks browser audio capabilities honestly.
   */
  public checkBrowserSupport(): { supported: boolean; reason?: string } {
    if (typeof window === 'undefined') return { supported: false, reason: 'SSR' };

    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasAudioContext = typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';

    if (!hasMediaDevices || !hasMediaRecorder || !hasAudioContext) {
      return {
        supported: false,
        reason: 'Your browser environment does not support full duplex audio capture (MediaRecorder / Web Audio). Use modern Chrome, Edge, or Safari.',
      };
    }

    return { supported: true };
  }

  /**
   * Connects rider to active ride intercom channel.
   */
  public async connect(rideId: string, userId: string, userName: string): Promise<boolean> {
    const support = this.checkBrowserSupport();
    if (!support.supported) {
      this.state.micPermission = 'unsupported';
      this.state.state = 'DISCONNECTED';
      this.notify();
      return false;
    }

    this.activeRideId = rideId;
    this.currentUserId = userId;
    this.currentUserName = userName;

    this.state.rideId = rideId;
    this.state.state = 'CONNECTING';
    this.notify();

    // 1. Initialize Web Audio Context
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (e) {
      console.warn('[voiceService] AudioContext error:', e);
    }

    // 2. Subscribe to Supabase Realtime voice broadcast channel
    const channelName = `voice:${rideId}`;
    this.realtimeChannel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    this.realtimeChannel
      .on('broadcast', { event: 'voice_packet' }, ({ payload }) => {
        this.handleIncomingAudioPacket(payload);
      })
      .on('broadcast', { event: 'speaker_start' }, ({ payload }) => {
        this.state.activeSpeaker = {
          userId: payload.userId,
          userName: payload.userName,
        };
        this.notify();
      })
      .on('broadcast', { event: 'speaker_stop' }, () => {
        this.state.activeSpeaker = null;
        this.notify();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.state.state = 'CONNECTED';
          this.notify();
        }
      });

    return true;
  }

  /**
   * Request microphone permission explicitly.
   */
  public async requestMicrophone(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.state.micPermission = 'granted';
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('[voiceService] Microphone permission error:', err);
      this.state.micPermission = 'denied';
      this.notify();
      return false;
    }
  }

  /**
   * Rider presses and holds Push-To-Talk button (transmitting).
   */
  public async startTransmitting(): Promise<boolean> {
    if (this.state.state !== 'CONNECTED' || !this.activeRideId) return false;

    // Ensure microphone stream is active
    if (!this.mediaStream) {
      const granted = await this.requestMicrophone();
      if (!granted || !this.mediaStream) return false;
    }

    try {
      this.recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.flushAudioPacket();
      };

      this.mediaRecorder.start(250); // Slice every 250ms for low latency
      this.state.state = 'TRANSMITTING';
      this.state.activeSpeaker = {
        userId: this.currentUserId,
        userName: this.currentUserName,
      };
      this.notify();

      // Broadcast speaker start
      this.realtimeChannel?.send({
        type: 'broadcast',
        event: 'speaker_start',
        payload: {
          userId: this.currentUserId,
          userName: this.currentUserName,
        },
      });

      return true;
    } catch (e) {
      console.error('[voiceService] startTransmitting error:', e);
      return false;
    }
  }

  /**
   * Rider releases Push-To-Talk button.
   */
  public async stopTransmitting(): Promise<void> {
    if (this.state.state !== 'TRANSMITTING') return;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.state.state = 'CONNECTED';
    this.state.activeSpeaker = null;
    this.notify();

    // Broadcast speaker stop
    this.realtimeChannel?.send({
      type: 'broadcast',
      event: 'speaker_stop',
      payload: { userId: this.currentUserId },
    });
  }

  /**
   * Flushes recorded voice blob to squad channel as base64 audio packet.
   */
  private async flushAudioPacket() {
    if (this.recordedChunks.length === 0 || !this.realtimeChannel) return;

    const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
    this.recordedChunks = [];

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      this.realtimeChannel?.send({
        type: 'broadcast',
        event: 'voice_packet',
        payload: {
          speakerId: this.currentUserId,
          speakerName: this.currentUserName,
          audioData: base64Audio,
          timestamp: Date.now(),
        },
      });
    };
    reader.readAsDataURL(blob);
  }

  /**
   * Plays incoming voice packet through browser Web Audio context.
   */
  private async handleIncomingAudioPacket(packet: any) {
    if (!packet?.audioData || packet.speakerId === this.currentUserId) return;

    try {
      const audio = new Audio(packet.audioData);
      await audio.play();
    } catch (e) {
      console.warn('[voiceService] Incoming audio playback note:', e);
    }
  }

  /**
   * Disconnects and frees all audio hardware resources.
   */
  public disconnect() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (_) {}
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    this.state.state = 'DISCONNECTED';
    this.state.activeSpeaker = null;
    this.notify();
  }
}

export const voiceService = new WebVoiceService();
