import { Database } from '../../services/supabase/types';
import { RiderGroup } from '../../types';

type GroupRow = Database['public']['Tables']['groups']['Row'];

export class GroupMapper {
  static toDomain(row: GroupRow, isJoined = false): RiderGroup {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      coverImage: row.cover_image_url ?? undefined,
      icon: 'users',
      region: row.region ?? undefined,
      badge: row.badge ?? undefined,
      membersCount: row.members_count || 0,
      isJoined,
    };
  }
}
