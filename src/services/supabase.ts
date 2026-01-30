/**
 * Supabase Client Initialization
 *
 * This file sets up the Supabase client that will be used throughout the app
 * for authentication and database operations.
 *
 * Required environment variables in .env.local:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
