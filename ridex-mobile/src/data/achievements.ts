import { Achievement, AppNotification } from '../types/achievement';

export const mockAchievements: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Curve Master',
    description: 'Log a lean angle of 50° or higher on high-speed twisties.',
    icon: '⚡',
    progress: 52,
    maxProgress: 50,
    currentValue: 52,
    targetValue: 50,
    unit: 'degrees',
    isUnlocked: true,
    unlockedAt: '2024-05-12T09:30:00.000Z',
  },
  {
    id: 'ach-2',
    title: 'Elevation King',
    description: 'Climb over 100,000 meters of cumulative mountain elevation.',
    icon: '🏔️',
    progress: 124500,
    maxProgress: 100000,
    currentValue: 124500,
    targetValue: 100000,
    unit: 'meters',
    isUnlocked: true,
    unlockedAt: '2024-04-20T16:00:00.000Z',
  },
  {
    id: 'ach-3',
    title: 'Century Tourer',
    description: 'Ride over 10,000 kilometers total across all registered bikes.',
    icon: '🏆',
    progress: 14820,
    maxProgress: 10000,
    currentValue: 14820,
    targetValue: 10000,
    unit: 'KM',
    isUnlocked: true,
    unlockedAt: '2024-03-10T12:00:00.000Z',
  },
  {
    id: 'ach-4',
    title: 'Iron Butt 500',
    description: 'Complete a single continuous day ride exceeding 500 KM.',
    icon: '🔥',
    progress: 342,
    maxProgress: 500,
    currentValue: 342,
    targetValue: 500,
    unit: 'KM',
    isUnlocked: false,
  },
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: '🏆 Achievement Unlocked',
    message: 'You unlocked "Curve Master" with 52° lean angle!',
    type: 'ACHIEVEMENT',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif-2',
    title: '🔥 New Pack Activity',
    message: 'Elena Rostova posted new telemetry from Furka Pass.',
    type: 'SOCIAL',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'notif-3',
    title: '👥 Group Ride Alert',
    message: 'Alpine Twisties Squad scheduled a weekend ride for Grossglockner.',
    type: 'GROUP_RIDE',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export const MOCK_ACHIEVEMENTS = mockAchievements;
export const MOCK_NOTIFICATIONS = mockNotifications;
