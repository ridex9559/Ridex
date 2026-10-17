/**
 * RIDEX Web — Authentication & Profile Service
 * Manages Supabase Auth, sessions, and public.profiles persistence.
 */

import { supabase } from './supabase';
import { UserProfile } from '../types';

export const authService = {
  /**
   * Registers a new rider account.
   */
  async signUp(email: string, password: string, fullName: string, username: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: cleanUsername,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // Upsert profile record
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        updated_at: new Date().toISOString(),
      });
      if (profileError) console.warn('[authService] profile upsert warning:', profileError);
    }

    return data;
  },

  /**
   * Signs in an existing rider with email/password.
   */
  async signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs out the current rider.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Fetches active user session.
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Retrieves profile details for a given user ID.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      fullName: data.full_name || 'Rider',
      username: data.username || 'rider',
      email: data.email || '',
      avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
      city: data.city || 'Pune',
      state: data.state || 'Maharashtra',
      bio: data.bio || 'Motorcycle enthusiast & group rider.',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Updates rider profile details.
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.fullName) payload.full_name = updates.fullName;
    if (updates.username) payload.username = updates.username;
    if (updates.city) payload.city = updates.city;
    if (updates.state) payload.state = updates.state;
    if (updates.bio) payload.bio = updates.bio;
    if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    return !error;
  },
};
