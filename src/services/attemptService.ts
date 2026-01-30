/**
 * Attempt Service - IMU Upload & Drill Recording Workflow
 *
 * Handles the complete drill recording lifecycle:
 * 1. Request signed upload URL from backend
 * 2. Collect/upload IMU sensor data
 * 3. Mark upload complete (triggers background processing)
 * 4. Poll for results (optional)
 *
 * Backend endpoints (FastAPI):
 * - POST /attempts/start
 * - POST /attempts/{id}/finish
 */

export interface IMUSample {
  timestamp_ms: number;
  rep_number?: number;
  ax?: number;
  ay?: number;
  az?: number;
  wx?: number;
  wy?: number;
  wz?: number;
  q0?: number;
  q1?: number;
  q2?: number;
  q3?: number;
  [key: string]: any;
}

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

export interface StartAttemptResponse {
  attempt_id: string;
  raw_file_path: string;
  signed_upload_url: string;
}

export interface FinishAttemptResponse {
  attempt_id: string;
  status: string;
  uploaded_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function startAttempt(token: string): Promise<StartAttemptResponse> {
  const response = await fetch(`${API_BASE_URL}/attempts/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Start attempt failed: ${response.status} ${error}`);
  }

  return response.json();
}

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

export async function finishAttempt(
  attemptId: string,
  token: string
): Promise<FinishAttemptResponse> {
  const response = await fetch(`${API_BASE_URL}/attempts/${attemptId}/finish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Finish attempt failed: ${response.status} ${error}`);
  }

  return response.json();
}

export async function completeAttempt(
  token: string,
  imuData: IMUFilePayload
): Promise<string> {
  try {
    const attempt = await startAttempt(token);
    console.log('Attempt started:', attempt.attempt_id);

    await uploadIMUData(attempt.signed_upload_url, imuData);
    console.log('IMU data uploaded');

    const finished = await finishAttempt(attempt.attempt_id, token);
    console.log('Attempt finished:', finished.status);

    return attempt.attempt_id;
  } catch (error) {
    console.error('Attempt failed:', error);
    throw error;
  }
}

export async function waitForAttemptResults(
  attemptId: string,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<any | null> {
  console.warn(
    'waitForAttemptResults: This function requires Supabase client or a dedicated status endpoint. ' +
      'Implement this when your backend is ready.'
  );

  return null;
}
