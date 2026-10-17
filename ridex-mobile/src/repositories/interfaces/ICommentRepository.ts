import { Comment } from '../../types';

export interface ICommentRepository {
  getCommentsByPostId(postId: string): Promise<Comment[]>;
  addComment(postId: string, userId: string, content: string): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
}
