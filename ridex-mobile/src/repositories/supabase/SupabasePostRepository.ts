import { IPostRepository } from '../interfaces/IPostRepository';
import { Post } from '../../types';
import { supabaseClient } from '../../services/supabase/client';
import { executeQuery } from '../../services/supabase/database';
import { PostMapper, PostWithRelations } from '../mappers/postMapper';

export class SupabasePostRepository implements IPostRepository {
  async getFeedPosts(limit = 20, offset = 0): Promise<Post[]> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const currentUserId = user?.id;

    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          profiles(*),
          motorcycles(*),
          post_media(media_url),
          comments(
            id,
            content,
            created_at,
            profiles(*)
          ),
          post_likes(user_id)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r: any) => PostMapper.toDomain(r as PostWithRelations, currentUserId));
  }

  async getPostById(id: string): Promise<Post | null> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const currentUserId = user?.id;

    const row = await executeQuery<any>(async () => {
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          profiles(*),
          motorcycles(*),
          post_media(media_url),
          comments(
            id,
            content,
            created_at,
            profiles(*)
          ),
          post_likes(user_id)
        `)
        .eq('id', id)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    });

    if (!row) return null;
    return PostMapper.toDomain(row as PostWithRelations, currentUserId);
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const currentUserId = user?.id;

    const rows = await executeQuery<any[]>(async () => {
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          profiles(*),
          motorcycles(*),
          post_media(media_url),
          comments(
            id,
            content,
            created_at,
            profiles(*)
          ),
          post_likes(user_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    });

    return (rows || []).map((r: any) => PostMapper.toDomain(r as PostWithRelations, currentUserId));
  }

  async createPost(post: Partial<Post>): Promise<Post> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = post.userId || user?.id || '00000000-0000-0000-0000-000000000000';
    const insertPayload = PostMapper.toInsert(userId, post);

    const row = await executeQuery<any>(async () => {
      const { data: created, error } = await supabaseClient
        .from('posts')
        .insert(insertPayload as any)
        .select()
        .single();
      if (error) throw error;
      return created;
    });

    // If media images provided, insert into post_media
    const images = post.images || (post.imageUrl ? [post.imageUrl] : []);
    if (images.length > 0) {
      await executeQuery(async () => {
        const mediaInserts = images.map((url, idx) => ({
          post_id: row.id,
          media_url: url,
          media_type: 'image',
          display_order: idx,
        }));
        const { error } = await supabaseClient
          .from('post_media')
          .insert(mediaInserts as any);
        if (error) throw error;
        return null;
      });
    }

    return (await this.getPostById(row.id))!;
  }

  async deletePost(id: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await supabaseClient
        .from('posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return null;
    });
  }

  async likePost(postId: string, userId: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await supabaseClient
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId } as any);
      if (error && error.code !== '23505') throw error;
      return null;
    });
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await executeQuery(async () => {
      const { error } = await supabaseClient
        .from('post_likes')
        .delete()
        .match({ post_id: postId, user_id: userId } as any);
      if (error) throw error;
      return null;
    });
  }
}
