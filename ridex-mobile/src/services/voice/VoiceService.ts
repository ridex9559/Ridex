/**
 * RIDEX V2 — Group Voice Intercom & Walkie-Talkie Push-to-Talk (PTT)
 * Implements ultra low-latency Push-to-Talk voice intercom for motorcycle squads.
 * Captures microphone audio on HOLD TO TALK and broadcasts audio packets over Supabase Realtime.
 * Supports cross-platform audio playback across Android Expo Go and iPhone Web / Chrome / Safari.
 */

import { NativeModules, Platform } from 'react-native';
import type { Audio as AudioType } from 'expo-av';
import { supabaseClient } from '../supabase/client';
import { VoiceChannel, VoiceParticipant } from '../../types/voice';
import { logger } from '../../utils/logger';

type VoiceStateListener = (channel: VoiceChannel) => void;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString =
    typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(base64)
      : typeof Buffer !== 'undefined'
      ? Buffer.from(base64, 'base64').toString('binary')
      : '';
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

let cachedExpoAudio: typeof AudioType | null = null;
let isAudioModuleChecked = false;

function isExponentAvLinked(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const hasNative = !!(
      NativeModules.ExponentAV ||
      (NativeModules as any)?.NativeModulesProxy?.ExponentAV ||
      (globalThis as any)?.expo?.modules?.ExponentAV
    );
    return hasNative;
  } catch {
    return false;
  }
}

function getExpoAudio(): typeof AudioType | null {
  if (Platform.OS === 'web') return null;
  if (isAudioModuleChecked) return cachedExpoAudio;

  isAudioModuleChecked = true;
  if (!isExponentAvLinked()) {
    cachedExpoAudio = null;
    return null;
  }

  try {
    const expoAv = require('expo-av');
    if (expoAv && expoAv.Audio) {
      cachedExpoAudio = expoAv.Audio;
      return cachedExpoAudio;
    }
  } catch (err) {
    logger.warn('[VoiceService] Native ExponentAV module unavailable in current runtime (requires development build):', err);
    cachedExpoAudio = null;
  }
  return null;
}

class VoiceService {
  private activeRideId: string | null = null;
  private realtimeChannel: any = null;
  private localUserId: string = '';
  private localUserName: string = '';

  // Web Audio Context & Recording State
  private webAudioContext: any = null;
  private isWebAudioUnlocked: boolean = false;
  private webMediaStream: any = null;
  private webMediaRecorder: any = null;
  private webAudioChunks: Blob[] = [];

  // Native Recording State
  private nativeRecording: any = null;
  private currentSound: any = null;

  private channel: VoiceChannel = {
    id: 'ch-ride-intercom',
    rideId: '',
    name: 'Squad Main Intercom',
    state: 'DISCONNECTED',
    activeSpeaker: null,
    participantsCount: 1,
    isMuted: false,
    participants: [],
  };

  private listeners: Set<VoiceStateListener> = new Set();
  private connectionError: string | null = null;

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.channel });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = { ...this.channel };
    this.listeners.forEach((fn) => fn(copy));
  }

  public getChannel(): VoiceChannel {
    return { ...this.channel };
  }

  public getError(): string | null {
    return this.connectionError;
  }

  /**
   * Checks whether the current runtime environment supports voice hardware
   * (Web Audio/MediaDevices on Web or linked ExponentAV module on native)
   */
  public isVoiceHardwareSupported(): boolean {
    if (Platform.OS === 'web') {
      return this.isMediaDevicesSupported();
    }
    return getExpoAudio() !== null;
  }

  /**
   * Check if running under HTTPS or Localhost (Required by iOS WebKit for Microphone)
   */
  public isHttpsContext(): boolean {
    if (Platform.OS !== 'web') return true;
    if (typeof window === 'undefined' || !window.location) return true;
    const { protocol, hostname } = window.location;
    return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
  }

  /**
   * Check if MediaDevices API is supported in the current browser
   */
  public isMediaDevicesSupported(): boolean {
    if (Platform.OS !== 'web') return true;
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  /**
   * Check if Web Audio is currently unlocked
   */
  public isAudioUnlocked(): boolean {
    if (Platform.OS !== 'web') return true;
    return this.isWebAudioUnlocked;
  }

  /**
   * Unlock Web Audio Context on User Gesture (Critical for iOS Safari / Chrome Autoplay Policy)
   */
  public async unlockAudioContext(): Promise<boolean> {
    if (Platform.OS !== 'web') return true;
    try {
      if (typeof window === 'undefined') return false;
      const AudioCtxClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return false;

      if (!this.webAudioContext) {
        this.webAudioContext = new AudioCtxClass();
      }

      if (this.webAudioContext.state === 'suspended') {
        await this.webAudioContext.resume();
      }

      // Play 1-sample silent buffer to fully warm up the WebKit audio engine
      const buffer = this.webAudioContext.createBuffer(1, 1, 22050);
      const source = this.webAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.webAudioContext.destination);
      source.start(0);

      this.isWebAudioUnlocked = true;
      logger.info('[VoiceService] Web AudioContext unlocked successfully');
      return true;
    } catch (err) {
      logger.warn('[VoiceService] Failed to unlock Web AudioContext:', err);
      return false;
    }
  }

  /**
   * Request and pre-warm microphone stream on Web / Native
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        await this.unlockAudioContext();
        if (!this.isMediaDevicesSupported()) {
          logger.warn('[VoiceService] MediaDevices not supported in this browser context');
          return false;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        this.webMediaStream = stream;
        logger.info('[VoiceService] Web Microphone permission granted & stream cached');
        return true;
      } else {
        const AudioModule = getExpoAudio();
        if (!AudioModule) {
          logger.warn('[VoiceService] Native Audio module not available in this runtime');
          return false;
        }
        const { status } = await AudioModule.requestPermissionsAsync();
        await AudioModule.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        return status === 'granted';
      }
    } catch (err) {
      logger.warn('[VoiceService] Microphone permission request failed:', err);
      return false;
    }
  }

  /**
   * Connect to Ride Voice Room using Supabase Signaling Channel
   */
  public async connectToRideVoice(
    rideId: string,
    userId: string,
    userName: string,
    role: 'ORGANIZER' | 'LEADER' | 'RIDER' = 'RIDER'
  ): Promise<boolean> {
    this.activeRideId = rideId;
    this.localUserId = userId;
    this.localUserName = userName;
    this.connectionError = null;

    this.channel.rideId = rideId;
    this.channel.state = 'CONNECTING';
    this.notify();

    // Unlock Web Audio or request Native permissions
    if (Platform.OS === 'web') {
      this.unlockAudioContext();
    } else {
      const AudioModule = getExpoAudio();
      if (AudioModule) {
        try {
          await AudioModule.requestPermissionsAsync();
          await AudioModule.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } catch (e) {
          logger.warn('[VoiceService] Native Audio permission request warning:', e);
        }
      }
    }

    try {
      const channelId = `voice_room:${rideId}`;

      // Cleanly remove any previous channel to avoid presence callback collisions
      if (this.realtimeChannel) {
        try {
          await supabaseClient.removeChannel(this.realtimeChannel);
        } catch (e) {
          logger.warn('[VoiceService] Error removing previous channel:', e);
        }
        this.realtimeChannel = null;
      }

      this.realtimeChannel = supabaseClient.channel(channelId, {
        config: {
          presence: { key: userId },
        },
      });

      // Presence Synchronization
      this.realtimeChannel.on('presence', { event: 'sync' }, () => {
        const presenceState = this.realtimeChannel.presenceState();
        const activeUsers: VoiceParticipant[] = [];

        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key];
          if (presences && presences.length > 0) {
            const p = presences[0];
            activeUsers.push({
              userId: p.userId || key,
              name: p.userName || 'Rider',
              role: p.role || 'RIDER',
              isTalking: !!p.isTalking,
              isMuted: !!p.isMuted,
              signalStrength: 'EXCELLENT',
              joinedAt: p.joinedAt || Date.now(),
            });
          }
        });

        if (!activeUsers.some((u) => u.userId === userId)) {
          activeUsers.push({
            userId,
            name: userName,
            role,
            isTalking: false,
            isMuted: this.channel.isMuted,
            signalStrength: 'EXCELLENT',
            joinedAt: Date.now(),
          });
        }

        this.channel.participants = activeUsers;
        this.channel.participantsCount = activeUsers.length;
        this.notify();
      });

      // Handle PTT Signaling
      this.realtimeChannel.on('broadcast', { event: 'ptt_speaker' }, (payload: any) => {
        const { speakerId, speakerName, isSpeaking } = payload.payload || {};

        if (speakerId !== this.localUserId) {
          if (isSpeaking) {
            this.channel.state = 'RECEIVING';
            this.channel.activeSpeaker = {
              userId: speakerId,
              name: speakerName,
              role: 'RIDER',
              isTalking: true,
              isMuted: false,
              signalStrength: 'EXCELLENT',
              joinedAt: Date.now(),
            };
          } else {
            if (this.channel.activeSpeaker?.userId === speakerId) {
              this.channel.activeSpeaker = null;
              this.channel.state = this.channel.isMuted ? 'MUTED' : 'CONNECTED';
            }
          }

          this.channel.participants.forEach((p) => {
            if (p.userId === speakerId) {
              p.isTalking = isSpeaking;
            }
          });

          this.notify();
        }
      });

      // Handle PTT Incoming Audio Transmission
      this.realtimeChannel.on('broadcast', { event: 'ptt_audio' }, async (payload: any) => {
        const { speakerId, base64Audio, mimeType } = payload.payload || {};
        if (speakerId === this.localUserId || !base64Audio) return;

        logger.info('[VoiceService] Received PTT audio chunk from:', speakerId);
        await this.playIncomingAudio(base64Audio, mimeType);
      });

      // Subscribe to Realtime Voice Room
      await this.realtimeChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.realtimeChannel.track({
            userId,
            userName,
            role,
            isTalking: false,
            isMuted: this.channel.isMuted,
            joinedAt: Date.now(),
          });

          this.channel.state = 'CONNECTED';
          this.connectionError = null;
          this.notify();
          logger.info('[VoiceService] Connected to Supabase Voice Room:', rideId);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.connectionError = 'Voice connection unavailable. Check your internet connection.';
          this.channel.state = 'ERROR';
          this.notify();
        }
      });

      return true;
    } catch (err: any) {
      logger.error('[VoiceService] connectToRideVoice failed:', err);
      this.connectionError = 'Unable to establish voice room. Tap to retry.';
      this.channel.state = 'ERROR';
      this.notify();
      return false;
    }
  }

  /**
   * Push-To-Talk Activated (User holding HOLD TO TALK button)
   */
  public async startTransmitting(userId: string, userName: string) {
    if (this.channel.isMuted || this.channel.state === 'DISCONNECTED') return;

    this.channel.state = 'TRANSMITTING';
    this.channel.activeSpeaker = {
      userId,
      name: userName || 'You',
      role: 'RIDER',
      isTalking: true,
      isMuted: false,
      signalStrength: 'EXCELLENT',
      joinedAt: Date.now(),
    };

    this.channel.participants.forEach((p) => {
      p.isTalking = p.userId === userId;
    });
    this.notify();

    // Broadcast signaling
    if (this.realtimeChannel) {
      try {
        await this.realtimeChannel.send({
          type: 'broadcast',
          event: 'ptt_speaker',
          payload: {
            speakerId: userId,
            speakerName: userName,
            isSpeaking: true,
            timestamp: Date.now(),
          },
        });
      } catch (e) {
        logger.warn('[VoiceService] Broadcast PTT start error:', e);
      }
    }

    // Start Audio Hardware Recording
    if (Platform.OS === 'web') {
      try {
        await this.unlockAudioContext();

        if (!this.webMediaStream || !this.webMediaStream.active) {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            this.webMediaStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
          }
        }

        if (this.webMediaStream && typeof (window as any).MediaRecorder !== 'undefined') {
          this.webAudioChunks = [];

          // Detect best supported MIME type for current browser (iOS Safari vs Chrome vs Firefox)
          let selectedMimeType = '';
          const candidateTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/aac',
            'audio/ogg;codecs=opus',
          ];

          for (const type of candidateTypes) {
            if ((window as any).MediaRecorder.isTypeSupported?.(type)) {
              selectedMimeType = type;
              break;
            }
          }

          const recorderOptions: any = selectedMimeType ? { mimeType: selectedMimeType } : {};
          const recorder = new (window as any).MediaRecorder(this.webMediaStream, recorderOptions);

          recorder.ondataavailable = (e: any) => {
            if (e.data && e.data.size > 0) {
              this.webAudioChunks.push(e.data);
            }
          };

          recorder.start(150); // Slice in 150ms intervals
          this.webMediaRecorder = recorder;
        }
      } catch (err) {
        logger.warn('[VoiceService] Web MediaRecorder start error:', err);
      }
    } else {
      const AudioModule = getExpoAudio();
      if (!AudioModule) {
        logger.warn('[VoiceService] Cannot record: ExponentAV native module not available in current runtime');
        return;
      }
      try {
        const { recording } = await AudioModule.Recording.createAsync(
          AudioModule.RecordingOptionsPresets.HIGH_QUALITY
        );
        this.nativeRecording = recording;
      } catch (err) {
        logger.warn('[VoiceService] Native Audio.Recording start error:', err);
      }
    }
  }

  /**
   * Push-To-Talk Released (User stopped pressing HOLD TO TALK)
   */
  public async stopTransmitting() {
    if (this.channel.state === 'TRANSMITTING') {
      this.channel.state = this.channel.isMuted ? 'MUTED' : 'CONNECTED';
      this.channel.activeSpeaker = null;

      this.channel.participants.forEach((p) => {
        if (p.userId === this.localUserId) p.isTalking = false;
      });
      this.notify();

      // Broadcast signaling stop
      if (this.realtimeChannel) {
        try {
          await this.realtimeChannel.send({
            type: 'broadcast',
            event: 'ptt_speaker',
            payload: {
              speakerId: this.localUserId,
              speakerName: this.localUserName,
              isSpeaking: false,
              timestamp: Date.now(),
            },
          });
        } catch (e) {
          logger.warn('[VoiceService] Broadcast PTT stop error:', e);
        }
      }

      // Stop Web Recording & Broadcast Recorded Audio
      if (Platform.OS === 'web' && this.webMediaRecorder) {
        try {
          const recorder = this.webMediaRecorder;
          this.webMediaRecorder = null;

          recorder.onstop = () => {
            if (this.webAudioChunks.length > 0) {
              const mimeType = recorder.mimeType || 'audio/webm';
              const audioBlob = new Blob(this.webAudioChunks, { type: mimeType });

              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64Url = reader.result as string;
                const base64Audio = base64Url.split(',')[1];

                if (base64Audio && this.realtimeChannel) {
                  await this.realtimeChannel.send({
                    type: 'broadcast',
                    event: 'ptt_audio',
                    payload: {
                      speakerId: this.localUserId,
                      speakerName: this.localUserName,
                      base64Audio,
                      mimeType,
                      timestamp: Date.now(),
                    },
                  });
                  logger.info('[VoiceService] Broadcasted Web PTT audio packet (MIME:', mimeType, ')');
                }
              };
            }
          };

          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        } catch (err) {
          logger.warn('[VoiceService] Web MediaRecorder stop error:', err);
        }
      } else if (this.nativeRecording) {
        try {
          const recording = this.nativeRecording;
          this.nativeRecording = null;
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();

          if (uri && this.realtimeChannel) {
            const response = await fetch(uri);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              const base64Url = reader.result as string;
              const base64Audio = base64Url.split(',')[1];

              if (base64Audio && this.realtimeChannel) {
                await this.realtimeChannel.send({
                  type: 'broadcast',
                  event: 'ptt_audio',
                  payload: {
                    speakerId: this.localUserId,
                    speakerName: this.localUserName,
                    base64Audio,
                    mimeType: 'audio/mp4',
                    timestamp: Date.now(),
                  },
                });
                logger.info('[VoiceService] Broadcasted Native PTT audio packet (MIME: audio/mp4)');
              }
            };
          }
        } catch (err) {
          logger.warn('[VoiceService] Native Recording stop error:', err);
        }
      }
    }
  }

  /**
   * Safe Audio Buffer Decoder for Web Audio API
   */
  private async decodeAudioDataSafe(
    audioCtx: any,
    arrayBuffer: ArrayBuffer
  ): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      const bufferCopy = arrayBuffer.slice(0);
      const res = audioCtx.decodeAudioData(bufferCopy, resolve, reject);
      if (res && typeof res.then === 'function') {
        res.then(resolve).catch(reject);
      }
    });
  }

  /**
   * Play Incoming PTT Audio Chunk from Squad Member
   */
  private async playIncomingAudio(base64Audio: string, mimeType: string = 'audio/mp4') {
    try {
      if (Platform.OS === 'web') {
        // Attempt 1: Web Audio API (Bypasses HTML5 Audio autoplay policy when unlocked)
        if (this.webAudioContext) {
          try {
            if (this.webAudioContext.state === 'suspended') {
              await this.webAudioContext.resume();
            }

            const arrayBuffer = base64ToArrayBuffer(base64Audio);
            const audioBuffer = await this.decodeAudioDataSafe(this.webAudioContext, arrayBuffer);
            const source = this.webAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.webAudioContext.destination);
            source.start(0);
            logger.info('[VoiceService] Played incoming audio via Web AudioContext');
            return;
          } catch (webAudioErr) {
            logger.warn('[VoiceService] Web AudioContext decode failed, falling back to HTML5 Audio:', webAudioErr);
          }
        }

        // Attempt 2: HTML5 Audio Element Fallback
        const audioUri = `data:${mimeType || 'audio/mp4'};base64,${base64Audio}`;
        const audio = new window.Audio(audioUri);
        audio.volume = 1.0;
        await audio.play();
        logger.info('[VoiceService] Played incoming audio via HTML5 Audio element');
      } else {
        // Native (Android Expo Go & iOS)
        const AudioModule = getExpoAudio();
        if (!AudioModule) {
          logger.warn('[VoiceService] Cannot play incoming audio: ExponentAV native module not available');
          return;
        }

        if (this.currentSound) {
          try {
            await this.currentSound.unloadAsync();
          } catch {}
        }
        const audioUri = `data:${mimeType || 'audio/mp4'};base64,${base64Audio}`;
        const { sound } = await AudioModule.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, volume: 1.0 }
        );
        this.currentSound = sound;
        logger.info('[VoiceService] Played incoming audio via native expo-av Audio.Sound');
      }
    } catch (err) {
      logger.warn('[VoiceService] Play incoming audio error:', err);
    }
  }

  /**
   * Toggle Mute / Unmute
   */
  public toggleMute(): boolean {
    this.channel.isMuted = !this.channel.isMuted;
    if (this.channel.isMuted && this.channel.state === 'TRANSMITTING') {
      this.stopTransmitting();
    }
    this.channel.state = this.channel.isMuted ? 'MUTED' : 'CONNECTED';
    this.notify();

    if (this.realtimeChannel) {
      this.realtimeChannel.track({
        userId: this.localUserId,
        userName: this.localUserName,
        isTalking: false,
        isMuted: this.channel.isMuted,
      });
    }

    return this.channel.isMuted;
  }

  /**
   * Disconnect and leave Voice Intercom Room
   */
  public disconnect() {
    if (this.realtimeChannel) {
      supabaseClient.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    if (this.webMediaStream) {
      try {
        this.webMediaStream.getTracks().forEach((t: any) => t.stop());
      } catch {}
      this.webMediaStream = null;
    }
    this.channel.state = 'DISCONNECTED';
    this.channel.participants = [];
    this.channel.activeSpeaker = null;
    this.notify();
  }
}

export const voiceService = new VoiceService();
export default voiceService;
