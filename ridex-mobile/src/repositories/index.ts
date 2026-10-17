export * from './interfaces';
export * from './mock';
export * from './supabase';
export * from './offline';
export * from './mappers';

import { SupabaseAuthRepository } from './supabase/SupabaseAuthRepository';
import { OfflineFirstUserRepository } from './offline/OfflineFirstUserRepository';
import { OfflineFirstMotorcycleRepository } from './offline/OfflineFirstMotorcycleRepository';
import { OfflineFirstRideRepository } from './offline/OfflineFirstRideRepository';
import { SupabaseRouteRepository } from './supabase/SupabaseRouteRepository';
import { SupabasePostRepository } from './supabase/SupabasePostRepository';
import { SupabaseCommentRepository } from './supabase/SupabaseCommentRepository';
import { SupabaseGroupRepository } from './supabase/SupabaseGroupRepository';
import { SupabaseAchievementRepository } from './supabase/SupabaseAchievementRepository';
import { SupabaseRideParticipantRepository } from './supabase/SupabaseRideParticipantRepository';
import { SupabaseLiveRideRepository } from './supabase/SupabaseLiveRideRepository';

export const supabaseRideParticipantRepository = new SupabaseRideParticipantRepository();
export const supabaseLiveRideRepository = new SupabaseLiveRideRepository();

export const repositories = {
  auth: new SupabaseAuthRepository(),
  users: new OfflineFirstUserRepository(),
  motorcycles: new OfflineFirstMotorcycleRepository(),
  rides: new OfflineFirstRideRepository(),
  routes: new SupabaseRouteRepository(),
  posts: new SupabasePostRepository(),
  comments: new SupabaseCommentRepository(),
  groups: new SupabaseGroupRepository(),
  achievements: new SupabaseAchievementRepository(),
  participants: supabaseRideParticipantRepository,
  liveRides: supabaseLiveRideRepository,
};
