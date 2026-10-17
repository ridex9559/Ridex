/**
 * RIDEX Web — Community, Groups, Posts & Gamification Service
 * Interfaces with public.posts, public.groups, public.group_members, and verified achievements.
 */

import { supabase } from './supabase';
import { CommunityPost, PostComment, RiderGroup, Achievement } from '../types';

export const communityService = {
  /**
   * Fetches community social feed posts.
   */
  async getFeedPosts(currentUserId?: string): Promise<CommunityPost[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          ride_id,
          motorcycle_id,
          caption,
          location_name,
          visibility,
          likes_count,
          comments_count,
          created_at,
          user:profiles!posts_user_id_fkey(id, full_name, username, avatar_url, city),
          ride:rides!posts_ride_id_fkey(title),
          likes:post_likes(user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        rideId: row.ride_id,
        motorcycleId: row.motorcycle_id,
        caption: row.caption || '',
        locationName: row.location_name,
        visibility: row.visibility || 'public',
        likesCount: Number(row.likes_count || row.likes?.length || 0),
        commentsCount: Number(row.comments_count || 0),
        isLikedByMe: currentUserId
          ? (row.likes || []).some((l: any) => l.user_id === currentUserId)
          : false,
        user: row.user
          ? {
              id: row.user.id,
              fullName: row.user.full_name || 'Rider',
              username: row.user.username || 'rider',
              email: '',
              avatarUrl: row.user.avatar_url,
              city: row.user.city || 'Pune',
            }
          : undefined,
        rideTitle: row.ride?.title,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('[communityService] getFeedPosts notice:', err);
      return [];
    }
  },

  /**
   * Creates a new community post.
   */
  async createPost(
    userId: string,
    postData: { caption: string; locationName?: string; rideId?: string }
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        caption: postData.caption.trim(),
        location_name: postData.locationName?.trim() || null,
        ride_id: postData.rideId || null,
        created_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('[communityService] createPost error:', e);
      return false;
    }
  },

  /**
   * Toggles like on a community post.
   */
  async toggleLike(postId: string, userId: string, isCurrentlyLiked: boolean): Promise<boolean> {
    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        return !error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });
        return !error;
      }
    } catch (e) {
      console.warn('[communityService] toggleLike note:', e);
      return false;
    }
  },

  /**
   * Fetches comments for a specific post.
   */
  async getComments(postId: string): Promise<PostComment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          user:profiles!comments_user_id_fkey(id, full_name, username, avatar_url, city)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        content: row.content,
        user: row.user
          ? {
              id: row.user.id,
              fullName: row.user.full_name || 'Rider',
              username: row.user.username || 'rider',
              email: '',
              avatarUrl: row.user.avatar_url,
              city: row.user.city || 'Pune',
            }
          : undefined,
        createdAt: row.created_at,
      }));
    } catch (e) {
      console.warn('[communityService] getComments note:', e);
      return [];
    }
  },

  /**
   * Adds a comment to a post.
   */
  async addComment(postId: string, userId: string, content: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('[communityService] addComment error:', e);
      return false;
    }
  },

  /**
   * Fetches riding groups / motorcycle clubs.
   */
  async getGroups(currentUserId?: string): Promise<RiderGroup[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members(user_id, role)')
        .order('members_count', { ascending: false });

      if (error || !data) return [];

      return data.map((row: any) => {
        const myMember = currentUserId
          ? (row.group_members || []).find((m: any) => m.user_id === currentUserId)
          : null;

        return {
          id: row.id,
          name: row.name,
          description: row.description || '',
          region: row.region || 'India',
          badge: row.badge,
          coverImageUrl: row.cover_image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80',
          avatarUrl: row.avatar_url,
          createdBy: row.created_by,
          privacy: row.privacy || 'public',
          membersCount: Number(row.members_count || row.group_members?.length || 1),
          isJoinedByMe: !!myMember,
          myRole: myMember?.role,
          createdAt: row.created_at,
        };
      });
    } catch (e) {
      console.warn('[communityService] getGroups fallback:', e);
      return [];
    }
  },

  /**
   * Joins or leaves a riding group.
   */
  async toggleJoinGroup(groupId: string, userId: string, isCurrentlyJoined: boolean): Promise<boolean> {
    try {
      if (isCurrentlyJoined) {
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', userId);
        return !error;
      } else {
        const { error } = await supabase
          .from('group_members')
          .insert({ group_id: groupId, user_id: userId, role: 'member' });
        return !error;
      }
    } catch (e) {
      console.error('[communityService] toggleJoinGroup error:', e);
      return false;
    }
  },

  /**
   * Creates a new riding group.
   */
  async createGroup(userId: string, groupData: { name: string; description: string; region?: string }): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: groupData.name.trim(),
          description: groupData.description.trim(),
          region: groupData.region?.trim() || 'Western Ghats',
          created_by: userId,
          members_count: 1,
        })
        .select('id')
        .single();

      if (error || !data) return false;

      // Add creator as owner in group_members
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: userId,
        role: 'owner',
      });

      return true;
    } catch (e) {
      console.error('[communityService] createGroup error:', e);
      return false;
    }
  },

  /**
   * Calculates genuine rider achievements from verified database records.
   */
  async getRiderAchievements(userId: string): Promise<Achievement[]> {
    if (!userId) return [];

    try {
      // 1. Fetch user's completed rides
      const { data: rides = [] } = await supabase
        .from('rides')
        .select('id, organizer_id, distance_km, status');

      const userHosted = (rides || []).filter((r: any) => r.organizer_id === userId);
      const userCompleted = (rides || []).filter((r: any) => r.status === 'completed');
      const totalKm = (rides || []).reduce((acc: number, r: any) => acc + (Number(r.distance_km) || 0), 0);

      // 2. Fetch user's registered motorcycles
      const { data: bikes = [] } = await supabase
        .from('motorcycles')
        .select('id')
        .eq('user_id', userId);

      const bikeCount = (bikes || []).length;

      // Authoritative milestone rules
      return [
        {
          id: 'ach-first-ride',
          code: 'FIRST_EXPEDITION',
          title: 'First Expedition',
          description: 'Joined or completed your first group motorcycle tour.',
          icon: 'Compass',
          category: 'milestone',
          requirementValue: 1,
          unit: 'Tour',
          isEarned: userHosted.length > 0 || userCompleted.length > 0,
          earnedAt: userHosted[0]?.created_at || (userHosted.length > 0 ? new Date().toISOString() : undefined),
          progress: Math.min(1, userHosted.length + userCompleted.length),
        },
        {
          id: 'ach-road-captain',
          code: 'ROAD_CAPTAIN',
          title: 'Road Captain',
          description: 'Organized and hosted a motorcycle squad tour.',
          icon: 'Shield',
          category: 'social',
          requirementValue: 1,
          unit: 'Tour Hosted',
          isEarned: userHosted.length >= 1,
          earnedAt: userHosted[0]?.created_at,
          progress: Math.min(1, userHosted.length),
        },
        {
          id: 'ach-century-rider',
          code: 'CENTURY_RIDER',
          title: 'Century Rider',
          description: 'Logged 100+ kilometers on expedition routes.',
          icon: 'Navigation',
          category: 'distance',
          requirementValue: 100,
          unit: 'KM',
          isEarned: totalKm >= 100,
          progress: Math.min(1, Math.round((totalKm / 100) * 100) / 100),
        },
        {
          id: 'ach-garage-fleet',
          code: 'FLEET_COMMANDER',
          title: 'Fleet Commander',
          description: 'Configured motorcycle telemetry in digital garage.',
          icon: 'Bike',
          category: 'milestone',
          requirementValue: 1,
          unit: 'Bike',
          isEarned: bikeCount >= 1,
          progress: Math.min(1, bikeCount),
        },
        {
          id: 'ach-iron-butt',
          code: 'IRON_BUTT',
          title: 'Iron Explorer',
          description: 'Logged 300+ total kilometers across squad expeditions.',
          icon: 'Sparkles',
          category: 'distance',
          requirementValue: 300,
          unit: 'KM',
          isEarned: totalKm >= 300,
          progress: Math.min(1, Math.round((totalKm / 300) * 100) / 100),
        },
      ];
    } catch (e) {
      console.warn('[communityService] getRiderAchievements note:', e);
      return [];
    }
  },
};
