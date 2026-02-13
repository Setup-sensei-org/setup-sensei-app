/**
 * Attempt Service - IMU Upload & Drill Recording Workflow
 * 
 * Handles the complete drill recording lifecycle:
 * 1. Request signed upload URL from backend
 * 2. Collect/upload IMU sensor data
 * 3. Mark upload complete (triggers background processing)
 * 4. Poll for results (optional)
 * 
 * Diagram:
 * Frontend → POST /attempts/start (with JWT token)
 *            ← Returns: attempt_id, signed_upload_url
 *            
 * Frontend → PUT <signed_upload_url> (upload IMU file to Storage)
 *            ← 200 OK
 *            
 * Frontend → POST /attempts/{id}/finish (with JWT token)
 *            ← Returns: attempt updated to "uploaded"
 *            
 * [Background worker processes file]
 *            
 * Frontend → GET /attempt_results (Supabase read)
 *            ← Returns: computed metrics
 */

/**
 * Type for IMU sensor data point
 * Extend this based on your actual sensor payload
 */
export interface IMUSample {
  timestamp_ms: number; // Milliseconds since start
  rep_number?: number;  // Which rep/rep this sample is from
  // Acceleration (g)
  ax?: number;
  ay?: number;
  az?: number;
  // Angular velocity (degrees/sec)
  gx?: number;
  gy?: number;
  gz?: number;
  // Quaternions
  q0?: number;
  q1?: number;
  q2?: number;
  q3?: number;
  // Other sensor data
  [key: string]: any;
}

/**
 * Type for raw IMU file payload (what gets uploaded)
 */
export interface IMUFilePayload {
  imu: IMUSample[];
  metadata?: {
    drill_id?: string;
    device?: string;
    app_version?: string;
    recording_duration_ms?: number;
    sample_rate_hz?: number;
  };
}

/**
 * Type for response from /attempts/start
 */
export interface StartAttemptResponse {
  attempt_id: string;
  raw_file_path: string;
  signed_upload_url: string;
}

/**
 * Type for response from /attempts/{id}/finish
 */
export interface FinishAttemptResponse {
  attempt_id: string;
  status: string;
  uploaded_at: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// ATTEMPT API FUNCTIONS
// ============================================================================

/**
 * Step 1: Request an attempt session from the backend
 * 
 * This creates a row in the `attempts` table and returns a signed upload URL.
 * The signed URL is valid for ~1 hour and can be used to upload the raw IMU file.
 * 
 * @param token - JWT token from Supabase authentication
 * @returns StartAttemptResponse with attempt_id and signed_upload_url
 * @throws Error if backend call fails
 */
export async function startAttempt(token: string): Promise<StartAttemptResponse> {
  const response = await fetch(`${API_BASE_URL}/attempts/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Start attempt failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Step 2: Upload IMU data to Supabase Storage
 * 
 * This uploads the raw sensor data to the signed URL returned from startAttempt.
 * The file is stored in Storage and associated with the attempt_id.
 * 
 * @param signedUrl - Temporary upload URL from startAttempt response
 * @param imuData - IMU sensor data to upload
 * @throws Error if upload fails
 */
export async function uploadIMUData(
  signedUrl: string,
  imuData: IMUFilePayload
): Promise<void> {
  const payload = JSON.stringify(imuData);
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload IMU data failed: ${response.status} ${error}`);
  }
}

/**
 * Step 3: Mark attempt as uploaded (triggers backend processing)
 * 
 * This tells the backend that the file upload is complete.
 * Backend updates status to "uploaded" and background worker picks it up for processing.
 * 
 * @param attemptId - ID returned from startAttempt
 * @param token - JWT token from Supabase authentication
 * @returns FinishAttemptResponse with updated status
 * @throws Error if backend call fails
 */
export async function finishAttempt(
  attemptId: string,
  token: string
): Promise<FinishAttemptResponse> {
  const response = await fetch(`${API_BASE_URL}/attempts/${attemptId}/finish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Finish attempt failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Helper: Complete attempt flow in one call
 * 
 * Orchestrates the full workflow:
 * 1. Start attempt (get signed URL)
 * 2. Upload IMU data
 * 3. Finish attempt (mark uploaded)
 * 
 * @param token - JWT token from Supabase
 * @param imuData - IMU sensor data collected from device
 * @returns attemptId that was processed
 * @throws Error if any step fails
 */
export async function completeAttempt(
  token: string,
  imuData: IMUFilePayload
): Promise<string> {
  try {
    // Step 1: Start
    const attempt = await startAttempt(token);
    console.log('Attempt started:', attempt.attempt_id);

    // Step 2: Upload
    await uploadIMUData(attempt.signed_upload_url, imuData);
    console.log('IMU data uploaded');

    // Step 3: Finish
    const finished = await finishAttempt(attempt.attempt_id, token);
    console.log('Attempt finished:', finished.status);

    return attempt.attempt_id;
  } catch (error) {
    console.error('Attempt failed:', error);
    throw error;
  }
}

/**
 * Optional: Poll for attempt results
 * 
 * After finishing an attempt, the background worker processes the IMU file.
 * Use this to check if results are ready (polls `attempt_results` table).
 * 
 * Note: You may want to add a `/attempts/{id}/status` endpoint instead
 * to avoid querying Supabase directly from frontend.
 * 
 * @param attemptId - ID from startAttempt
 * @param maxAttempts - How many times to poll (default 30 = 30 seconds)
 * @param delayMs - Wait between polls in milliseconds (default 1000)
 * @returns attempt_results row if found, null if timeout
 */
export async function waitForAttemptResults(
  attemptId: string,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<any | null> {
  // This requires direct Supabase client access
  // Import and use like: const { supabase } = from './supabase'
  
  console.warn(
    'waitForAttemptResults: This function requires Supabase client. ' +
    'Consider adding /attempts/{id}/status endpoint to backend instead.'
  );
  
  // Placeholder: Your implementation here
  // Example:
  // for (let i = 0; i < maxAttempts; i++) {
  //   const { data } = await supabase
  //     .from('attempt_results')
  //     .select('*')
  //     .eq('attempt_id', attemptId)
  //     .single();
  //   if (data) return data;
  //   await new Promise(r => setTimeout(r, delayMs));
  // }
  // return null;

  return null;
}
