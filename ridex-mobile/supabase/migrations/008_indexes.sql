-- ============================================================================
-- 008_indexes.sql: Performance Optimized Indexes
-- ============================================================================

-- PROFILES & SETTINGS INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- MOTORCYCLES INDEXES
CREATE INDEX IF NOT EXISTS idx_motorcycles_user_id ON public.motorcycles(user_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_is_primary ON public.motorcycles(user_id, is_primary);

-- RIDES & TELEMETRY INDEXES
CREATE INDEX IF NOT EXISTS idx_rides_user_id_created ON public.rides(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_visibility ON public.rides(visibility);
CREATE INDEX IF NOT EXISTS idx_rides_motorcycle_id ON public.rides(motorcycle_id);

-- GPS BREADCRUMBS INDEXES (Critical for streaming telemetry queries)
CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_recorded ON public.ride_locations(ride_id, recorded_at ASC);

-- ROUTES INDEXES
CREATE INDEX IF NOT EXISTS idx_routes_visibility_created ON public.routes(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON public.routes(difficulty);
CREATE INDEX IF NOT EXISTS idx_route_locations_route_seq ON public.route_locations(route_id, sequence_number ASC);

-- COMMUNITY & SOCIAL FEED INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility_created ON public.posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_media_post_order ON public.post_media(post_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members(group_id, user_id);

-- ACHIEVEMENTS INDEXES
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id, is_completed);
