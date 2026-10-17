import { repositories } from '../repositories';
import { Post, Comment, RiderGroup } from '../types';

export class CommunityService {
  private postRepo = repositories.posts;
  private commentRepo = repositories.comments;
  private groupRepo = repositories.groups;

  // Posts & Feed
  async getFeedPosts(limit = 20, offset = 0): Promise<Post[]> {
    return this.postRepo.getFeedPosts(limit, offset);
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.postRepo.getPostById(id);
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return this.postRepo.getUserPosts(userId);
  }

  async createPost(post: Partial<Post>): Promise<Post> {
    return this.postRepo.createPost(post);
  }

  async deletePost(id: string): Promise<void> {
    return this.postRepo.deletePost(id);
  }

  async toggleLike(postId: string, userId: string, isCurrentlyLiked: boolean): Promise<void> {
    if (isCurrentlyLiked) {
      await this.postRepo.unlikePost(postId, userId);
    } else {
      await this.postRepo.likePost(postId, userId);
    }
  }

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    return this.commentRepo.getCommentsByPostId(postId);
  }

  async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    return this.commentRepo.addComment(postId, userId, content);
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.commentRepo.deleteComment(commentId);
  }

  // Groups
  async getGroups(search?: string): Promise<RiderGroup[]> {
    return this.groupRepo.getGroups(search);
  }

  async getGroupById(id: string): Promise<RiderGroup | null> {
    return this.groupRepo.getGroupById(id);
  }

  async getUserGroups(userId: string): Promise<RiderGroup[]> {
    return this.groupRepo.getUserGroups(userId);
  }

  async toggleJoinGroup(groupId: string, userId: string, isCurrentlyJoined: boolean): Promise<void> {
    if (isCurrentlyJoined) {
      await this.groupRepo.leaveGroup(groupId, userId);
    } else {
      await this.groupRepo.joinGroup(groupId, userId);
    }
  }
}

export const communityService = new CommunityService();
export default communityService;
