# Attempt Service Guide

## What is the Attempt Service?

The **attempt service** is a TypeScript module (`src/services/attempt_service.ts`) that handles the **drill recording workflow**. It's the bridge between your frontend UI and your backend's IMU processing pipeline.

---

## The 3-Step Workflow

### **Step 1: Start Attempt (Request Upload URL)**

```typescript
import { startAttempt } from './services/attempt_service';

// In your component after user clicks "Start Recording"
const token = localStorage.getItem('access_token');
const attempt = await startAttempt(token);

// Response:
// {
//   "attempt_id": "uuid-...",
//   "raw_file_path": "user-id/attempt-id/raw.json",
//   "signed_upload_url": "https://...supabase.../storage/...?auth=..."
// }
```

**What happens:**
- Backend creates a row in `attempts` table with status `"created"`
- Supabase Storage generates a temporary upload URL (valid ~1 hour)
- Frontend receives `attempt_id` (remember this!) and `signed_upload_url` (use for upload)

---

### **Step 2: Upload IMU Data**

```typescript
import { uploadIMUData } from './services/attempt_service';

// Collect IMU sensor data during drill (30-60 seconds)
const imuData = {
  imu: [
    { timestamp_ms: 0, ax: 0.1, ay: 0.0, az: 9.8, wx: 0, wy: 0, wz: 0 },
    { timestamp_ms: 10, ax: 0.15, ay: 0.05, az: 9.75, wx: 1, wy: 0, wz: 0 },
    // ... more samples
  ],
  metadata: {
    drill_id: "stance-level-1",
    device: "iPhone 15",
    sample_rate_hz: 100,
    recording_duration_ms: 45000,
  }
};

// Upload to the signed URL
await uploadIMUData(attempt.signed_upload_url, imuData);
```

**What happens:**
- Frontend sends IMU JSON to Supabase Storage (using signed URL)
- File is stored at `storage://bucket/user-id/attempt-id/raw.json`
- Backend can't tamper with the data (signed URL is temporary + validated)

---

### **Step 3: Finish Attempt (Mark Uploaded)**

```typescript
import { finishAttempt } from './services/attempt_service';

const token = localStorage.getItem('access_token');
const finished = await finishAttempt(attempt.attempt_id, token);

// Response:
// {
//   "attempt_id": "uuid-...",
//   "status": "uploaded",
//   "uploaded_at": "2026-01-29T10:30:45.123Z"
// }
```

**What happens:**
- Backend updates `attempts` row: status changes from `"created"` → `"uploaded"`
- Backend updates `uploaded_at` timestamp
- **Background worker detects the change** and starts processing:
  1. Downloads raw file from Storage
  2. Parses IMU data
  3. Computes metrics (rep count, accuracy, speed, etc.)
  4. Inserts results into `attempt_results` table

---

## Helper: Complete Flow in One Call

Instead of 3 separate calls, you can do all at once:

```typescript
import { completeAttempt } from './services/attempt_service';

const token = localStorage.getItem('access_token');
const imuData = { imu: [...], metadata: {...} };

try {
  const attemptId = await completeAttempt(token, imuData);
  console.log('Drill recorded successfully:', attemptId);
} catch (error) {
  console.error('Recording failed:', error);
}
```

This calls `startAttempt` → `uploadIMUData` → `finishAttempt` automatically.

---

## How to Use in Your Frontend

### **In an ActiveDrillScreen Component**

```typescript
import { useState } from 'react';
import { completeAttempt } from '../services/attempt_service';

export function ActiveDrillScreen({ drill, onBack }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartRecording = async () => {
    setIsRecording(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      // Simulate collecting IMU data (replace with real sensor integration)
      const imuData = {
        imu: [
          { timestamp_ms: 0, ax: 0.1, ay: 0.0, az: 9.8 },
          // ... collect samples for 30-60 seconds
        ],
        metadata: {
          drill_id: drill.id,
          recording_duration_ms: 45000,
        }
      };

      // Execute full workflow
      const attemptId = await completeAttempt(token, imuData);
      console.log('Attempt completed:', attemptId);

      // TODO: Now read from attempt_results once background worker finishes
      // For now, show success message
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div>
      {/* ... existing drill UI ... */}
      <button 
        onClick={handleStartRecording}
        disabled={isRecording}
      >
        {isRecording ? 'Recording...' : 'Start Recording'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

---

## Data Types Reference

### **IMUSample** (One sensor reading)
```typescript
interface IMUSample {
  timestamp_ms: number;        // When this sample was taken (ms from start)
  rep_number?: number;         // Which rep this belongs to
  ax?: number; ay?: number; az?: number;  // Acceleration (g)
  wx?: number; wy?: number; wz?: number;  // Angular velocity (deg/s)
  q0?: number; q1?: number; q2?: number; q3?: number;  // Quaternions
}
```

### **IMUFilePayload** (What gets uploaded)
```typescript
interface IMUFilePayload {
  imu: IMUSample[];           // Array of sensor samples
  metadata?: {
    drill_id?: string;        // Which drill was being performed
    device?: string;          // Device name (iPhone, Android, sensor name)
    sample_rate_hz?: number;  // How many samples per second (e.g., 100 Hz)
    recording_duration_ms?: number;
  }
}
```

---

## Backend Processing Timeline

```
T=0s: Frontend calls /attempts/start
      Backend: Creates attempts row
      
T=0s-45s: Frontend collects IMU data

T=45s: Frontend calls /attempts/{id}/finish
       Backend: Updates status to "uploaded"
       
T=45s-55s: Background worker picks up attempt
           1. Downloads raw.json from Storage
           2. Parses IMU samples
           3. Computes metrics
           
T=55s: Worker inserts row into attempt_results
       Frontend can now read analytics
```

---

## Error Handling

```typescript
import { completeAttempt } from '../services/attempt_service';

try {
  const attemptId = await completeAttempt(token, imuData);
} catch (error) {
  if (error.message.includes('401')) {
    // Token expired or invalid
    // → Redirect to login
  } else if (error.message.includes('Start attempt failed')) {
    // Backend unreachable or error
    // → Show "Cannot connect to server" message
  } else if (error.message.includes('Upload IMU')) {
    // Storage upload failed
    // → Show "Network error during upload" message
  } else if (error.message.includes('Finish attempt')) {
    // Backend unreachable during finish
    // → File was uploaded but server didn't confirm
    // → May need retry logic
  }
}
```

---

## Testing

### **Test with client_test.py (Your POC)**

Your Python test already does this:
```python
token = sign_in()           # Get JWT
attempt = start_attempt(token)  # Step 1
upload_dummy_file(attempt["signed_upload_url"])  # Step 2
result = finish_attempt(token, attempt["attempt_id"])  # Step 3
```

Same flow, just TypeScript now!

---

## Next Steps

1. **Deploy backend** (main.py + worker.py running)
2. **Set `VITE_API_BASE_URL`** in `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   # or
   VITE_API_BASE_URL=https://your-deployed-api.com
   ```
3. **Add real IMU sensor integration** (BLE, USB, etc.) to collect actual `imuData`
4. **Integrate with ActiveDrillScreen** to trigger recording
5. **Add polling or WebSocket** to know when results are ready

---

## Questions?

- **Where do I get IMU data?** → From a device/sensor over BLE/USB
- **How long does processing take?** → Depends on file size; typically 5-15 seconds
- **Can I cancel a recording?** → Not yet; add `/attempts/{id}/cancel` endpoint if needed
- **What if upload fails?** → Current code throws; add retry logic if needed
