import { Database } from '../../services/supabase/types';
import { Post, Comment } from '../../types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type MotorcycleRow = Database['public']['Tables']['motorcycles']['Row'];

export interface PostWithRelations extends PostRow {
  profiles?: ProfileRow | null;
  motorcycles?: MotorcycleRow | null;
  post_media?: { media_url: string }[];
  comments?: {
    id: string;
    content: string;
    created_at: string;
    profiles?: ProfileRow | null;
  }[];
  post_likes?: { user_id: string }[];
}

export class PostMapper {
  static toDomain(row: PostWithRelations, currentUserId?: string): Post {
    const author = row.profiles;
    const bike = row.motorcycles;
    const media = row.post_media || [];
    const commentsRaw = row.comments || [];
    const likes = row.post_likes || [];

    const isLiked = currentUserId ? likes.some((l) => l.user_id === currentUserId) : false;

    const mappedComments: Comment[] = commentsRaw.map((c) => ({
      id: c.id,
      authorName: c.profiles?.full_name || 'Rider',
      authorAvatar: c.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      text: c.content,
      createdAt: c.created_at,
    }));

    const images = media.map((m) => m.media_url);

    return {
      id: row.id,
      userId: row.user_id,
      authorId: row.user_id,
      userName: author?.full_name || 'Rider',
      authorName: author?.full_name || 'Rider',
      userAvatar: author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      authorAvatar: author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      authorRole: 'Rider',
      motorcycleId: row.motorcycle_id ?? undefined,
      motorcycleName: bike ? `${bike.manufacturer} ${bike.model}` : undefined,
      motorcycleModel: bike ? `${bike.manufacturer} ${bike.model}` : undefined,
      content: row.caption,
      caption: row.caption,
      images: images.length > 0 ? images : undefined,
      imageUrl: images.length > 0 ? images[0] : undefined,
      likesCount: row.likes_count || 0,
      isLiked,
      commentsCount: row.comments_count || 0,
      comments: mappedComments.length > 0 ? mappedComments : undefined,
      rideId: row.ride_id ?? undefined,
      createdAt: row.created_at,
    };
  }

  static toInsert(userId: string, post: Partial<Post>): PostInsert {
    return {
      id: post.id,
      user_id: userId,
      motorcycle_id: post.motorcycleId || null,
      ride_id: post.rideId || null,
      caption: post.content || post.caption || '',
      likes_count: 0,
      comments_count: 0,
      visibility: 'public',
    };
  }
}
