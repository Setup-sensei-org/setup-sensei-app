/**
 * TypeScript Type Definitions for Setup Sensei App
 * 
 * This file contains all data layer interfaces that will be consumed by the UI layer.
 * These types are designed to be backend-ready and can be easily mapped to Python/FastAPI endpoints.
 */

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Authentication payload for both Login and Signup operations
 */
export interface AuthPayload {
  loginIdentifier?: string; // For login: can be username or email
  username?: string; // For signup: the desired username
  password: string;
  email?: string; // Optional for login, required for signup
}

/**
 * Authentication response from backend
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User profile information
 */
export interface User {
  id: string;
  username: string;
  electrical_sync_rate: number; // Percentage (0-100)
  account_created_at: string; // ISO 8601 date string
  email?: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Session analytics data for the Analytics screen
 */
export interface SessionAnalytics {
  total_strikes: number;
  avg_power: number; // Power in PSI (Pounds per Square Inch)
  neural_sync: number; // Percentage (0-100)
  heart_rate?: number; // Optional: beats per minute
  duration: number; // Duration in seconds
  calories_burned?: number; // Optional: calories burned during session
}

// ============================================================================
// ROADMAP TYPES
// ============================================================================

/**
 * Roadmap node status
 */
export type RoadmapNodeStatus = 'locked' | 'active' | 'completed';

/**
 * Roadmap node type/category
 */
export type RoadmapNodeType = 
  | 'FUNDAMENTALS' 
  | 'STRIKING' 
  | 'POWER' 
  | 'DEFENSE' 
  | 'ADVANCED' 
  | 'MASTERY' 
  | 'TECHNIQUE'
  | 'COMBO';

/**
 * Roadmap node representing a training level/step
 */
export interface RoadmapNode {
  id: string;
  level: number;
  title: string;
  subtitle?: string; // Optional description/subtitle
  status: RoadmapNodeStatus;
  type: RoadmapNodeType;
  description?: string; // Optional detailed description
  pathDirection?: 'left' | 'right' | 'straight'; // UI-specific: path direction for visualization
}

// ============================================================================
// DRILL TYPES
// ============================================================================

/**
 * Drill difficulty level
 */
export type DrillDifficulty = 'BEG' | 'INT' | 'ADV' | 'EXP';

/**
 * Drill category
 */
export type DrillCategory = 
  | 'FUNDAMENTALS'
  | 'STRIKING'
  | 'POWER'
  | 'DEFENSE'
  | 'ADVANCED'
  | 'MASTERY'
  | 'TECHNIQUE'
  | 'COMBO'
  | 'SPEED'
  | 'AGILITY'
  | 'GRAPPLING';

/**
 * Drill intensity level
 */
export type DrillIntensity = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

/**
 * Overview/summary information for a drill (used in lists and cards)
 */
export interface DrillOverview {
  id: string;
  title: string;
  category: DrillCategory;
  duration: string; // e.g., "3 MIN", "5 MIN"
  intensity: DrillIntensity;
  thumbnail_url?: string; // Optional: URL to drill thumbnail image
}

// ============================================================================
// BIOMETRIC TYPES
// ============================================================================

/**
 * Biometric sensor data captured during drill execution
 */
export interface Biometrics {
  impact_force_kgf: number; // Impact force in kilogram-force
  rotation_x_deg: number; // Rotation around X-axis in degrees
  rotation_y_deg: number; // Rotation around Y-axis in degrees
  rotation_z_deg: number; // Rotation around Z-axis in degrees
  acceleration_ms2: number; // Acceleration in meters per second squared
}

/**
 * Live feedback metrics during drill execution
 */
export interface LiveFeedback {
  posture_score: number; // Posture quality as percentage (0-100)
  balance_status: string; // Balance status, e.g., "OPTIMAL", "POOR", "GOOD", "FAIR"
  neural_sync_status: string; // Neural sync status, e.g., "READY", "SYNCING", "OPTIMAL", "CALIBRATING"
}

// ============================================================================
// DRILL DETAIL TYPES
// ============================================================================

/**
 * Complete drill detail information for the Active Drill screen
 * 
 * This is the CRITICAL interface that populates the "Active Drill" screen.
 * It combines overview data with real-time biometric and feedback data.
 */
export interface DrillDetail {
  id: string;
  overview: DrillOverview;
  sets: string; // e.g., "3x10", "4x12", "5x8"
  difficulty: DrillDifficulty; // e.g., "ADV", "BEG", "INT", "EXP"
  biometrics: Biometrics;
  liveFeedback: LiveFeedback;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a value is a valid RoadmapNodeStatus
 */
export function isRoadmapNodeStatus(status: string): status is RoadmapNodeStatus {
  return status === 'locked' || status === 'active' || status === 'completed';
}

/**
 * Type guard to check if a value is a valid DrillDifficulty
 */
export function isDrillDifficulty(difficulty: string): difficulty is DrillDifficulty {
  return difficulty === 'BEG' || difficulty === 'INT' || difficulty === 'ADV' || difficulty === 'EXP';
}

/**
 * Type guard to check if a value is a valid DrillIntensity
 */
export function isDrillIntensity(intensity: string): intensity is DrillIntensity {
  return intensity === 'LOW' || intensity === 'MEDIUM' || intensity === 'HIGH' || intensity === 'EXTREME';
}

