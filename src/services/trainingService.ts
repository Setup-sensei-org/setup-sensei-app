import { supabase } from './supabase';
import { IMUSample } from './attemptService';

export interface TrainingRecordingPayload {
  drill_name: string;
  imu_data: IMUSample[];
  recording_duration_ms: number;
  sensor_roles: string[];
}

export async function uploadTrainingRecording(
  payload: TrainingRecordingPayload
): Promise<{ id: string; created_at: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated. Please sign in first.');
  }

  const row = {
    user_id: user.id,
    drill_name: payload.drill_name,
    imu_data: payload.imu_data,
    recording_duration_ms: payload.recording_duration_ms,
    sample_count: payload.imu_data.length,
    sensor_roles: payload.sensor_roles,
  };

  console.log('[trainingService] inserting row:', {
    user_id: row.user_id,
    drill_name: row.drill_name,
    recording_duration_ms: row.recording_duration_ms,
    sample_count: row.sample_count,
    sensor_roles: row.sensor_roles,
    imu_data_preview: row.imu_data.slice(0, 3),
  });

  const { data, error } = await supabase
    .from('training_recordings')
    .insert(row)
    .select('id, created_at')
    .single();

  if (error) {
    throw new Error(`Failed to upload training recording: ${error.message}`);
  }

  console.log('[trainingService] insert success:', data);
  return data;
}

/**
 * Read back all training recordings for the current user.
 * Use from browser console: import('/src/services/trainingService.ts').then(m => m.fetchTrainingRecordings())
 */
export async function fetchTrainingRecordings() {
  const { data, error } = await supabase
    .from('training_recordings')
    .select('id, drill_name, recording_duration_ms, sample_count, sensor_roles, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[trainingService] fetch failed:', error.message);
    throw error;
  }

  console.table(data);
  return data;
}

/**
 * Read back a single training recording with full imu_data.
 */
export async function fetchTrainingRecordingById(id: string) {
  const { data, error } = await supabase
    .from('training_recordings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[trainingService] fetch by id failed:', error.message);
    throw error;
  }

  console.log('[trainingService] full row:', {
    id: data.id,
    drill_name: data.drill_name,
    recording_duration_ms: data.recording_duration_ms,
    sample_count: data.sample_count,
    sensor_roles: data.sensor_roles,
    created_at: data.created_at,
    imu_data_length: data.imu_data?.length,
    imu_data_first_3: data.imu_data?.slice(0, 3),
  });
  return data;
}
