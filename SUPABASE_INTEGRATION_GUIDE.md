# Supabase Integration Summary (Option B Approach)

## Overview
You chose **Option B**: Adapt the frontend API to your existing schema + create missing tables for new features.

---

## What Was Created

### New Migrations (3 files)

**migration_thirteen:** 
- Adds `electrical_sync_rate` to `profiles` (0-100 percentage)
- Used for tracking user's neural sync improvement over time

**migration_fourteen:** 
- Creates `roadmap_nodes` table
- Tracks user progression through training levels (1-7)
- Stores status: locked → active → completed
- One row per user per level

**migration_fifteen:** 
- Creates `drills` table
- Stores drill definitions and biometric targets
- Each drill has:
  - Metadata: title, category, difficulty, sets
  - Biometric targets: impact force, rotations, acceleration
  - Feedback targets: posture score, balance, neural sync
  - One drill per user

---

## How Frontend Maps to Your Schema

### Authentication
- `login()` / `signup()`: Uses Supabase Auth
- Profile auto-created via trigger (migration_one)
- Updates username on signup

### Analytics (via `attempt_results`)
```
Frontend SessionAnalytics → Your attempt_results
├─ total_strikes ────────→ rep_count
├─ avg_power ───────────→ metrics.avg_power (or peak_speed)
├─ neural_sync ─────────→ accuracy (as %)
├─ heart_rate ──────────→ metrics.heart_rate (from JSONB)
├─ duration ────────────→ duration_seconds
└─ calories_burned ─────→ metrics.calories_burned (from JSONB)
```

### Progression
- `getRoadmapNodes()`: Reads from `roadmap_nodes` table
- Frontend shows locked/active/completed status per level

### Drills
- `getDrills()`: Reads from `drills` table
- `getDrillDetail()`: Returns drill with biometric targets

---

## What You Need to Do

### 1. Run Migrations on Supabase
Copy each migration SQL from `BackendCode/migration_thirteen/fourteen/fifteen` and run in Supabase SQL Editor:
- Settings → SQL Editor → New Query
- Paste migration content → Run

**Order matters!** Run in sequence: 13 → 14 → 15

### 2. Set Up Environment Variables
Create `.env.local` in project root (use `.env.local.template` as guide):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install Supabase SDK (already done)
```bash
npm install @supabase/supabase-js
```

### 4. Replace Service Files
When ready, replace:
- `src/services/api.ts` ← `EDIT_api_adapted.ts`
- Create `src/services/supabase.ts` ← `EDIT_supabase.ts`

### 5. Seed Initial Data (Optional but Recommended)
Create roadmap nodes and drills for a test user:

```sql
-- Insert 7 roadmap levels for a test user
INSERT INTO public.roadmap_nodes (user_id, level, title, subtitle, status, type, description, path_direction)
VALUES
  ('USER_ID_HERE', 1, 'STANCE', 'FOUNDATION BASICS', 'completed', 'FUNDAMENTALS', 'Learn proper stance', 'right'),
  ('USER_ID_HERE', 2, 'JAB-CROSS', 'FUNDAMENTAL COMBO', 'completed', 'STRIKING', 'Basic punch combo', 'left'),
  ('USER_ID_HERE', 3, '1-2-HOOK', 'POWER SEQUENCE', 'active', 'POWER', 'Three-punch combo', 'right'),
  ('USER_ID_HERE', 4, 'UPPERCUT', NULL, 'locked', 'STRIKING', NULL, 'left'),
  ('USER_ID_HERE', 5, 'SLIP-ROLL', NULL, 'locked', 'DEFENSE', NULL, 'right'),
  ('USER_ID_HERE', 6, 'COUNTER', NULL, 'locked', 'ADVANCED', NULL, 'straight'),
  ('USER_ID_HERE', 7, 'ADVANCED', NULL, 'locked', 'MASTERY', NULL, 'left');

-- Insert sample drill for level 1
INSERT INTO public.drills (user_id, title, category, duration, intensity, difficulty, sets,
  impact_force_kgf, rotation_x_deg, rotation_y_deg, rotation_z_deg, acceleration_ms2,
  posture_score, balance_status, neural_sync_status)
VALUES
  ('USER_ID_HERE', 'STANCE', 'FUNDAMENTALS', '5 MIN', 'MEDIUM', 'BEG', '3x10',
   840.0, 12.5, 45.2, -4.3, 1.2,
   98.3, 'OPTIMAL', 'READY');
```

---

## Data Flow

```
User signs up
     ↓
Auth user created (Supabase Auth)
     ↓
Profile auto-created (trigger)
     ↓
Admin creates roadmap_nodes (7 levels)
     ↓
Admin creates drills (with biometric targets)
     ↓
User sees roadmap on frontend
     ↓
User selects drill → frontend fetches DrillDetail
     ↓
User performs drill → records attempt + attempt_results
     ↓
Analytics screen reads attempt_results → displays metrics
```

---

## Key Design Decisions

✓ **Reuse existing tables**: `attempt_results` is primary analytics source (keeps motion data)
✓ **New tables minimal**: Only `roadmap_nodes` and `drills` added (focused on UI needs)
✓ **RLS policies**: All tables user-scoped (users see only their own data)
✓ **JSONB flexibility**: `metrics` and `quality` in `attempt_results` handle evolving data
✓ **Triggers**: Profile auto-creation reduces frontend complexity

---

## Testing Checklist

- [ ] Migrations run successfully in Supabase
- [ ] `.env.local` created with real credentials
- [ ] `npm run dev` starts without errors
- [ ] Sign up works → row appears in `profiles` table
- [ ] Login works → token stored in localStorage
- [ ] Roadmap loads (if seed data added)
- [ ] Drill detail loads → biometrics show correctly
- [ ] Network tab shows Supabase requests (not errors)

---

## Files Ready to Use

- `EDIT_supabase.ts` → becomes `src/services/supabase.ts`
- `EDIT_api_adapted.ts` → becomes `src/services/api.ts`
- `.env.local.template` → copy to `.env.local` and fill in credentials
- Three migration files → run in Supabase in order

---

## Questions?

If something is unclear, check:
1. Supabase dashboard Table Editor (verify table structure)
2. Browser DevTools Network tab (verify API calls)
3. Supabase Logs (for auth/policy errors)
4. RLS policies (Settings → Auth → Policies)
