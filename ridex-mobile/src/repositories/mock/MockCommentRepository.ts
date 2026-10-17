import { ICommentRepository } from '../interfaces/ICommentRepository';
import { Comment } from '../../types';
import { mockCurrentUser } from '../../data/users';

export class MockCommentRepository implements ICommentRepository {
  private comments: Map<string, Comment[]> = new Map([
    [
      'p-1',
      [
        {
          id: 'c-1',
          authorName: 'Marcus Vance',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
          text: '51 degrees is insane on that surface! What compound tires were you running?',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'c-2',
          authorName: 'Elena Rostova',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
          text: 'Pirelli Supercorsa V3 SP! Grip was flawless throughout the pass.',
          createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        },
      ],
    ],
  ]);

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.comments.get(postId) || [];
  }

  async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      authorName: mockCurrentUser.name,
      authorAvatar: mockCurrentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
      text: content,
      createdAt: new Date().toISOString(),
    };

    const existing = this.comments.get(postId) || [];
    this.comments.set(postId, [...existing, newComment]);
    return newComment;
  }

  async deleteComment(commentId: string): Promise<void> {
    for (const [postId, list] of this.comments.entries()) {
      this.comments.set(
        postId,
        list.filter((c) => c.id !== commentId)
      );
    }
  }
}
