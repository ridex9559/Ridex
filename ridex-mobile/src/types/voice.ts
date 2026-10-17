/**
 * RIDEX V2 — Group Voice Communication (RIDEX Intercom) Domain Models
 */

export type PushToTalkState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'TRANSMITTING'
  | 'RECEIVING'
  | 'MUTED'
  | 'ERROR'
  | 'OFFLINE';

export interface VoiceParticipant {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: 'ORGANIZER' | 'LEADER' | 'RIDER';
  isTalking: boolean;
  isMuted: boolean;
  signalStrength?: 'EXCELLENT' | 'GOOD' | 'POOR';
  joinedAt: number;
}

export interface VoiceChannel {
  id: string;
  rideId: string;
  name: string;
  state: PushToTalkState;
  activeSpeaker?: VoiceParticipant | null;
  participants: VoiceParticipant[];
  participantsCount: number;
  isMuted: boolean;
}
