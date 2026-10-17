/**
 * RIDEX V2 — Motorcycle Community & Rider Groups Domain Models
 */

import { UserProfile } from './user';

export type GroupRole = 'ORGANIZER' | 'ADMIN' | 'MEMBER';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user?: UserProfile;
  role: GroupRole;
  joinedAt: string;
}

export interface RiderGroup {
  id: string;
  name: string;
  description: string;
  city?: string;
  region?: string;
  icon?: string;
  badge?: string;
  imageUrl?: string;
  coverImage?: string;
  creatorId?: string;
  organizer?: UserProfile;
  admins?: UserProfile[];
  membersCount: number;
  upcomingRidesCount?: number;
  isJoined?: boolean;
  userRole?: GroupRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId?: string;
  userId?: string;
  userName?: string;
  authorName?: string;
  userAvatar?: string;
  authorAvatar?: string;
  content?: string;
  text?: string;
  createdAt: string;
}

export interface Story {
  id: string;
  userId?: string;
  userName?: string;
  authorName?: string;
  userAvatar?: string;
  authorAvatar?: string;
  imageUrl: string;
  caption?: string;
  hasViewed?: boolean;
  hasUnseen?: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  userId?: string;
  authorId?: string;
  userName: string;
  authorName?: string;
  userAvatar: string;
  authorAvatar?: string;
  authorRole?: string;
  motorcycleId?: string;
  motorcycleName?: string;
  motorcycleModel?: string;
  rideId?: string;
  ride?: any;
  content: string;
  caption?: string;
  images?: string[];
  imageUrl?: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  comments?: Comment[] | number;
  groupId?: string;
  createdAt: string;
}
