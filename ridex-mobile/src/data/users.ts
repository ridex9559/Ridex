import { User, UserStatistics } from '../types/user';

export const mockCurrentUser: User = {
  id: 'usr-pratik-1',
  name: 'Pratik Pawar',
  username: 'pratik_rides',
  email: 'pratik@ridex.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  bio: 'Motorcycle Explorer & Tour Captain. Royal Enfield Himalayan 450.',
  location: 'Pune, Maharashtra',
  role: 'Tour Captain',
  createdAt: '2025-01-15T00:00:00.000Z',
};

export const mockUserStats: UserStatistics = {
  totalRides: 48,
  totalDistanceKm: 2450.8,
  longestRideKm: 420.0,
  totalDurationSeconds: 230400, // 64 hours
  followersCount: 340,
  followingCount: 185,
  currentStreakDays: 4,
};

export const mockCommunityUsers: User[] = [
  {
    id: 'usr-rahul-2',
    name: 'Rahul Sharma',
    username: 'rahul_himalayan',
    email: 'rahul@ridex.app',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Lead Sweeper @ Himalayan Riders Club',
    location: 'Mumbai, Maharashtra',
    role: 'Club Leader',
    createdAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'usr-neha-3',
    name: 'Neha Verma',
    username: 'neha_gs',
    email: 'neha@ridex.app',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    bio: 'BMW G 310 GS Rider • Twisty Hunter',
    location: 'Pune, Maharashtra',
    role: 'Verified Rider',
    createdAt: '2025-03-10T00:00:00.000Z',
  },
];
