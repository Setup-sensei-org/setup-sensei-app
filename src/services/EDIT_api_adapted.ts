/**
 * API Service Layer - Supabase Integration (Adapted for Actual Schema)
 * 
 * This version is tailored to your actual database schema:
 * - Uses attempt_results as the primary analytics source
 * - Maps workout_stats and attempt_results to frontend expectations
 * - Integrates roadmap_nodes and drills for progression tracking
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
 * Login user with email and password
 */
export async function login(payload: AuthPayload): Promise<AuthResponse> {
  if (!payload.email) {
    throw new Error('Email is required for login');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed: Missing user or session data');
  }

  // Fetch profile to get username
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
 * Signup new user with email and password
 * 
 * Note: Profile is auto-created via trigger in migration_one
 * This updates the profile with username
 */
export async function signup(payload: AuthPayload): Promise<AuthResponse> {
  if (!payload.email) {
    throw new Error('Email is required for signup');
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Signup failed: Missing user data');
  }

  // Update profile with username (profile already created by trigger)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      username: payload.username,
      electrical_sync_rate: 0 
    })
    .eq('id', data.user.id);

  if (updateError) {
    throw new Error(`Failed to update user profile: ${updateError.message}`);
  }

  const user: User = {
    id: data.user.id,
    username: payload.username,
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
    .select('username, electrical_sync_rate, created_at')
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
 * Get session analytics from attempt_results (main analytics table)
 * 
 * Maps your attempt_results columns to frontend SessionAnalytics type:
 * - rep_count → total_strikes
 * - avg_speed → neural_sync (as percentage)
 * - peak_speed used for calculations
 * - metrics.heart_rate → heart_rate
 * - duration_seconds → duration
 * - metrics.calories_burned → calories_burned
 */
export async function getSessionAnalytics(): Promise<SessionAnalytics> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Fetch latest attempt result (most recent session)
  const { data: result, error } = await supabase
    .from('attempt_results')
    .select('*')
    .eq('user_id', user.id)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }

  // Parse JSONB metrics and quality objects
  const metrics = result.metrics || {};
  const quality = result.quality || {};

  return {
    total_strikes: result.rep_count || 0,
    avg_power: metrics.avg_power || result.peak_speed || 0, // Use avg_power from metrics or peak_speed
    neural_sync: result.accuracy || 0, // accuracy as neural sync percentage
    heart_rate: metrics.heart_rate || undefined,
    duration: result.duration_seconds || 0,
    calories_burned: metrics.calories_burned || undefined,
  };
}

// ============================================================================
// ROADMAP API
// ============================================================================

/**
 * Get roadmap nodes for current user
 * 
 * Returns user's training progression with status tracking
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
 * Get all drills (overview) for current user
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
 * 
 * Returns complete drill definition with biometric targets and feedback expectations
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Store authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Remove authentication token and sign out
 */
export function clearAuthToken(): void {
  localStorage.removeItem('access_token');
  supabase.auth.signOut();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
