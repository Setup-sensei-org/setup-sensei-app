/**
 * API Service Layer
 * 
 * This file demonstrates how to connect the TypeScript types to backend endpoints.
 * Replace the mock implementations with actual API calls to your Python/FastAPI backend.
 * 
 * Example FastAPI endpoint structure:
 * - POST /api/auth/login
 * - POST /api/auth/signup
 * - GET /api/user/me
 * - GET /api/analytics/session
 * - GET /api/roadmap/nodes
 * - GET /api/drills
 * - GET /api/drills/:id
 */

import {
  AuthPayload,
  AuthResponse,
  User,
  SessionAnalytics,
  RoadmapNode,
  DrillOverview,
  DrillDetail,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ============================================================================
// AUTHENTICATION API
// ============================================================================

/**
 * Login user
 * 
 * Backend endpoint: POST /api/auth/login
 * Expected request body: { username: string, password: string }
 * Expected response: { access_token: string, token_type: string, user: User }
 */
export async function login(payload: AuthPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

/**
 * Signup new user
 * 
 * Backend endpoint: POST /api/auth/signup
 * Expected request body: { username: string, password: string, email: string }
 * Expected response: { access_token: string, token_type: string, user: User }
 */
export async function signup(payload: AuthPayload): Promise<AuthResponse> {
  if (!payload.email) {
    throw new Error('Email is required for signup');
  }

  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      email: payload.email,
    }),
  });

  if (!response.ok) {
    throw new Error('Signup failed');
  }

  return response.json();
}

// ============================================================================
// USER API
// ============================================================================

/**
 * Get current user profile
 * 
 * Backend endpoint: GET /api/user/me
 * Expected response: User
 */
export async function getCurrentUser(): Promise<User> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

// ============================================================================
// ANALYTICS API
// ============================================================================

/**
 * Get session analytics
 * 
 * Backend endpoint: GET /api/analytics/session
 * Expected response: SessionAnalytics
 */
export async function getSessionAnalytics(): Promise<SessionAnalytics> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/analytics/session`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
}

// ============================================================================
// ROADMAP API
// ============================================================================

/**
 * Get roadmap nodes
 * 
 * Backend endpoint: GET /api/roadmap/nodes
 * Expected response: RoadmapNode[]
 */
export async function getRoadmapNodes(): Promise<RoadmapNode[]> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/roadmap/nodes`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch roadmap nodes');
  }

  const data: ApiResponse<RoadmapNode[]> = await response.json();
  return data.data;
}

// ============================================================================
// DRILL API
// ============================================================================

/**
 * Get all drills (overview)
 * 
 * Backend endpoint: GET /api/drills
 * Expected response: PaginatedResponse<DrillOverview> or DrillOverview[]
 */
export async function getDrills(): Promise<DrillOverview[]> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/drills`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch drills');
  }

  const data: ApiResponse<DrillOverview[]> | PaginatedResponse<DrillOverview> = await response.json();
  
  // Handle both response formats
  if ('items' in data) {
    return data.items;
  }
  return data.data || [];
}

/**
 * Get drill detail by ID
 * 
 * Backend endpoint: GET /api/drills/:id
 * Expected response: DrillDetail
 * 
 * Example response structure (for backend reference):
 * {
 *   "data": {
 *     "id": "1",
 *     "overview": {
 *       "id": "1",
 *       "title": "STANCE",
 *       "category": "FUNDAMENTALS",
 *       "duration": "5 MIN",
 *       "intensity": "MEDIUM"
 *     },
 *     "sets": "3x10",
 *     "difficulty": "BEG",
 *     "biometrics": {
 *       "impact_force_kgf": 840.00,
 *       "rotation_x_deg": 12.5,
 *       "rotation_y_deg": 45.2,
 *       "rotation_z_deg": -4.3,
 *       "acceleration_ms2": 1.2
 *     },
 *     "liveFeedback": {
 *       "posture_score": 98.3,
 *       "balance_status": "OPTIMAL",
 *       "neural_sync_status": "READY"
 *     }
 *   }
 * }
 */
export async function getDrillDetail(id: string): Promise<DrillDetail> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/drills/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch drill detail');
  }

  const data: ApiResponse<DrillDetail> = await response.json();
  return data.data;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Remove authentication token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('access_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

