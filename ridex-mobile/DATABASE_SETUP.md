# 🚀 RIDEX — Supabase & Database Setup Guide

This guide walks you through setting up the free-tier Supabase PostgreSQL backend for RIDEX in under 5 minutes.

---

## 1. Create a Free Supabase Project

1. Visit [supabase.com](https://supabase.com) and click **Start your project** (Free plan, 0 credit card required).
2. Create a new organization (e.g. `RIDEX Dev`) and click **New Project**.
3. Fill in:
   - **Name**: `ridex-backend`
   - **Database Password**: Generate a secure password and store it.
   - **Region**: Choose the closest region to your location (e.g. `Central EU (Frankfurt)` or `South Asia (Mumbai)`).
4. Click **Create new project** and wait ~1 minute for provisioning.

---

## 2. Apply Database Migrations

Open the **SQL Editor** in your Supabase dashboard and run each migration in numerical sequence:

| Step | Migration File | Description |
| :--- | :--- | :--- |
| 1 | `supabase/migrations/001_initial_schema.sql` | Enables UUID/PostGIS extensions & `handle_updated_at` trigger |
| 2 | `supabase/migrations/002_profiles.sql` | Creates `profiles` & `user_settings` with auto-trigger on signup |
| 3 | `supabase/migrations/003_motorcycles.sql` | Creates `motorcycles` digital garage table |
| 4 | `supabase/migrations/004_rides.sql` | Creates `rides` & high-volume `ride_locations` tables |
| 5 | `supabase/migrations/005_routes.sql` | Creates `routes` & `route_locations` discovery tables |
| 6 | `supabase/migrations/006_community.sql` | Creates `posts`, `comments`, `likes`, `follows`, `groups` |
| 7 | `supabase/migrations/007_achievements.sql` | Creates `achievements` & `user_achievements` progress tables |
| 8 | `supabase/migrations/008_indexes.sql` | Creates performance indexes for fast feed & search queries |
| 9 | `supabase/migrations/009_rls.sql` | Applies strict Row Level Security policies across all tables |

---

## 3. Seed Realistic Test Data

In the **SQL Editor**, run the contents of:
- `supabase/seed.sql`

This populates sample rider profiles (Marcus Vance, Elena Rostova), motorcycles (BMW GS, Ducati Panigale, Triumph Scrambler), curated alpine routes (Transfăgărășan, Amalfi Coast, Tail of the Dragon), telemetry breadcrumbs, achievements, and social posts.

---

## 4. Configure Mobile App Environment Variables

1. Go to your Supabase Project **Settings -> API**.
2. Copy:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **Anon Public API Key** (e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. Open `ridex-mobile/.env` and update:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Set to false to switch from Mock Data to live Supabase PostgreSQL
EXPO_PUBLIC_USE_MOCK_DATA=false
```

---

## 5. Switch Between Mock and Live Mode

- **Mock Mode (`EXPO_PUBLIC_USE_MOCK_DATA=true`)**:
  - The app runs completely self-contained with in-memory CRUD state.
  - Zero external dependencies or network required.

- **Live Mode (`EXPO_PUBLIC_USE_MOCK_DATA=false`)**:
  - The app connects directly to your Supabase PostgreSQL instance.
  - All rides, garage updates, social interactions, and trophies sync to PostgreSQL with RLS protection.
