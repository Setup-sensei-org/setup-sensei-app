/**
 * API Service Layer - Supabase Integration
 * 
 * This file replaces the fetch-based API calls with Supabase SDK calls.
 * Key differences from the original:
 * - Uses Supabase Auth for login/signup instead of custom endpoints
 * - Uses Supabase Database (PostgreSQL) instead of custom REST API
 * - Automatic token management through Supabase session
 * - Real-time capability built-in
 * 
 * Database Tables Required:
 * - profiles (user profile data)
 * - roadmap_nodes (training progression)
 * - drills (drill definitions and data)
 * - session_analytics (session stats)
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
 * 
 * Supabase Auth handles:
 * - Password hashing and security
 * - Session token generation
 * - Token refresh automatically
 * 
 * After login:
 * - Token stored in localStorage automatically
 * - User can access protected tables with RLS policies
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

  // Create user object from auth data
  const user: User = {
    id: data.user.id,
    username: data.user.email?.split('@')[0] || 'user',
    electrical_sync_rate: 0,
    account_created_at: data.user.created_at,
    email: data.user.email,
  };

  // Store token (Supabase stores it automatically, but we also save to localStorage for our app)
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
 * Process:
 * 1. Create auth user in Supabase Auth
 * 2. Create profile in profiles table
 * 3. Return auth response
 * 
 * Note: Email confirmation may be required depending on Supabase settings
 */
export async function signup(payload: AuthPayload): Promise<AuthResponse> {
  if (!payload.email) {
    throw new Error('Email is required for signup');
  }

  if (!payload.username) {
    throw new Error('Username is required for signup');
  }

  // Step 1: Create auth user
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

  // Step 2: Create user profile in database
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: data.user.id,
        username: payload.username!,
        email: payload.email,
        electrical_sync_rate: 0,
      },
    ]);

  if (profileError) {
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  const user: User = {
    id: data.user.id,
    username: payload.username,
    electrical_sync_rate: 0,
    account_created_at: data.user.created_at,
    email: payload.email,
  };

  // Store token if available (may not exist immediately after signup)
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
 * 
 * Gets both:
 * - Auth user (email, id, created_at)
 * - Profile data (username, sync_rate, etc.)
 */
export async function getCurrentUser(): Promise<User> {
  // Get current authenticated user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error('Not authenticated');
  }

  // Get profile data from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
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
 * Get session analytics from database
 * 
 * Fetches the latest session analytics record for the current user
 * Uses Row Level Security (RLS) - users can only see their own data
 */
export async function getSessionAnalytics(): Promise<SessionAnalytics> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Fetch latest session analytics
  const { data: analytics, error } = await supabase
    .from('session_analytics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }

  return {
    total_strikes: analytics.total_strikes,
    avg_power: analytics.avg_power,
    neural_sync: analytics.neural_sync,
    heart_rate: analytics.heart_rate,
    duration: analytics.duration,
    calories_burned: analytics.calories_burned,
  };
}

// ============================================================================
// ROADMAP API
// ============================================================================

/**
 * Get roadmap nodes for current user
 * 
 * Returns user's training roadmap progression
 * Status can be: 'locked', 'active', 'completed'
 */
export async function getRoadmapNodes(): Promise<RoadmapNode[]> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Fetch roadmap nodes
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
 * 
 * Returns list of available drills
 * Each drill can be clicked to get full detail
 */
export async function getDrills(): Promise<DrillOverview[]> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Fetch drills
  const { data: drills, error } = await supabase
    .from('drills')
    .select('*')
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
 * Returns complete drill data including:
 * - Drill metadata (title, category, difficulty)
 * - Biometric requirements (force, rotation, acceleration)
 * - Live feedback targets (posture, balance, neural sync)
 */
export async function getDrillDetail(id: string): Promise<DrillDetail> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Fetch drill detail
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
      impact_force_kgf: drill.impact_force_kgf,
      rotation_x_deg: drill.rotation_x_deg,
      rotation_y_deg: drill.rotation_y_deg,
      rotation_z_deg: drill.rotation_z_deg,
      acceleration_ms2: drill.acceleration_ms2,
    },
    liveFeedback: {
      posture_score: drill.posture_score,
      balance_status: drill.balance_status,
      neural_sync_status: drill.neural_sync_status,
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Store authentication token in localStorage
 * 
 * Note: Supabase also stores the session automatically,
 * but we keep it in localStorage for our app's use
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Remove authentication token and sign out
 * 
 * Clears both localStorage and Supabase session
 */
export function clearAuthToken(): void {
  localStorage.removeItem('access_token');
  supabase.auth.signOut();
}

/**
 * Check if user is authenticated
 * 
 * Simple check of localStorage token
 * For more robust checking, use getCurrentUser()
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
