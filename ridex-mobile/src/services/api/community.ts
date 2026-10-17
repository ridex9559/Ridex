/**
 * Community, Posts, and Stories API Service
 */

import { apiClient } from './client';
import { env } from '@/config/env';
import { Post, RiderGroup, Story } from '@/types';
import { MOCK_POSTS, MOCK_STORIES } from '@/data/posts';

class CommunityService {
  async getStories(): Promise<Story[]> {
    if (env.useMockData) {
      return MOCK_STORIES;
    }
    const res = await apiClient.get<Story[]>('/community/stories');
    return res.data;
  }

  async getFeed(): Promise<Post[]> {
    if (env.useMockData) {
      return MOCK_POSTS;
    }
    const res = await apiClient.get<Post[]>('/community/posts');
    return res.data;
  }

  async createPost(post: Partial<Post>): Promise<Post> {
    if (env.useMockData) {
      const created: Post = {
        id: `post-${Date.now()}`,
        userName: post.userName || 'Alex Turner',
        userAvatar: post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        content: post.content || post.caption || '',
        motorcycleName: post.motorcycleName || 'Ducati Multistrada V4 S',
        likesCount: 1,
        isLiked: true,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };
      return created;
    }

    const res = await apiClient.post<Post>('/community/posts', post);
    return res.data;
  }

  async likePost(postId: string): Promise<boolean> {
    if (env.useMockData) {
      return true;
    }
    await apiClient.post(`/community/posts/${postId}/like`);
    return true;
  }
}

export const communityService = new CommunityService();

export async function fetchCommunityStories(): Promise<Story[]> {
  return communityService.getStories();
}

export async function fetchCommunityFeed(): Promise<Post[]> {
  return communityService.getFeed();
}

export async function createCommunityPost(post: Partial<Post>): Promise<Post> {
  return communityService.createPost(post);
}

export default communityService;
