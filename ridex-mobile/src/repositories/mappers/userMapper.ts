import { Database } from '../../services/supabase/types';
import { User, UserStatistics } from '../../types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class UserMapper {
  static toDomain(row: ProfileRow): User {
    const location = row.city && row.country ? `${row.city}, ${row.country}` : row.city || row.country || undefined;

    const stats: UserStatistics = {
      totalRides: 0,
      totalDistanceKm: 0,
      longestRideKm: 0,
      totalDurationSeconds: 0,
      followersCount: 0,
      followingCount: 0,
      currentStreakDays: 1,
    };

    return {
      id: row.id,
      name: row.full_name,
      username: row.username,
      email: '',
      avatarUrl: row.avatar_url ?? undefined,
      avatar: row.avatar_url ?? undefined,
      bio: row.bio ?? undefined,
      location,
      role: 'Rider',
      createdAt: row.created_at,
      statistics: stats,
    };
  }

  static toInsert(user: Partial<User>): ProfileInsert {
    return {
      id: user.id || '',
      username: user.username || '',
      full_name: user.name || '',
      avatar_url: user.avatarUrl || user.avatar || null,
      bio: user.bio || null,
      city: user.location ? user.location.split(',')[0]?.trim() || null : null,
      country: user.location ? user.location.split(',')[1]?.trim() || null : null,
    };
  }

  static toUpdate(user: Partial<User>): ProfileUpdate {
    const update: ProfileUpdate = {};
    if (user.name !== undefined) update.full_name = user.name;
    if (user.username !== undefined) update.username = user.username;
    if (user.avatarUrl !== undefined || user.avatar !== undefined) {
      update.avatar_url = user.avatarUrl ?? user.avatar ?? null;
    }
    if (user.bio !== undefined) update.bio = user.bio ?? null;
    if (user.location !== undefined) {
      if (user.location) {
        update.city = user.location.split(',')[0]?.trim() || null;
        update.country = user.location.split(',')[1]?.trim() || null;
      } else {
        update.city = null;
        update.country = null;
      }
    }
    return update;
  }
}
