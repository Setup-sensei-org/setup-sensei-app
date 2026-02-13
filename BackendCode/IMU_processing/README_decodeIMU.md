# decodeIMU.py – Function Reference

## Running the backend server

See [BACKEND_SERVER.md](BACKEND_SERVER.md) for instructions on running the FastAPI backend server locally (install dependencies, set up .env, and launch with Uvicorn).

**Note: Some testing/validation is still needed.**

**Setup:**
Before running any backend code, copy `BackendCode/.env.example` to `BackendCode/.env` and fill in your own API keys and secrets. Never commit real secrets to git.

**Example data:**
This repo includes `BackendCode/IMU_processing/raw.json` and `BackendCode/IMU_processing/features.csv` as sample files for testing and reference. You can use these to try out the pipeline or as templates for your own data.

This code is designed for local decoding and feature extraction, but you should test it with your own IMU files and edge cases. If you add new formats or change the pipeline, re-test to ensure correctness.

This document explains the main functions in `decodeIMU.py`: what they do, why they exist in the pipeline, what parameters they accept (including defaults), and what they return.

## Big picture

Typical flow (local):

1. **Get bytes** from a local file (or any byte source)
2. **Parse** bytes into a pandas `DataFrame` (CSV/TSV/JSON/Parquet)
3. **Decode** WT901 20-byte frames into canonical IMU columns (`ax/ay/az/gx/gy/gz`)
4. **Derive** magnitudes (`accel_mag`, `gyro_mag`)
5. **Window** magnitudes over time and compute summary statistics (ML-ready baseline)

Canonical required columns (always present in outputs; missing become `NaN`):

- `timestamp_ms`, `ax`, `ay`, `az`, `gx`, `gy`, `gz`

## Running locally (CLI)

The easiest way to sanity-check parsing + WT901 decoding on your machine is to run:

`BackendCode/IMU_processing/run_decode_local.py`

Run these commands **from the repo root** (so paths don’t accidentally “double nest”).

### Decode only (prints a preview)

```bash
python BackendCode/IMU_processing/run_decode_local.py BackendCode/IMU_processing/raw.json
```

### Decode and write the per-sample decoded CSV

```bash
python BackendCode/IMU_processing/run_decode_local.py BackendCode/IMU_processing/raw.json --out BackendCode/IMU_processing/decoded.csv
```

### Decode + compute windowed features + write `features.csv`

```bash
python BackendCode/IMU_processing/run_decode_local.py BackendCode/IMU_processing/raw.json --features --features-out BackendCode/IMU_processing/features.csv
```

Optional tuning (only used when `--features` is present):

```bash
python BackendCode/IMU_processing/run_decode_local.py BackendCode/IMU_processing/raw.json \
  --features \
  --window-ms 200 \
  --step-ms 100 \
  --min-samples 3 \
  --features-out BackendCode/IMU_processing/features.csv
```

### Error handling

- Default is `--on-error raise` (stop immediately on the first bad packet/row).
- Use `--on-error skip` for best-effort decoding:

```bash
python BackendCode/IMU_processing/run_decode_local.py BackendCode/IMU_processing/raw.json --on-error skip
```

### Notes

- `--out` writes the decoded per-sample table.
- `--features-out` writes the per-window features table.
- Writing CSV/Parquet will **overwrite** the target file if it already exists (pandas default behavior).

## What features are computed (and what they mean)

This module computes two layers of “features”:

1. **Derived signals (per sample)** via `compute_derived_features()`
2. **Windowed summary features (per time window)** via `windowed_magnitude_features()`

### Derived signals (per-sample)

These are added as new columns on the per-sample table:

- `accel_mag` (units: **g**):
  - $\sqrt{ax^2 + ay^2 + az^2}$
  - Orientation-invariant “overall acceleration magnitude”.
- `gyro_mag` (units: **deg/s**):
  - $\sqrt{gx^2 + gy^2 + gz^2}$
  - Orientation-invariant “overall angular speed magnitude”.

Why magnitudes? They’re a simple baseline that doesn’t require sensor fusion / orientation tracking.

### Windowed summary features (per-window)

Each output row summarizes one time window `[timestamp_start_ms, timestamp_end_ms)` for one sensor stream.

**Window metadata / data quality**

- `timestamp_start_ms`, `timestamp_end_ms` (ms): window boundaries
- `n_samples`: number of samples that fell into the window
- `dt_mean_ms` (ms): mean of `diff(timestamp_ms)` within the window (approx sample period)
- `dt_std_ms` (ms): std-dev of `diff(timestamp_ms)` within the window (jitter / drop indicator)

**Accel magnitude features (computed over `accel_mag` within the window)**

- `acc_mean` (g): average magnitude
- `acc_std` (g): variability within the window
- `acc_max` (g): peak magnitude
- `acc_min` (g): minimum magnitude
- `acc_rms` (g): root-mean-square magnitude (often correlates with “power”)
- `acc_ptp` (g): peak-to-peak range (`acc_max - acc_min`)
- `acc_energy` (g²): sum of squares: $\sum accel\_mag^2$
  - Note: this increases with both amplitude and number of samples (so it’s sampling-density dependent).

**Gyro magnitude features (computed over `gyro_mag` within the window)**

- `gyro_mean` (deg/s)
- `gyro_std` (deg/s)
- `gyro_max` (deg/s)
- `gyro_rms` (deg/s)

---

## Why are some parameters after `*`?

Several functions are defined like:

```py
def some_func(x, *, option_a=..., option_b=...):
    ...
```

That `*` means: **everything after it must be passed by keyword**.

### Why it’s used here

- **Prevents accidental argument order bugs**.
  - Without `*`, a call like `decode_wt901_stream(stream, None, "skip")` “works” but is easy to misread and mis-order.
  - With `*`, you must call `decode_wt901_stream(stream, on_error="skip")`, which is self-documenting.
- **Makes defaults safer** when you add parameters later.
  - Keyword-only parameters reduce the chance that older call sites silently change meaning.
- **Improves readability** (especially for time units like ms).
  - `windowed_magnitude_features(df, window_ms=200, step_ms=100)` is much clearer than positional arguments.

It’s not strictly “required” for correctness, but it’s a strong API-safety choice.

---

## `parse_file_bytes_to_dataframe()`

### Why it exists
- Makes it harder to mix up bucket vs path.
- Keeps function signatures clean.

### Used by
- `download_supabase_object_bytes()`

---

## `download_supabase_object_bytes()`

```py
def download_supabase_object_bytes(
    obj: SupabaseObjectRef,
    *,
    supabase_url: str | None = None,
    timeout_s: float = 30,
) -> bytes:
```

### What it does
Downloads a file from Supabase Storage via the Storage REST endpoint and returns the raw bytes.

### Why it’s needed
This is the “Supabase → bytes” adapter.

If your IMU data lives in Supabase Storage (your original target architecture), you need a helper like this so the rest of the pipeline can stay storage-agnostic.

If you are **not** pulling files from Supabase (e.g., you already have local files on disk), you can ignore this function and start from:

- `bytes_to_imu_dataframe(...)` (if you already have bytes)
- or read a local file and pass its bytes into `bytes_to_imu_dataframe(...)`

### Parameters
- `obj` (required): `SupabaseObjectRef(bucket=..., path=...)`
- `supabase_url` (default `None`): overrides the configured `SUPABASE_URL` if provided
- `timeout_s` (default `30`): HTTP timeout

### Returns
- `bytes`: the downloaded object contents

### Raises
- `ValueError` if required inputs are missing
- `RuntimeError` if Supabase returns a non-OK response

---

## `parse_file_bytes_to_dataframe()`

```py
def parse_file_bytes_to_dataframe(file_bytes: bytes, file_path: str) -> pd.DataFrame:
```

### What it does
Parses `file_bytes` into a pandas `DataFrame` based on `file_path` suffix:

- `.csv` → `pd.read_csv`
- `.tsv` → `pd.read_csv(sep="\t")`
- `.json` → tries JSON Lines first, then standard JSON
- `.parquet` → `pd.read_parquet`

### Why it’s needed
Raw IMU data can be stored in multiple formats; this normalizes them into a single in-memory structure.

### Parameters
- `file_bytes` (required): raw file contents
- `file_path` (required): used only to infer the format from suffix

### Returns
- `pd.DataFrame`: parsed rows

### Raises
- `ValueError` for unsupported suffixes or missing inputs
- `ImuDecodeError` for unsupported JSON top-level shapes / invalid UTF-8

---

## `iter_wt901_packets_from_stream()`

```py
def iter_wt901_packets_from_stream(stream: bytes) -> Iterator[bytes]:
```

### What it does
Scans a raw byte stream and yields **valid 20-byte WT901 frames**:

- Frame length must be 20
- Byte 0 must be `0x55`
- Byte 1 must be `0x61`

It resynchronizes by scanning forward one byte at a time until it finds a header.

### Why it’s needed
Some recordings may store raw BLE payload bytes as a continuous stream rather than “one packet per row”.

### Parameters
- `stream` (required): raw stream of bytes

### Returns
- `Iterator[bytes]`: each yielded item is exactly 20 bytes

---

## `decode_wt901_packet()`

```py
def decode_wt901_packet(packet20: bytes) -> dict[str, float]:
```

### What it does
Decodes a single WT901 accel+gyro frame into scaled floats:

- Interprets 6 little-endian signed int16 values at offset 2
- Applies scaling:
  - `accel_g = raw / 32768 * 16`
  - `gyro_dps = raw / 32768 * 2000`

### Why it’s needed
This is the “ground-truth” decoder: it turns the raw 20 bytes into physical units.

### Parameters
- `packet20` (required): a single 20-byte WT901 frame

### Returns
A dict with keys:

- `ax`, `ay`, `az` (in g)
- `gx`, `gy`, `gz` (in deg/s)

### Raises
- `ImuDecodeError` if header/type/length are wrong

---

## `decode_wt901_stream()`

```py
def decode_wt901_stream(
    stream: bytes,
    *,
    timestamps_ms: Sequence[float] | None = None,
    on_error: str = "raise",
) -> pd.DataFrame:
```

### What it does
Decodes all WT901 packets found in a byte stream (via `iter_wt901_packets_from_stream`) into a canonical DataFrame.

### Why it’s needed
Convenience wrapper for “stream-of-bytes” recordings.

### Parameters
- `stream` (required): raw byte stream
- `timestamps_ms` (default `None`): optional timestamps aligned 1:1 with decoded packets
  - If `None`, `timestamp_ms` is set to `NaN`
- `on_error` (default `"raise"`):
  - `"raise"` → fail on first bad packet
  - `"skip"` → skip bad packets

### Returns
- `pd.DataFrame` with required columns (`timestamp_ms`, `ax..gz`)

### Raises
- `ImuDecodeError` if no valid frames are found

---

## `_coerce_packet_value_to_bytes()` (internal helper)

```py
def _coerce_packet_value_to_bytes(value: Any) -> bytes:
```

### What it does
Converts a “packet field” into raw `bytes`.

Supported input representations:

- `bytes` / `bytearray`
- `list[int]` / `tuple[int]` (e.g. your JSON `raw: [85, 97, ...]`)
- hex string (spaces/`0x`/`:`/`-` tolerated)

### Why it’s needed
JSON stores packets as a list of integers; this makes decoding code handle multiple real-world storage styles.

### Returns
- `bytes`

### Raises
- `ImuDecodeError` for missing/invalid values

---

## `decode_wt901_packets_dataframe()`

```py
def decode_wt901_packets_dataframe(
    raw_df: pd.DataFrame,
    *,
    packet_col: str,
    timestamp_col: str | None = "timestamp_ms",
    passthrough_cols: Sequence[str] = ("sensor_role",),
    on_error: str = "raise",
) -> pd.DataFrame:
```

### What it does
Decodes WT901 packets when you already have a table where **each row contains one packet**.

- Reads `raw_df[packet_col]`
- Converts each value to bytes using `_coerce_packet_value_to_bytes`
- Decodes each packet with `decode_wt901_packet`
- Adds timestamps (optional) and carries through metadata columns (e.g. `sensor_role`)

### Why it’s needed
This matches most common storage shape: JSON rows each containing `raw: [..20 bytes..]`.

### Parameters
- `raw_df` (required): input table
- `packet_col` (required): column name containing the packet
- `timestamp_col` (default `"timestamp_ms"`):
  - If provided and present in `raw_df`, values are copied to `timestamp_ms`
  - If `None` or missing, timestamps become `NaN`
- `passthrough_cols` (default `( "sensor_role", )`): metadata columns to copy if they exist
- `on_error` (default `"raise"`): `"raise"` or `"skip"`

### Returns
- `pd.DataFrame` with canonical required columns first, plus any passthrough columns

---

## `ensure_required_imu_columns()`

```py
def ensure_required_imu_columns(df: pd.DataFrame) -> pd.DataFrame:
```

### What it does
Guarantees the canonical columns exist. Any missing columns are created and filled with `NaN`.

Also preserves any **extra columns** by appending them after the required set.

### Why it’s needed
It enforces a stable schema so downstream code can rely on columns existing.

### Returns
- `pd.DataFrame` with required columns in a stable order

---

## `coerce_gyro_alias_columns()`

```py
def coerce_gyro_alias_columns(df: pd.DataFrame) -> pd.DataFrame:
```

### What it does
If canonical `gx/gy/gz` are missing but `wx/wy/wz` exist, it renames:

- `wx → gx`, `wy → gy`, `wz → gz`

If `gx/gy/gz` already exist, it leaves them unchanged.

### Why it’s needed
Compatibility: some stored datasets used `wx/wy/wz` for gyro. This keeps the pipeline robust.

### Returns
- `pd.DataFrame` (copy) with gyro columns normalized to `gx/gy/gz` when possible

---

## `compute_derived_features()`

```py
def compute_derived_features(df: pd.DataFrame) -> pd.DataFrame:
```

### What it does
Adds two derived columns:

- `accel_mag = sqrt(ax^2 + ay^2 + az^2)`
- `gyro_mag  = sqrt(gx^2 + gy^2 + gz^2)`

It also normalizes gyro aliases (`wx/wy/wz → gx/gy/gz`) and ensures canonical columns exist.

### Why it’s needed
- Magnitudes are **orientation-invariant** and work as a minimal baseline feature source.
- Many downstream steps want `accel_mag` / `gyro_mag`.

### Returns
- `pd.DataFrame` with canonical columns + `accel_mag` + `gyro_mag`

---

## `windowed_magnitude_features()`

```py
def windowed_magnitude_features(
    imu_df: pd.DataFrame,
    *,
    window_ms: int = 200,
    step_ms: int | None = None,
    group_col: str = "sensor_role",
    min_samples_per_window: int = 3,
) -> pd.DataFrame:
```

### What it does
Creates a baseline ML-ready **windowed feature table** using only magnitude signals.

- Computes `accel_mag` and `gyro_mag`
- Splits by `group_col` (per sensor stream)
- Slides a time window of length `window_ms` forward by `step_ms`
- For each window with at least `min_samples_per_window` samples, computes summary stats

Windows are treated as half-open intervals: `[start, start + window_ms)`.

### Why it’s needed
Raw IMU data is a time series; most ML models want fixed-size feature vectors. Windowing converts “variable-length stream” into “many fixed-size rows”.

### Parameters (with typical values)
- `window_ms` (default `200`): common starting point for fast motion
- `step_ms` (default `None` → becomes `window_ms // 2`, i.e. `100` when window is `200`)
- `group_col` (default `"sensor_role"`): per-sensor windowing when multiple sensors exist
- `min_samples_per_window` (default `3`): avoids producing noisy stats from sparse windows

### Returns
A `pd.DataFrame` with one row per window per sensor stream. Columns include:

- Identifiers: `sensor_role`, `timestamp_start_ms`, `timestamp_end_ms`
- Density/quality: `n_samples`, `dt_mean_ms`, `dt_std_ms`
- Accel magnitude features: `acc_mean`, `acc_std`, `acc_max`, `acc_min`, `acc_rms`, `acc_ptp`, `acc_energy`
- Gyro magnitude features: `gyro_mean`, `gyro_std`, `gyro_max`, `gyro_rms`

See “What features are computed (and what they mean)” near the top of this document for definitions.

---

## `bytes_to_imu_dataframe()`

```py
def bytes_to_imu_dataframe(
    file_bytes: bytes,
    *,
    file_path: str,
    on_error: str = "raise",
) -> pd.DataFrame:
```

### What it does
High-level helper that takes raw file bytes and returns a decoded IMU DataFrame.

Internally:

1. `parse_file_bytes_to_dataframe(file_bytes, file_path)`
2. If a packet column exists (e.g. `raw`), decode with `decode_wt901_packets_dataframe()`
3. Else, if IMU columns already exist, normalize/derive with `compute_derived_features()`

### Why it’s needed
This is the “bytes → IMU dataframe” entry point. It handles multiple storage styles (packet-per-row vs already-decoded columns).

### Parameters
- `file_bytes` (required): raw contents
- `file_path` (required): used to infer format
- `on_error` (default `"raise"`): passed to decoding logic (`"raise"` / `"skip"`)

### Returns
- `pd.DataFrame` containing canonical columns plus derived magnitude columns

---


## Practical examples

### Decode a local raw file (bytes → IMU DataFrame)

```py
from pathlib import Path
from IMU_processing.decodeIMU import bytes_to_imu_dataframe

p = Path("raw.json")
imu_df = bytes_to_imu_dataframe(p.read_bytes(), file_path=str(p))
print(imu_df.head())
```

### Compute windowed baseline features

```py
from IMU_processing.decodeIMU import windowed_magnitude_features

feat_df = windowed_magnitude_features(imu_df, window_ms=200, step_ms=100, min_samples_per_window=3)
print(feat_df.head())
```
