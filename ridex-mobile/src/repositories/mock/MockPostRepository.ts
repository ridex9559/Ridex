import { IPostRepository } from '../interfaces/IPostRepository';
import { Post } from '../../types';
import { mockPosts } from '../../data/posts';
import { mockCurrentUser } from '../../data/users';

export class MockPostRepository implements IPostRepository {
  private posts: Post[] = [...mockPosts];
  private userLikes: Set<string> = new Set(['p-2']);

  async getFeedPosts(limit = 20, offset = 0): Promise<Post[]> {
    return this.posts.slice(offset, offset + limit).map((p) => ({
      ...p,
      isLiked: this.userLikes.has(p.id),
    }));
  }

  async getPostById(id: string): Promise<Post | null> {
    const post = this.posts.find((p) => p.id === id);
    if (!post) return null;
    return {
      ...post,
      isLiked: this.userLikes.has(post.id),
    };
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return this.posts
      .filter((p) => p.authorId === userId || p.userId === userId)
      .map((p) => ({ ...p, isLiked: this.userLikes.has(p.id) }));
  }

  async createPost(post: Partial<Post>): Promise<Post> {
    const newPost: Post = {
      id: post.id || `p-${Date.now()}`,
      userId: post.userId || mockCurrentUser.id,
      authorId: post.authorId || post.userId || mockCurrentUser.id,
      userName: post.userName || post.authorName || mockCurrentUser.name,
      authorName: post.authorName || post.userName || mockCurrentUser.name,
      userAvatar: post.userAvatar || post.authorAvatar || mockCurrentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
      authorAvatar: post.authorAvatar || post.userAvatar || mockCurrentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
      authorRole: post.authorRole || mockCurrentUser.role || 'Tour Captain',
      motorcycleId: post.motorcycleId,
      motorcycleName: post.motorcycleName || post.motorcycleModel,
      motorcycleModel: post.motorcycleModel || post.motorcycleName,
      content: post.content || post.caption || '',
      caption: post.caption || post.content || '',
      images: post.images || (post.imageUrl ? [post.imageUrl] : []),
      imageUrl: post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : undefined),
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      rideId: post.rideId,
      ride: post.ride,
      createdAt: new Date().toISOString(),
    };

    this.posts.unshift(newPost);
    return newPost;
  }

  async deletePost(id: string): Promise<void> {
    this.posts = this.posts.filter((p) => p.id !== id);
    this.userLikes.delete(id);
  }

  async likePost(postId: string, userId: string): Promise<void> {
    this.userLikes.add(postId);
    const post = this.posts.find((p) => p.id === postId);
    if (post) {
      post.likesCount += 1;
      post.isLiked = true;
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    this.userLikes.delete(postId);
    const post = this.posts.find((p) => p.id === postId);
    if (post && post.likesCount > 0) {
      post.likesCount -= 1;
      post.isLiked = false;
    }
  }
}
