# Backend Integration Guide

This document provides the API endpoint specifications and TypeScript type definitions for the Setup Sensei frontend application.

## API Endpoints

The following endpoints are expected from the Python/FastAPI backend:

1. **POST /api/auth/login**
   - Request body: `{ username: string, password: string }`
   - Response: `{ access_token: string, token_type: string, user: User }`

2. **POST /api/auth/signup**
   - Request body: `{ username: string, password: string, email: string }`
   - Response: `{ access_token: string, token_type: string, user: User }`

3. **GET /api/user/me**
   - Headers: `Authorization: Bearer <token>`
   - Response: `User`

4. **GET /api/analytics/session**
   - Headers: `Authorization: Bearer <token>`
   - Response: `SessionAnalytics`

5. **GET /api/roadmap/nodes**
   - Headers: `Authorization: Bearer <token>`
   - Response: `ApiResponse<RoadmapNode[]>` or `RoadmapNode[]`

6. **GET /api/drills**
   - Headers: `Authorization: Bearer <token>`
   - Response: `ApiResponse<DrillOverview[]>` or `PaginatedResponse<DrillOverview>`

7. **GET /api/drills/:id**
   - Headers: `Authorization: Bearer <token>`
   - Response: `ApiResponse<DrillDetail>`

## Critical Note: Drill Detail Endpoint

The **GET /api/drills/:id** endpoint is critical for the Active Drill screen visualization. This endpoint **MUST** return the `biometrics` and `liveFeedback` objects exactly as defined in the TypeScript interfaces below. Any deviation in field names, types, or structure will break the visualization screens.

Required fields:
- `biometrics`: Must include all 5 fields (impact_force_kgf, rotation_x_deg, rotation_y_deg, rotation_z_deg, acceleration_ms2)
- `liveFeedback`: Must include all 3 fields (posture_score, balance_status, neural_sync_status)

## TypeScript Type Definitions

Copy the following TypeScript definitions to create corresponding Pydantic models in your FastAPI backend:

```typescript
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
  username: string;
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
```

## Example Drill Detail Response

For reference, here is an example response structure for `GET /api/drills/:id`:

```json
{
  "data": {
    "id": "1",
    "overview": {
      "id": "1",
      "title": "STANCE",
      "category": "FUNDAMENTALS",
      "duration": "5 MIN",
      "intensity": "MEDIUM"
    },
    "sets": "3x10",
    "difficulty": "BEG",
    "biometrics": {
      "impact_force_kgf": 840.00,
      "rotation_x_deg": 12.5,
      "rotation_y_deg": 45.2,
      "rotation_z_deg": -4.3,
      "acceleration_ms2": 1.2
    },
    "liveFeedback": {
      "posture_score": 98.3,
      "balance_status": "OPTIMAL",
      "neural_sync_status": "READY"
    }
  }
}
```

## Authentication

All endpoints except `/api/auth/login` and `/api/auth/signup` require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

The access token is returned in the login/signup response and should be stored client-side for subsequent requests.