/**
 * RIDEX Web — Community Social Feed & Posts Component
 * Authentic rider posts, like/unlike interactions, comments, and post creation.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Heart,
  Share2,
  MapPin,
  Send,
  Plus,
  Compass,
  Sparkles,
  User,
  X,
  Loader2,
  Camera,
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import { CommunityPost } from '../../types';

interface CommunityFeedProps {
  currentUserId?: string;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ currentUserId }) => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // 1. Fetch Feed Posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts', currentUserId],
    queryFn: () => communityService.getFeedPosts(currentUserId),
  });

  // 2. Create Post Mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !caption.trim()) return false;
      return communityService.createPost(currentUserId, { caption, locationName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      setCaption('');
      setLocationName('');
      setShowCreateModal(false);
    },
  });

  // 3. Like Post Mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!currentUserId) return false;
      return communityService.toggleLike(postId, currentUserId, isLiked);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  // 4. Comments Query for active post
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['postComments', activeCommentPostId],
    queryFn: () =>
      activeCommentPostId ? communityService.getComments(activeCommentPostId) : Promise.resolve([]),
    enabled: !!activeCommentPostId,
  });

  // 5. Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!activeCommentPostId || !currentUserId || !newCommentText.trim()) return false;
      return communityService.addComment(activeCommentPostId, currentUserId, newCommentText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments', activeCommentPostId] });
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      setNewCommentText('');
    },
  });

  const popularRoutes = ['Tamhini Ghat', 'Lavasa Ridge', 'Malshej Ghat', 'Amboli Pass', 'Lonavala Ghat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Interactive Create Post Bar */}
      {currentUserId && (
        <div
          className="card-glass"
          style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255, 107, 0, 0.15)',
                border: '1px solid var(--border-active)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>

            <div
              style={{
                background: 'rgba(8, 10, 15, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--text-muted)',
                fontSize: '0.84rem',
                flex: 1,
                userSelect: 'none',
              }}
            >
              Share an expedition story, pass conditions, or road alert...
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ minHeight: '38px', padding: '6px 16px', fontSize: '0.84rem' }}
          >
            <Plus size={15} />
            <span>Post</span>
          </button>
        </div>
      )}

      {/* 2. Feed Stream */}
      {isLoading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="pulse-radar" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
          <p style={{ fontSize: '0.84rem' }}>Loading touring syndicate feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 107, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Compass size={26} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>No Expedition Posts Yet</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '380px', marginTop: '4px' }}>
              Be the first rider to share a tour photo, mountain pass update, or group touring memory!
            </p>
          </div>
          {currentUserId && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ minHeight: '36px', padding: '6px 16px', fontSize: '0.82rem' }}
            >
              <Plus size={14} />
              <span>Publish First Post</span>
            </button>
          )}
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="feed-post-card">
            {/* Author Header */}
            <div className="feed-post-header">
              <div className="feed-post-author">
                <img
                  src={post.user?.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=120&q=80'}
                  alt={post.user?.fullName || 'Rider'}
                  className="feed-avatar"
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="feed-author-name">{post.user?.fullName || 'Rider'}</span>
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'rgba(0, 230, 118, 0.15)',
                        color: 'var(--success)',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                      }}
                    >
                      VERIFIED
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span className="feed-author-handle">@{post.user?.username || 'rider'}</span>
                    <span>•</span>
                    <span>{post.user?.city || 'Pune'}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {post.locationName && (
                <div className="feed-post-tag">
                  <MapPin size={12} />
                  <span>{post.locationName}</span>
                </div>
              )}
            </div>

            {/* Post Caption */}
            <p className="feed-post-caption">{post.caption}</p>

            {/* Ride Tag */}
            {post.rideTitle && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  background: 'rgba(255, 107, 0, 0.12)',
                  border: '1px solid rgba(255, 107, 0, 0.25)',
                  color: 'var(--primary)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  width: 'fit-content',
                }}
              >
                <Compass size={13} />
                <span>Expedition: {post.rideTitle}</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="feed-post-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Like Button */}
                <button
                  onClick={() => likeMutation.mutate({ postId: post.id, isLiked: !!post.isLikedByMe })}
                  className={`feed-action-btn ${post.isLikedByMe ? 'liked' : ''}`}
                >
                  <Heart
                    size={16}
                    fill={post.isLikedByMe ? '#FF3B30' : 'none'}
                    color={post.isLikedByMe ? '#FF3B30' : 'currentColor'}
                  />
                  <span>{post.likesCount}</span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                  className="feed-action-btn"
                >
                  <MessageSquare size={16} />
                  <span>{post.commentsCount} Comments</span>
                </button>
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                RIDEX Syndicate
              </span>
            </div>

            {/* Inline Comments Section */}
            {activeCommentPostId === post.id && (
              <div className="feed-comments-box">
                {isLoadingComments ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>No comments yet. Write the first response!</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="feed-comment-row">
                      <div className="feed-comment-bubble">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--cyan)' }}>
                            {c.user?.fullName || 'Rider'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            @{c.user?.username || 'rider'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#FFFFFF', lineHeight: 1.4 }}>{c.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Add Comment Input */}
                {currentUserId && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="form-input"
                      style={{ minHeight: '36px', fontSize: '0.82rem', padding: '6px 12px' }}
                    />
                    <button
                      onClick={() => addCommentMutation.mutate()}
                      disabled={!newCommentText.trim() || addCommentMutation.isPending}
                      className="btn btn-primary"
                      style={{ minHeight: '36px', padding: '6px 14px' }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* 3. Create Post Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 107, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>Publish Expedition Post</h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Share route conditions with the syndicate</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Expedition Notes & Conditions *
              </label>
              <textarea
                placeholder="What route did you tour today? How was tarmac quality, corner grip, or pass weather?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="form-input"
                rows={4}
                style={{ resize: 'none', height: '110px', fontSize: '0.84rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Location Tag / Pass Name
              </label>
              <input
                type="text"
                placeholder="e.g. Tamhini Ghat, Maharashtra"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="form-input"
                style={{ minHeight: '38px', fontSize: '0.84rem' }}
              />

              {/* Popular route suggestions */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {popularRoutes.map((route) => (
                  <button
                    key={route}
                    type="button"
                    onClick={() => setLocationName(route)}
                    style={{
                      background: locationName === route ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: locationName === route ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                      color: locationName === route ? 'var(--cyan)' : 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {route}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: '40px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => createPostMutation.mutate()}
                disabled={!caption.trim() || createPostMutation.isPending}
                className="btn btn-primary"
                style={{ flex: 2, minHeight: '40px' }}
              >
                {createPostMutation.isPending ? 'Publishing...' : 'Publish to Syndicate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
