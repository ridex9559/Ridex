-- ============================================================================
-- 009_rls.sql: Comprehensive Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. USER SETTINGS POLICIES
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. MOTORCYCLES POLICIES
CREATE POLICY "Users can view own motorcycles"
  ON public.motorcycles FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.rides WHERE rides.motorcycle_id = motorcycles.id AND rides.visibility = 'public'
  ));

CREATE POLICY "Users can insert own motorcycles"
  ON public.motorcycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own motorcycles"
  ON public.motorcycles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own motorcycles"
  ON public.motorcycles FOR DELETE
  USING (auth.uid() = user_id);

-- 4. RIDES POLICIES
CREATE POLICY "Rides are readable based on visibility"
  ON public.rides FOR SELECT
  USING (
    visibility = 'public'
    OR auth.uid() = user_id
    OR (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM public.follows
        WHERE follows.following_id = rides.user_id AND follows.follower_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own rides"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rides"
  ON public.rides FOR DELETE
  USING (auth.uid() = user_id);

-- 5. RIDE LOCATIONS POLICIES (Inherits Ride permission)
CREATE POLICY "Ride locations are viewable if parent ride is viewable"
  ON public.ride_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_locations.ride_id
      AND (
        rides.visibility = 'public'
        OR rides.user_id = auth.uid()
        OR (
          rides.visibility = 'followers'
          AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE follows.following_id = rides.user_id AND follows.follower_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can insert GPS coordinates to own rides"
  ON public.ride_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_locations.ride_id AND rides.user_id = auth.uid()
    )
  );

-- 6. ROUTES POLICIES
CREATE POLICY "Public routes are readable by everyone"
  ON public.routes FOR SELECT
  USING (visibility = 'public' OR auth.uid() = created_by);

CREATE POLICY "Users can create routes"
  ON public.routes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own routes"
  ON public.routes FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Route locations are readable"
  ON public.route_locations FOR SELECT
  USING (true);

-- 7. COMMUNITY POSTS & MEDIA POLICIES
CREATE POLICY "Posts readable based on visibility"
  ON public.posts FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Post media is readable"
  ON public.post_media FOR SELECT
  USING (true);

CREATE POLICY "Users can insert media for own posts"
  ON public.post_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid()
    )
  );

-- 8. LIKES & COMMENTS POLICIES
CREATE POLICY "Post likes are readable"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Comments are readable"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment on posts"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- 9. FOLLOWS POLICIES
CREATE POLICY "Follows are readable"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

CREATE POLICY "Users can unfollow others"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 10. GROUPS & MEMBERS POLICIES
CREATE POLICY "Groups are readable"
  ON public.groups FOR SELECT
  USING (privacy = 'public' OR created_by = auth.uid());

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group members are readable"
  ON public.group_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- 11. ACHIEVEMENTS POLICIES
CREATE POLICY "Achievements are readable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "User achievements are viewable by owner"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User achievements can be managed by owner"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User achievements can be updated by owner"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);
