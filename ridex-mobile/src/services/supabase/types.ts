/**
 * PostgreSQL / Supabase Database Schema Type Definitions for RIDEX
 * Matches supabase/migrations/ 001-009 with 100% precision.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          distance_unit: 'km' | 'miles';
          speed_unit: 'kmh' | 'mph';
          theme: 'dark' | 'oled';
          notifications_enabled: boolean;
          location_tracking_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          distance_unit?: 'km' | 'miles';
          speed_unit?: 'kmh' | 'mph';
          theme?: 'dark' | 'oled';
          notifications_enabled?: boolean;
          location_tracking_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          distance_unit?: 'km' | 'miles';
          speed_unit?: 'kmh' | 'mph';
          theme?: 'dark' | 'oled';
          notifications_enabled?: boolean;
          location_tracking_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      motorcycles: {
        Row: {
          id: string;
          user_id: string;
          manufacturer: string;
          model: string;
          year: number;
          displacement_cc: number;
          horsepower: number | null;
          registration_number: string | null;
          odometer_km: number;
          category: string;
          nickname: string | null;
          image_url: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          manufacturer: string;
          model: string;
          year: number;
          displacement_cc?: number;
          horsepower?: number | null;
          registration_number?: string | null;
          odometer_km?: number;
          category?: string;
          nickname?: string | null;
          image_url?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          manufacturer?: string;
          model?: string;
          year?: number;
          displacement_cc?: number;
          horsepower?: number | null;
          registration_number?: string | null;
          odometer_km?: number;
          category?: string;
          nickname?: string | null;
          image_url?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      rides: {
        Row: {
          id: string;
          user_id: string;
          motorcycle_id: string;
          name: string;
          start_time: string;
          end_time: string | null;
          distance_meters: number;
          duration_seconds: number;
          average_speed_kmh: number;
          max_speed_kmh: number;
          elevation_gain_meters: number;
          max_lean_angle_degrees: number | null;
          start_latitude: number | null;
          start_longitude: number | null;
          end_latitude: number | null;
          end_longitude: number | null;
          status: 'draft' | 'active' | 'completed' | 'cancelled';
          visibility: 'private' | 'followers' | 'public';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          motorcycle_id: string;
          name?: string;
          start_time?: string;
          end_time?: string | null;
          distance_meters?: number;
          duration_seconds?: number;
          average_speed_kmh?: number;
          max_speed_kmh?: number;
          elevation_gain_meters?: number;
          max_lean_angle_degrees?: number | null;
          start_latitude?: number | null;
          start_longitude?: number | null;
          end_latitude?: number | null;
          end_longitude?: number | null;
          status?: 'draft' | 'active' | 'completed' | 'cancelled';
          visibility?: 'private' | 'followers' | 'public';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          motorcycle_id?: string;
          name?: string;
          start_time?: string;
          end_time?: string | null;
          distance_meters?: number;
          duration_seconds?: number;
          average_speed_kmh?: number;
          max_speed_kmh?: number;
          elevation_gain_meters?: number;
          max_lean_angle_degrees?: number | null;
          start_latitude?: number | null;
          start_longitude?: number | null;
          end_latitude?: number | null;
          end_longitude?: number | null;
          status?: 'draft' | 'active' | 'completed' | 'cancelled';
          visibility?: 'private' | 'followers' | 'public';
          created_at?: string;
          updated_at?: string;
        };
      };
      ride_locations: {
        Row: {
          id: string;
          ride_id: string;
          latitude: number;
          longitude: number;
          altitude: number;
          speed_kmh: number;
          accuracy_meters: number | null;
          heading_degrees: number | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ride_id: string;
          latitude: number;
          longitude: number;
          altitude?: number;
          speed_kmh?: number;
          accuracy_meters?: number | null;
          heading_degrees?: number | null;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ride_id?: string;
          latitude?: number;
          longitude?: number;
          altitude?: number;
          speed_kmh?: number;
          accuracy_meters?: number | null;
          heading_degrees?: number | null;
          recorded_at?: string;
          created_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          description: string | null;
          distance_meters: number;
          estimated_duration_seconds: number;
          difficulty: 'easy' | 'moderate' | 'advanced' | 'expert';
          curvature_index: number | null;
          start_latitude: number;
          start_longitude: number;
          end_latitude: number;
          end_longitude: number;
          start_location_name: string;
          end_location_name: string;
          cover_image_url: string | null;
          visibility: 'private' | 'public';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          title: string;
          description?: string | null;
          distance_meters: number;
          estimated_duration_seconds: number;
          difficulty?: 'easy' | 'moderate' | 'advanced' | 'expert';
          curvature_index?: number | null;
          start_latitude: number;
          start_longitude: number;
          end_latitude: number;
          end_longitude: number;
          start_location_name: string;
          end_location_name: string;
          cover_image_url?: string | null;
          visibility?: 'private' | 'public';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          distance_meters?: number;
          estimated_duration_seconds?: number;
          difficulty?: 'easy' | 'moderate' | 'advanced' | 'expert';
          curvature_index?: number | null;
          start_latitude?: number;
          start_longitude?: number;
          end_latitude?: number;
          end_longitude?: number;
          start_location_name?: string;
          end_location_name?: string;
          cover_image_url?: string | null;
          visibility?: 'private' | 'public';
          created_at?: string;
          updated_at?: string;
        };
      };
      route_locations: {
        Row: {
          id: string;
          route_id: string;
          latitude: number;
          longitude: number;
          sequence_number: number;
        };
        Insert: {
          id?: string;
          route_id: string;
          latitude: number;
          longitude: number;
          sequence_number: number;
        };
        Update: {
          id?: string;
          route_id?: string;
          latitude?: number;
          longitude?: number;
          sequence_number?: number;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          ride_id: string | null;
          motorcycle_id: string | null;
          caption: string;
          location_name: string | null;
          visibility: 'private' | 'followers' | 'public';
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ride_id?: string | null;
          motorcycle_id?: string | null;
          caption: string;
          location_name?: string | null;
          visibility?: 'private' | 'followers' | 'public';
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ride_id?: string | null;
          motorcycle_id?: string | null;
          caption?: string;
          location_name?: string | null;
          visibility?: 'private' | 'followers' | 'public';
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          media_url: string;
          media_type: 'image' | 'video';
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          media_url: string;
          media_type?: 'image' | 'video';
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          media_url?: string;
          media_type?: 'image' | 'video';
          display_order?: number;
          created_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_comment_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          parent_comment_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          parent_comment_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          region: string | null;
          badge: string | null;
          cover_image_url: string | null;
          avatar_url: string | null;
          created_by: string;
          privacy: 'public' | 'private';
          members_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          region?: string | null;
          badge?: string | null;
          cover_image_url?: string | null;
          avatar_url?: string | null;
          created_by: string;
          privacy?: 'public' | 'private';
          members_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          region?: string | null;
          badge?: string | null;
          cover_image_url?: string | null;
          avatar_url?: string | null;
          created_by?: string;
          privacy?: 'public' | 'private';
          members_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string;
          icon: string;
          category: 'milestone' | 'speed' | 'lean' | 'elevation' | 'distance' | 'social';
          requirement_value: number;
          unit: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description: string;
          icon: string;
          category?: 'milestone' | 'speed' | 'lean' | 'elevation' | 'distance' | 'social';
          requirement_value: number;
          unit?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          description?: string;
          icon?: string;
          category?: 'milestone' | 'speed' | 'lean' | 'elevation' | 'distance' | 'social';
          requirement_value?: number;
          unit?: string;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          progress: number;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          progress?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          progress?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
