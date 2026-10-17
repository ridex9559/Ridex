/**
 * Achievement and Trophy Domain Models
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progressPercent?: number;
  progress?: number;
  currentValue?: number;
  maxProgress?: number;
  targetValue?: number;
  unit?: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}
