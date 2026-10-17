import { useState, useEffect, useCallback } from 'react';
import { communityService } from '../services/CommunityService';
import { Post, Comment, RiderGroup } from '../types';

export function useCommunity(currentUserId = 'usr-1') {
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<RiderGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedPosts, communityGroups] = await Promise.all([
        communityService.getFeedPosts(20),
        communityService.getGroups(),
      ]);
      setPosts(feedPosts);
      setGroups(communityGroups);
    } catch (err: any) {
      setError(err?.message || 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const toggleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked;
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !wasLiked,
            likesCount: wasLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
          };
        }
        return p;
      })
    );

    try {
      await communityService.toggleLike(postId, currentUserId, wasLiked);
    } catch (err) {
      // Revert optimistic update
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLiked: wasLiked, likesCount: post.likesCount } : p))
      );
    }
  };

  const addComment = async (postId: string, text: string) => {
    try {
      const newComment = await communityService.addComment(postId, currentUserId, text);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const existingComments = Array.isArray(p.comments) ? p.comments : [];
            const comments = [...existingComments, newComment];
            return {
              ...p,
              comments,
              commentsCount: (p.commentsCount || 0) + 1,
            };
          }
          return p;
        })
      );
      return newComment;
    } catch (err: any) {
      setError(err?.message || 'Failed to post comment');
      throw err;
    }
  };

  const createPost = async (postData: Partial<Post>) => {
    try {
      const created = await communityService.createPost({ ...postData, userId: currentUserId });
      setPosts((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to create post');
      throw err;
    }
  };

  const toggleJoinGroup = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const wasJoined = group.isJoined || false;
    // Optimistic UI update
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            isJoined: !wasJoined,
            membersCount: wasJoined ? Math.max(0, g.membersCount - 1) : g.membersCount + 1,
          };
        }
        return g;
      })
    );

    try {
      await communityService.toggleJoinGroup(groupId, currentUserId, wasJoined);
    } catch (err) {
      // Revert
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, isJoined: wasJoined, membersCount: group.membersCount } : g))
      );
    }
  };

  return {
    posts,
    groups,
    loading,
    error,
    refresh: fetchCommunityData,
    toggleLike,
    addComment,
    createPost,
    toggleJoinGroup,
  };
}
