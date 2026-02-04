/**
 * API Service Layer - Supabase Integration (Adapted for Actual Schema)
 * 
 * Uses Supabase auth + database tables:
 * - profiles (user metadata)
 * - roadmap_nodes (progression)
 * - drills (drill definitions)
 * - attempt_results (analytics)
 */

import { supabase } from './supabase';
import {
  AuthPayload,
  AuthResponse,
  User,
  SessionAnalytics,
  RoadmapNode,
  DrillOverview,
  DrillDetail,
} from '../types';

// ============================================================================
// AUTHENTICATION API
// ============================================================================

/**
 * Login user with email or username
 * Supports: email directly, or username lookup
 */
export async function login(payload: AuthPayload): Promise<AuthResponse> {
  let email: string;

  if (!payload.loginIdentifier) {
    throw new Error('Email or username is required for login');
  }

  if (payload.loginIdentifier.includes('@')) {
    // Looks like an email, use it directly
    email = payload.loginIdentifier;
  } else {
    // Plain username, look it up in profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', payload.loginIdentifier)
      .single();

    if (profileError || !profileData?.email) {
      throw new Error('User not found');
    }
    email = profileData.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed: Missing user or session data');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, electrical_sync_rate')
    .eq('id', data.user.id)
    .single();

  const user: User = {
    id: data.user.id,
    username: profile?.username || data.user.email?.split('@')[0] || 'user',
    electrical_sync_rate: profile?.electrical_sync_rate || 0,
    account_created_at: data.user.created_at,
    email: data.user.email,
  };

  setAuthToken(data.session.access_token);

  return {
    access_token: data.session.access_token,
    token_type: 'Bearer',
    user,
  };
}

/**
 * Signup new user with email and password.
 * Profile row is auto-created via trigger; we update username afterwards.
 */
export async function signup(payload: AuthPayload): Promise<AuthResponse> {
  if (!payload.email) {
    throw new Error('Email is required for signup');
  }

  if (!payload.username) {
    throw new Error('Username is required for signup');
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        username: payload.username!,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Signup failed: Missing user data');
  }

  // Profile creation is handled by the "handle_new_user" Trigger in Supabase
  // which copies the username from metadata to the profiles table.

  const user: User = {
    id: data.user.id,
    username: payload.username!,
    electrical_sync_rate: 0,
    account_created_at: data.user.created_at,
    email: payload.email,
  };

  if (data.session?.access_token) {
    setAuthToken(data.session.access_token);
  }

  return {
    access_token: data.session?.access_token || '',
    token_type: 'Bearer',
    user,
  };
}

/**
 * Start Google OAuth login flow.
 * Supabase will redirect the browser to Google and back to this app.
 */
export async function loginWithGoogle(): Promise<void> {
  //Connecting to Supabase helper that starts an OAuth flow with Google
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Redirect back to the current origin (works for dev + prod)
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// USER API
// ============================================================================

/**
 * Get current user profile from Supabase
 */
export async function getCurrentUser(): Promise<User> {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, electrical_sync_rate, created_at')
    .eq('id', authUser.id)
    .single();

  if (profileError) {
    throw new Error(`Failed to fetch user profile: ${profileError.message}`);
  }

  return {
    id: profile.id,
    username: profile.username,
    electrical_sync_rate: profile.electrical_sync_rate || 0,
    account_created_at: profile.created_at,
    email: authUser.email,
  };
}

// ============================================================================
// ANALYTICS API
// ============================================================================

/**
 * Get session analytics from attempt_results
 */
export async function getSessionAnalytics(): Promise<SessionAnalytics> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  try {
    const { data: result, error } = await supabase
      .from('attempt_results')
      .select('*')
      .eq('user_id', user.id)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // If the table doesn't exist yet or analytics aren't wired, return safe defaults
      const msg = error.message || String(error);
      if (msg.includes('relation "attempt_results" does not exist')) {
        console.warn('attempt_results table missing; returning default session analytics.');
        return {
          total_strikes: 0,
          avg_power: 0,
          neural_sync: 0,
          heart_rate: undefined,
          duration: 0,
          calories_burned: undefined,
        };
      }
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    // No analytics yet for this user; return defaults
    if (!result) {
      return {
        total_strikes: 0,
        avg_power: 0,
        neural_sync: 0,
        heart_rate: undefined,
        duration: 0,
        calories_burned: undefined,
      };
    }

    const metrics = result.metrics || {};

    return {
      total_strikes: result.rep_count || 0,
      avg_power: metrics.avg_power || result.peak_speed || 0,
      neural_sync: result.accuracy || 0,
      heart_rate: metrics.heart_rate || undefined,
      duration: result.duration_seconds || 0,
      calories_burned: metrics.calories_burned || undefined,
    };
  } catch (err) {
    // As a final fallback, don't break the app if analytics aren't ready
    console.warn('Session analytics not available; using defaults.', err);
    return {
      total_strikes: 0,
      avg_power: 0,
      neural_sync: 0,
      heart_rate: undefined,
      duration: 0,
      calories_burned: undefined,
    };
  }
}

// ============================================================================
// ROADMAP API
// ============================================================================

/**
 * Get roadmap nodes for current user
 */
export async function getRoadmapNodes(): Promise<RoadmapNode[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: nodes, error } = await supabase
    .from('roadmap_nodes')
    .select('*')
    .eq('user_id', user.id)
    .order('level', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch roadmap nodes: ${error.message}`);
  }

  return nodes.map(node => ({
    id: node.id,
    level: node.level,
    title: node.title,
    subtitle: node.subtitle,
    status: node.status,
    type: node.type,
    description: node.description,
    pathDirection: node.path_direction,
  }));
}

// ============================================================================
// DRILL API
// ============================================================================

/**
 * Get all drills (overview)
 * (Consolidated below — duplicate removed)
 */

/**
 * Get drills list for current user
 */
export async function getDrills(): Promise<DrillOverview[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: drills, error } = await supabase
    .from('drills')
    .select('id, title, category, duration, intensity, thumbnail_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch drills: ${error.message}`);
  }

  return drills.map(drill => ({
    id: drill.id,
    title: drill.title,
    category: drill.category,
    duration: drill.duration,
    intensity: drill.intensity,
    thumbnail_url: drill.thumbnail_url,
  }));
}

/**
 * Get drill detail by ID
 */
export async function getDrillDetail(id: string): Promise<DrillDetail> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: drill, error } = await supabase
    .from('drills')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch drill detail: ${error.message}`);
  }

  return {
    id: drill.id,
    overview: {
      id: drill.id,
      title: drill.title,
      category: drill.category,
      duration: drill.duration,
      intensity: drill.intensity,
      thumbnail_url: drill.thumbnail_url,
    },
    sets: drill.sets,
    difficulty: drill.difficulty,
    biometrics: {
      impact_force_kgf: drill.impact_force_kgf || 0,
      rotation_x_deg: drill.rotation_x_deg || 0,
      rotation_y_deg: drill.rotation_y_deg || 0,
      rotation_z_deg: drill.rotation_z_deg || 0,
      acceleration_ms2: drill.acceleration_ms2 || 0,
    },
    liveFeedback: {
      posture_score: drill.posture_score || 0,
      balance_status: drill.balance_status || 'NEUTRAL',
      neural_sync_status: drill.neural_sync_status || 'READY',
    },
  };
}

/**
 * Initialize auth from an existing Supabase session (e.g. after OAuth redirect).
 * Returns true if a session/access token was found and stored.
 */
export async function initAuthFromSupabaseSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to get Supabase session', error);
    return false;
  }

  const accessToken = data.session?.access_token;
  if (accessToken) {
    setAuthToken(accessToken);
    return true;
  }

  return false;
}
/**
 * Store authentication token (optional helper for the rest of the app)
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('access_token');
  supabase.auth.signOut();
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}