-- ==============================================================================
-- RIDEX Database Seed Data
-- Premium Motorcycle Adventure Platform
-- Compatible with migrations 001 through 009
-- ==============================================================================

-- 1. Insert Authentication Users (auth.users)
-- Supabase profiles.id references auth.users(id)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'marcus@ridex.app',
    crypt('RideX2025!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Marcus Vance", "username": "marcus_vance", "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}'::jsonb,
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'elena@ridex.app',
    crypt('RideX2025!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Elena Rostova", "username": "elena_rostova", "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Upsert Profiles Data
INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    bio,
    city,
    country
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'marcus_vance',
    'Marcus Vance',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    'Adventure & sport tourer enthusiast. Conquered 50+ mountain passes across Europe and the Rockies.',
    'Munich',
    'Germany'
),
(
    '00000000-0000-0000-0000-000000000002',
    'elena_rostova',
    'Elena Rostova',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    'Track day junkie & canyon carver. Telemetry enthusiast and high lean-angle hunter.',
    'Bologna',
    'Italy'
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    city = EXCLUDED.city,
    country = EXCLUDED.country;

-- 3. Upsert User Settings
INSERT INTO public.user_settings (
    user_id,
    distance_unit,
    speed_unit,
    theme,
    notifications_enabled,
    location_tracking_enabled
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'km',
    'kmh',
    'oled',
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'km',
    'kmh',
    'oled',
    true,
    true
)
ON CONFLICT (user_id) DO UPDATE SET
    distance_unit = EXCLUDED.distance_unit,
    speed_unit = EXCLUDED.speed_unit,
    theme = EXCLUDED.theme;

-- 4. Insert Motorcycles (Digital Garage)
INSERT INTO public.motorcycles (
    id,
    user_id,
    manufacturer,
    model,
    year,
    displacement_cc,
    horsepower,
    registration_number,
    odometer_km,
    category,
    nickname,
    image_url,
    is_primary
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'BMW',
    'R 1250 GS Adventure',
    2023,
    1254,
    136,
    'M-GS 1250',
    18450.0,
    'ADVENTURE',
    'Iron Bison',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
    true
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Ducati',
    'Panigale V4 S',
    2024,
    1103,
    215,
    'M-DV 400',
    4200.0,
    'SPORT',
    'Red Fury',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80',
    false
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'Triumph',
    'Scrambler 1200 XE',
    2023,
    1200,
    90,
    'BO-TR 120',
    9850.0,
    'CRUISER',
    'Dusty Runner',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Curated Discovery Routes
INSERT INTO public.routes (
    id,
    created_by,
    title,
    description,
    distance_meters,
    estimated_duration_seconds,
    difficulty,
    curvature_index,
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    start_location_name,
    end_location_name,
    cover_image_url,
    visibility
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Transfăgărășan Alpine Highway',
    'Ascend through the Făgăraș Mountains with 90km of sweeping hairpins, tunnels, and dramatic viaducts. Peak elevation 2,042m at Lake Bâlea.',
    114500,
    10800,
    'advanced',
    8.8,
    45.3539,
    24.6353,
    45.7820,
    24.5800,
    'Curtea de Argeș',
    'Cârțișoara',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
    'public'
),
(
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Amalfi Coast Clifftop Odyssey',
    'Carved into limestone cliffs towering over azure Tyrrhenian waters with tight apexes and breathtaking vistas.',
    68200,
    7200,
    'moderate',
    7.6,
    40.6281,
    14.3758,
    40.6824,
    14.7681,
    'Sorrento',
    'Salerno',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80',
    'public'
),
(
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Tail of the Dragon (Deal''s Gap)',
    '318 curves in 11 miles of pure adrenaline bordered by dense forestry and high banking corners.',
    17700,
    1800,
    'expert',
    9.9,
    35.5124,
    -83.9241,
    35.4673,
    -83.9202,
    'Chilhowee, TN',
    'Deal''s Gap, NC',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
    'public'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Route Locations (Waypoints)
INSERT INTO public.route_locations (
    route_id,
    latitude,
    longitude,
    sequence_number
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    45.3539,
    24.6353,
    1
),
(
    '20000000-0000-0000-0000-000000000001',
    45.3664,
    24.6306,
    2
),
(
    '20000000-0000-0000-0000-000000000001',
    45.6041,
    24.6169,
    3
),
(
    '20000000-0000-0000-0000-000000000002',
    40.6281,
    14.3758,
    1
),
(
    '20000000-0000-0000-0000-000000000002',
    40.6333,
    14.6027,
    2
),
(
    '20000000-0000-0000-0000-000000000002',
    40.6824,
    14.7681,
    3
)
ON CONFLICT DO NOTHING;

-- 7. Insert Sample Logged Rides
INSERT INTO public.rides (
    id,
    user_id,
    motorcycle_id,
    name,
    start_time,
    end_time,
    distance_meters,
    duration_seconds,
    average_speed_kmh,
    max_speed_kmh,
    elevation_gain_meters,
    max_lean_angle_degrees,
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    status,
    visibility
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'High Alpine Morning Run',
    NOW() - INTERVAL '2 days 4 hours',
    NOW() - INTERVAL '2 days 1 hour',
    142800,
    10800,
    47.6,
    128.4,
    1450,
    48.5,
    47.4917,
    11.0955,
    47.2692,
    11.4041,
    'completed',
    'public'
),
(
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    'Tuscan Sunset Fast Sprint',
    NOW() - INTERVAL '4 days 6 hours',
    NOW() - INTERVAL '4 days 4 hours',
    88400,
    7200,
    44.2,
    118.0,
    620,
    44.0,
    43.7696,
    11.2558,
    43.3188,
    11.3308,
    'completed',
    'public'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Ride Telemetry Locations
INSERT INTO public.ride_locations (
    ride_id,
    latitude,
    longitude,
    altitude,
    speed_kmh,
    accuracy_meters,
    heading_degrees,
    recorded_at
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    47.4917,
    11.0955,
    720.0,
    52.4,
    3.5,
    180.0,
    NOW() - INTERVAL '2 days 4 hours'
),
(
    '30000000-0000-0000-0000-000000000001',
    47.3800,
    11.2500,
    1280.0,
    68.2,
    2.8,
    195.0,
    NOW() - INTERVAL '2 days 3 hours'
),
(
    '30000000-0000-0000-0000-000000000001',
    47.2692,
    11.4041,
    574.0,
    45.0,
    4.0,
    160.0,
    NOW() - INTERVAL '2 days 1 hour'
)
ON CONFLICT DO NOTHING;

-- 9. Insert Achievements
INSERT INTO public.achievements (
    id,
    code,
    title,
    description,
    icon,
    category,
    requirement_value,
    unit
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    'IRON_BUTT_1000',
    'Iron Butt Millennium',
    'Ride over 1,000 kilometers in a single continuous expedition.',
    'shield',
    'distance',
    1000,
    'KM'
),
(
    '40000000-0000-0000-0000-000000000002',
    'APEX_PREDATOR_50',
    'Apex Predator',
    'Achieve a recorded lean angle exceeding 50 degrees on a verified route.',
    'compass',
    'lean',
    50,
    'degrees'
),
(
    '40000000-0000-0000-0000-000000000003',
    'MOUNTAIN_KING_3000',
    'Alpine Conqueror',
    'Accumulate over 3,000 meters of total elevation gain in one ride.',
    'mountain',
    'elevation',
    3000,
    'meters'
),
(
    '40000000-0000-0000-0000-000000000004',
    'CENTURY_CLUB',
    'Century Club',
    'Complete 100 logged rides on RIDEX.',
    'award',
    'milestone',
    100,
    'rides'
),
(
    '40000000-0000-0000-0000-000000000005',
    'PACK_LEADER',
    'Road Captain',
    'Lead and organize 5 group rides with 5+ riders each.',
    'users',
    'social',
    5,
    'rides'
)
ON CONFLICT (code) DO NOTHING;

-- 10. Insert User Achievements Progress
INSERT INTO public.user_achievements (
    user_id,
    achievement_id,
    progress,
    is_completed,
    completed_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    51.5,
    true,
    NOW() - INTERVAL '10 days'
),
(
    '00000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000004',
    142,
    true,
    NOW() - INTERVAL '20 days'
),
(
    '00000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    742,
    false,
    NULL
)
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- 11. Insert Rider Groups
INSERT INTO public.groups (
    id,
    name,
    description,
    region,
    badge,
    cover_image_url,
    avatar_url,
    created_by,
    privacy,
    members_count
) VALUES 
(
    '50000000-0000-0000-0000-000000000001',
    'Alpine Throttle Guild',
    'Dedicated to high-altitude passes, hairpin carving, and multi-day Alpine expeditions.',
    'Europe / Alps',
    'PRO CLUB',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&q=80',
    '00000000-0000-0000-0000-000000000001',
    'public',
    148
),
(
    '50000000-0000-0000-0000-000000000002',
    'Midnight Canyon Runners',
    'Night rides, canyon apexes, and precision riding under streetlights and stars.',
    'North America / West',
    'ELITE',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&q=80',
    '00000000-0000-0000-0000-000000000002',
    'public',
    89
)
ON CONFLICT (id) DO NOTHING;

-- 12. Insert Group Members
INSERT INTO public.group_members (
    group_id,
    user_id,
    role
) VALUES 
(
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'owner'
),
(
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'member'
),
(
    '50000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'owner'
)
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 13. Insert Community Posts
INSERT INTO public.posts (
    id,
    user_id,
    motorcycle_id,
    ride_id,
    caption,
    location_name,
    visibility,
    likes_count,
    comments_count
) VALUES 
(
    '60000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Incredible early morning session across the Grossglockner High Alpine Road! Zero traffic, crisp 6°C air, and pure boxer twin symphony. Telemetry shows our best average speed yet.',
    'Grossglockner, Austria',
    'public',
    124,
    18
),
(
    '60000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    NULL,
    'Fresh Pirelli Scorpion Rally STRs fitted on the Scrambler. Weekend gravel pass scouting starts tomorrow at dawn. Who is joining from Florence?',
    'Florence, Italy',
    'public',
    89,
    12
)
ON CONFLICT (id) DO NOTHING;

-- 14. Insert Post Media
INSERT INTO public.post_media (
    post_id,
    media_url,
    media_type,
    display_order
) VALUES 
(
    '60000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=80',
    'image',
    0
),
(
    '60000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=80',
    'image',
    0
)
ON CONFLICT DO NOTHING;

-- 15. Insert Comments
INSERT INTO public.comments (
    id,
    post_id,
    user_id,
    content
) VALUES 
(
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Those GS boxer curves look magnificent! Did you hit any morning black ice near the glacier?'
),
(
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Clean dry tarmac all the way to the peak! Traction control barely blinked.'
)
ON CONFLICT (id) DO NOTHING;

-- 16. Insert Follows
INSERT INTO public.follows (
    follower_id,
    following_id
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (follower_id, following_id) DO NOTHING;
