import { Post } from '../../types';

export interface IPostRepository {
  getFeedPosts(limit?: number, offset?: number): Promise<Post[]>;
  getPostById(id: string): Promise<Post | null>;
  getUserPosts(userId: string): Promise<Post[]>;
  createPost(post: Partial<Post>): Promise<Post>;
  deletePost(id: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
}
