import { ICommentRepository } from '../interfaces/ICommentRepository';
import { Comment } from '../../types';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { CommentMapper, CommentWithProfile } from '../mappers/commentMapper';

export class SupabaseCommentRepository implements ICommentRepository {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await supabaseClient
        .from('comments')
        .select('*, profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r: any) => CommentMapper.toDomain(r as CommentWithProfile));
  }

  async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    const insertPayload = CommentMapper.toInsert(postId, userId, content);

    const row = await executeQuery<any>(async () => {
      const { data: created, error } = await supabaseClient
        .from('comments')
        .insert(insertPayload as any)
        .select('*, profiles(*)')
        .single();
      if (error) throw error;
      return created;
    });

    return CommentMapper.toDomain(row as CommentWithProfile);
  }

  async deleteComment(commentId: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await supabaseClient
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      return null;
    });
  }
}
