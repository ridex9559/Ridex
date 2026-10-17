import { Database } from '../../services/supabase/types';
import { Comment } from '../../types';

type CommentRow = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface CommentWithProfile extends CommentRow {
  profiles?: ProfileRow | null;
}

export class CommentMapper {
  static toDomain(row: CommentWithProfile): Comment {
    return {
      id: row.id,
      authorName: row.profiles?.full_name || 'Rider',
      authorAvatar: row.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      text: row.content,
      createdAt: row.created_at,
    };
  }

  static toInsert(postId: string, userId: string, content: string): CommentInsert {
    return {
      post_id: postId,
      user_id: userId,
      content: content.trim(),
    };
  }
}
