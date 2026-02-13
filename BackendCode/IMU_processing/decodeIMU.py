"""IMU decoding utilities (WT901-class).

This module is part of a robotics / IMU data pipeline.

Pipeline goals implemented here
------------------------------
1. Parse supported file formats (CSV/JSON/TSV/Parquet) into pandas DataFrames
2. Decode WT901-class frames from 20-byte BLE packets (little-endian)
3. Compute derived features: accel_mag, gyro_mag

WT901 BLE frame format (exactly as provided)
------------------------------------------
- Packet length: 20 bytes
- header: byte[0] = 0x55
- type  : byte[1] = 0x61 (accelerometer + gyroscope)

Layout (little-endian int16) starting at byte offset 2
------------------------------------------------------
ax_raw, ay_raw, az_raw, gx_raw, gy_raw, gz_raw

Scaling
-------
accel_g   = raw / 32768 * 16
gyro_dps  = raw / 32768 * 2000
"""

from __future__ import annotations

# json: parse .json files
import json
# math: we use math.nan to represent missing timestamps/values
import math
# struct: interpret raw bytes as little-endian signed int16
import struct
# dataclass: simple typed container for bucket/path
from dataclasses import dataclass
# BytesIO: lets pandas treat raw bytes like a file handle
from io import BytesIO
# PurePosixPath: extracts file suffixes from paths like "a/b/c/raw.json"
from pathlib import PurePosixPath
# typing: type hints to make code easier to read
from typing import Any, Iterator, Sequence

# numpy: vectorized math and NaN
import numpy as np
# pandas: the table structure we output
import pandas as pd



# -------------------------
# WT901 protocol constants
# -------------------------

# Each WT901 BLE frame is exactly 20 bytes.
WT901_PACKET_LEN = 20

# First byte is the header marker.
WT901_HEADER = 0x55

# Second byte indicates frame type; 0x61 is accel+gyro.
WT901_TYPE_ACCEL_GYRO = 0x61


# -------------------------
# Canonical output schema
# -------------------------

# We always return these columns, in this order.
# If any are missing, we fill with NaN (per your constraints).
REQUIRED_COLUMNS = ("timestamp_ms", "ax", "ay", "az", "gx", "gy", "gz")


class ImuDecodeError(RuntimeError):
	"""Raised when raw IMU data cannot be decoded safely."""


# Python decorator to create a simple class for referencing objects (bucket + path).
@dataclass(frozen=True)
class SupabaseObjectRef:
	"""Reference to an object in storage (bucket + path)."""

	bucket: str  # e.g. "raw-imu"
	path: str  # e.g. "user_id/attempt_id/raw.json"


def download_supabase_object_bytes(
	# Object that contains bucket and path info for the object we want to download.
	obj: SupabaseObjectRef,
	*,
	supabase_url: str | None = None,
	timeout_s: float = 30,
) -> bytes:
	"""Download a file from object storage and return its raw bytes."""

	# Local import so the rest of this module can be used for purely-local
	# decoding/feature computation without requiring Supabase configuration.
	import requests  # noqa: WPS433
	from config import SUPABASE_URL  # noqa: WPS433
	from supabase_db import service_role_headers  # noqa: WPS433

	# Choose base URL: explicit arg wins, else config.
	base_url = (supabase_url or SUPABASE_URL).rstrip("/")

	# Validate required inputs early (clear errors).
	if not base_url:
		raise ValueError("SUPABASE_URL is not set")
	if not obj.bucket:
		raise ValueError("bucket is required")
	if not obj.path:
		raise ValueError("object path is required")

	# Storage REST download endpoint:
	#   {SUPABASE_URL}/storage/v1/object/{bucket}/{path}
	url = f"{base_url}/storage/v1/object/{obj.bucket}/{obj.path}"

	# Use service role headers, consistent with BackendCode/worker.py.
	resp = requests.get(url, headers=service_role_headers(), timeout=timeout_s)

	# Fail loudly if the server returns an error.
	if not resp.ok:
		raise RuntimeError(f"Download failed: {resp.status_code} {resp.text}")

	# resp.content is the raw bytes of the object.
	return resp.content


def parse_file_bytes_to_dataframe(file_bytes: bytes, file_path: str) -> pd.DataFrame:
	"""Parse CSV/TSV/JSON/Parquet bytes into a pandas DataFrame.

	Important: this function only loads the file into a DataFrame.
	It does NOT decode WT901 packets by itself.
	"""

	# Defensive checks.
	if file_bytes is None:
		raise ValueError("file_bytes must not be None")
	if not file_path:
		raise ValueError("file_path is required to infer format")

	# Infer format from the file extension.
	suffix = PurePosixPath(file_path).suffix.lower()

	# Wrap bytes so pandas can treat them like a file.
	bio = BytesIO(file_bytes)

	# CSV
	if suffix == ".csv":
		return pd.read_csv(bio)

	# TSV
	if suffix == ".tsv":
		return pd.read_csv(bio, sep="\t")

	# Parquet
	if suffix == ".parquet":
		return pd.read_parquet(bio)

	# JSON
	if suffix == ".json":
		# First try JSON Lines (one JSON object per line).
		try:
			bio.seek(0)
			return pd.read_json(bio, lines=True)
		except Exception:
			# Not JSON Lines; fall back to standard JSON.
			pass

		# Decode bytes -> text.
		try:
			text = file_bytes.decode("utf-8")
		except UnicodeDecodeError as exc:
			raise ImuDecodeError("JSON file is not valid UTF-8") from exc

		# Parse JSON text -> Python object.
		obj = json.loads(text)

		# If JSON is a list, treat each item as a row.
		if isinstance(obj, list):
			return pd.DataFrame(obj)

		# If JSON is a dict, it might contain a list under a known key.
		if isinstance(obj, dict):
			for key in ("data", "imu", "samples", "rows"):
				if isinstance(obj.get(key), list):
					return pd.DataFrame(obj[key])

			# Otherwise treat the dict as a single row.
			return pd.DataFrame([obj])

		# Any other JSON top-level type is unexpected here.
		raise ImuDecodeError(f"Unsupported JSON top-level type: {type(obj).__name__}")

	# If we get here, extension wasn't recognized.
	raise ValueError(
		f"Unsupported file type '{suffix}'. Expected .csv, .tsv, .json, or .parquet"
	)


def iter_wt901_packets_from_stream(stream: bytes) -> Iterator[bytes]:
	"""Extract valid 20-byte WT901 packets from a raw byte stream.

	This function is useful if your raw bytes are *just a stream* of BLE packets.
	It will resynchronize by scanning for 0x55.
	"""

	# Validate input.
	if stream is None:
		raise ValueError("stream must not be None")

	# i = current index into the byte stream.
	i = 0

	# n = total length.
	n = len(stream)

	# Keep scanning while at least 20 bytes remain.
	while i + WT901_PACKET_LEN <= n:
		# If current byte isn't the header, move forward 1 byte.
		if stream[i] != WT901_HEADER:
			i += 1
			continue

		# Candidate packet: take the next 20 bytes.
		packet = stream[i : i + WT901_PACKET_LEN]

		# Validate the frame type.
		if packet[1] != WT901_TYPE_ACCEL_GYRO:
			# Not the accel+gyro packet we want; advance by 1 to resync.
			i += 1
			continue

		# Yield the valid packet.
		yield packet

		# Move forward by exactly one packet length.
		i += WT901_PACKET_LEN


def decode_wt901_packet(packet20: bytes) -> dict[str, float]:
	"""Decode a single 20-byte WT901 accel+gyro packet into scaled values."""

	# Basic input validation.
	if packet20 is None:
		raise ValueError("packet20 must not be None")
	if len(packet20) != WT901_PACKET_LEN:
		raise ImuDecodeError(f"WT901 packet must be 20 bytes, got {len(packet20)}")
	if packet20[0] != WT901_HEADER:
		raise ImuDecodeError(
			f"WT901 packet header mismatch: expected 0x55, got 0x{packet20[0]:02x}"
		)
	if packet20[1] != WT901_TYPE_ACCEL_GYRO:
		raise ImuDecodeError(
			f"WT901 packet type mismatch: expected 0x61, got 0x{packet20[1]:02x}"
		)

	# Unpack 6 signed little-endian int16 values starting at offset 2.
	# Format string:
	#   "<" = little-endian
	#   "h" = signed 16-bit integer
	ax_raw, ay_raw, az_raw, gx_raw, gy_raw, gz_raw = struct.unpack_from("<hhhhhh", packet20, 2)

	# Apply *exact* scaling factors provided.
	accel_scale = 16.0 / 32768.0
	gyro_scale = 2000.0 / 32768.0

	# Return scaled float values.
	return {
		"ax": float(ax_raw) * accel_scale,
		"ay": float(ay_raw) * accel_scale,
		"az": float(az_raw) * accel_scale,
		"gx": float(gx_raw) * gyro_scale,
		"gy": float(gy_raw) * gyro_scale,
		"gz": float(gz_raw) * gyro_scale,
	}


def decode_wt901_stream(
	stream: bytes,
	*,
	timestamps_ms: Sequence[float] | None = None,
	on_error: str = "raise",
) -> pd.DataFrame:
	"""Decode all WT901 packets from a raw byte stream into a canonical DataFrame."""

	# Validate on_error mode.
	if on_error not in {"raise", "skip"}:
		raise ValueError("on_error must be 'raise' or 'skip'")

	# We'll accumulate decoded rows here.
	rows: list[dict[str, Any]] = []

	# Count how many frames were successfully decoded.
	decoded_count = 0

	# Iterate over packets found in the stream.
	for idx, packet in enumerate(iter_wt901_packets_from_stream(stream)):
		try:
			# Decode one packet.
			decoded = decode_wt901_packet(packet)
			decoded_count += 1

			# Add timestamp (or NaN if missing).
			if timestamps_ms is None:
				decoded["timestamp_ms"] = math.nan
			else:
				if idx >= len(timestamps_ms):
					raise ImuDecodeError(
						f"timestamps_ms length ({len(timestamps_ms)}) does not match decoded packets"
					)
				decoded["timestamp_ms"] = float(timestamps_ms[idx])

			# Store the row.
			rows.append(decoded)

		except Exception:
			# Best-effort mode skips bad packets.
			if on_error == "skip":
				continue
			# Strict mode fails loudly.
			raise

	# If no frames were decoded, signal an error.
	if decoded_count == 0:
		raise ImuDecodeError("No valid WT901 (0x55 0x61) frames found in stream")

	# Convert list-of-dicts to a DataFrame.
	df = pd.DataFrame(rows)

	# Ensure we have the canonical columns.
	return ensure_required_imu_columns(df)


def _coerce_packet_value_to_bytes(value: Any) -> bytes:
	"""Convert a packet field into raw bytes.

	Supported representations:
	- bytes / bytearray
	- list[int] / tuple[int] (like your JSON "raw": [85, 97, ...])
	- hex string (optionally with spaces and/or leading 0x)
	"""

	# Treat missing as an error (don't guess).
	if value is None or (isinstance(value, float) and np.isnan(value)):
		raise ImuDecodeError("packet value is missing")

	# If already bytes, just return.
	if isinstance(value, (bytes, bytearray)):
		return bytes(value)

	# If list/tuple of ints, convert to bytes.
	if isinstance(value, (list, tuple)):
		try:
			return bytes(int(x) & 0xFF for x in value)
		except Exception as exc:
			raise ImuDecodeError("packet list/tuple must contain byte values") from exc

	# If a string, interpret as hex.
	if isinstance(value, str):
		s = value.strip().lower()
		if s.startswith("0x"):
			s = s[2:]
		# Remove separators.
		s = "".join(ch for ch in s if ch not in {" ", "\t", "\n", "\r", "-", ":"})
		if len(s) % 2 != 0:
			raise ImuDecodeError("hex packet string must have even length")
		try:
			return bytes.fromhex(s)
		except ValueError as exc:
			raise ImuDecodeError("invalid hex packet string") from exc

	# Anything else is unsupported.
	raise ImuDecodeError(f"Unsupported packet value type: {type(value).__name__}")


def decode_wt901_packets_dataframe(
	raw_df: pd.DataFrame,
	*,
	packet_col: str,
	timestamp_col: str | None = "timestamp_ms",
	passthrough_cols: Sequence[str] = ("sensor_role",),
	on_error: str = "raise",
) -> pd.DataFrame:
	"""Decode WT901 frames stored as one packet per row in a DataFrame."""

	# Ensure the packet column exists.
	if packet_col not in raw_df.columns:
		raise ValueError(f"packet_col '{packet_col}' not found in DataFrame")

	# Validate on_error mode.
	if on_error not in {"raise", "skip"}:
		raise ValueError("on_error must be 'raise' or 'skip'")

	# Accumulate decoded rows.
	rows: list[dict[str, Any]] = []

	# iterrows is not the fastest, but it is the clearest for learning.
	for i, row in raw_df.iterrows():
		try:
			# Extract packet field and convert to bytes.
			packet_bytes = _coerce_packet_value_to_bytes(row[packet_col])

			# Decode bytes -> ax..gz.
			decoded = decode_wt901_packet(packet_bytes)

			# Attach timestamp if present, else NaN.
			if timestamp_col and timestamp_col in raw_df.columns:
				ts = row[timestamp_col]
				decoded["timestamp_ms"] = float(ts) if ts is not None else math.nan
			else:
				decoded["timestamp_ms"] = math.nan

			# Carry through metadata columns (e.g., sensor_role) if present.
			for col in passthrough_cols:
				if col in raw_df.columns:
					decoded[col] = row[col]

			# Store decoded sample.
			rows.append(decoded)

		except Exception as exc:
			if on_error == "skip":
				continue
			raise ImuDecodeError(f"Failed decoding row {i}") from exc

	# If nothing decoded, surface a clear error.
	if not rows:
		raise ImuDecodeError("No packets decoded from DataFrame")

	# Convert to DataFrame and normalize columns.
	return ensure_required_imu_columns(pd.DataFrame(rows))


def ensure_required_imu_columns(df: pd.DataFrame) -> pd.DataFrame:
	"""Ensure the canonical IMU columns exist; missing columns become NaN."""

	# Work on a copy to avoid mutating caller data.
	out = df.copy()

	# Add any missing required columns.
	for col in REQUIRED_COLUMNS:
		if col not in out.columns:
			out[col] = np.nan

	# Return columns in stable order, but keep any extra columns too
	# (e.g., sensor_role, drill_id, etc.).
	extra_cols = [c for c in out.columns if c not in REQUIRED_COLUMNS]
	return out[list(REQUIRED_COLUMNS) + extra_cols]


def coerce_gyro_alias_columns(df: pd.DataFrame) -> pd.DataFrame:
	"""Coerce common gyro aliases into canonical gx/gy/gz.

	Your frontend stores gyro as wx/wy/wz.
	Our canonical schema (and most IMU conventions) uses gx/gy/gz.

	This helper keeps the pipeline resilient when files already contain decoded
	values (i.e., when we're *not* decoding from the raw WT901 packet bytes).

	Rules:
	- If gx/gy/gz are missing and wx/wy/wz exist, rename wx->gx, wy->gy, wz->gz.
	- If both exist, we leave gx/gy/gz alone (treat canonical columns as truth).
	"""

	out = df.copy()

	canonical_present = all(c in out.columns for c in ("gx", "gy", "gz"))
	alias_present = all(c in out.columns for c in ("wx", "wy", "wz"))

	if (not canonical_present) and alias_present:
		out = out.rename(columns={"wx": "gx", "wy": "gy", "wz": "gz"})

	return out


def compute_derived_features(df: pd.DataFrame) -> pd.DataFrame:
	"""Compute accel_mag and gyro_mag and return a new DataFrame."""

	# Normalize gyro column naming before enforcing the canonical schema.
	df = coerce_gyro_alias_columns(df)

	# Ensure base columns exist.
	out = ensure_required_imu_columns(df)

	# Convert columns to numpy arrays for vectorized math.
	ax = out["ax"].to_numpy(dtype=float)
	ay = out["ay"].to_numpy(dtype=float)
	az = out["az"].to_numpy(dtype=float)
	gx = out["gx"].to_numpy(dtype=float)
	gy = out["gy"].to_numpy(dtype=float)
	gz = out["gz"].to_numpy(dtype=float)

	# Copy again since we'll add new columns.
	out = out.copy()

	# Magnitude: sqrt(x^2 + y^2 + z^2)
	out["accel_mag"] = np.sqrt(ax * ax + ay * ay + az * az)
	out["gyro_mag"] = np.sqrt(gx * gx + gy * gy + gz * gz)

	return out


def windowed_magnitude_features(
	imu_df: pd.DataFrame,
	*,
	window_ms: int = 200,
	step_ms: int | None = None,
	group_col: str = "sensor_role",
	min_samples_per_window: int = 3,
) -> pd.DataFrame:
	"""Create a baseline ML-ready feature table from raw IMU samples.

	- Uses only magnitudes: accel_mag and gyro_mag
	- Uses only time-domain statistics
	- Uses fixed-length sliding windows in *time* (ms), not sample counts

	Output: one row per window per sensor stream.
	"""

	# -------------------------
	# What is "windowing"?
	# -------------------------
	#
	# A raw IMU recording is a long time series:
	#   t0, t1, t2, t3, ... with accel/gyro values at each timestamp.
	#
	# Most ML models don't consume a whole variable-length time series directly.
	# Instead, we chop the stream into small fixed-duration chunks called windows
	# (e.g. 200 ms), then compute summary statistics for each chunk.
	#
	# Why this helps:
	# - You get a fixed-size feature vector per window.
	# - You can train classifiers / detectors on many windows.
	# - You can slide the window over time to get a "frame-by-frame" feature stream.
	#
	# IMPORTANT: we do windows in TIME (milliseconds), not "N samples".
	# BLE IMU streams can have jitter and drops, so the number of samples per
	# 200 ms can vary. Time-based windows keep the meaning consistent.

	if window_ms <= 0:
		raise ValueError("window_ms must be > 0")
	if step_ms is None:
		# Default is 50% overlap:
		# window_ms=200 -> step_ms=100 -> windows overlap by 100 ms.
		#
		# Overlap increases temporal resolution (you don't miss short events)
		# at the cost of more feature rows.
		step_ms = window_ms // 2
	if step_ms <= 0:
		raise ValueError("step_ms must be > 0")

	# Ensure magnitudes exist (also normalizes wx/wy/wz -> gx/gy/gz).
	#
	# We compute orientation-invariant magnitudes first:
	#   accel_mag = sqrt(ax^2 + ay^2 + az^2)
	#   gyro_mag  = sqrt(gx^2 + gy^2 + gz^2)
	#
	# Then window features are computed on these 1D signals.
	base = compute_derived_features(imu_df)
	base = base.copy()

	# Carry through sensor role if available; if missing, treat as a single stream.
	#
	# If you have multiple sensors (left_wrist, right_ankle, ...), you typically
	# want window features PER SENSOR because they capture different motion.
	if group_col not in base.columns:
		base[group_col] = "unknown"

	rows: list[dict[str, Any]] = []

	# groupby() splits the big table into separate tables per sensor stream.
	for sensor_role, g in base.groupby(group_col, dropna=False):
		g = g.copy()
		# Drop rows without a timestamp; we can't window them meaningfully.
		g = g[np.isfinite(g["timestamp_ms"].to_numpy(dtype=float))]
		if g.empty:
			continue

		# Sort by timestamp (BLE jitter/out-of-order can happen).
		# We use a *stable sort* (mergesort) so ties keep original order.
		g = g.sort_values("timestamp_ms", kind="mergesort")

		t = g["timestamp_ms"].to_numpy(dtype=float)
		acc = g["accel_mag"].to_numpy(dtype=float)
		gyro = g["gyro_mag"].to_numpy(dtype=float)

		start_t = float(t[0])
		end_t = float(t[-1])

		# We can only start windows where [start, start+window_ms) fits inside the
		# observed time range.
		# Example: if end_t=5000 and window_ms=200, the last valid start is 4800.
		last_start = end_t - float(window_ms)
		if last_start < start_t:
			continue

		# Window starts are in milliseconds.
		#
		# We generate a list like:
		#   start_t, start_t+step_ms, start_t+2*step_ms, ...
		# up to last_start.
		starts = np.arange(start_t, last_start + 1e-9, float(step_ms))

		# Use searchsorted() to slice quickly in sorted time.
		#
		# searchsorted returns indices that keep the array sorted.
		# Because t is sorted, it lets us find the sub-range for a window without
		# scanning every sample.
		#
		# We treat windows as half-open intervals [s, e):
		# - include samples at timestamp == s
		# - exclude samples at timestamp == e
		# This avoids double-counting points that land exactly on boundaries.
		for s in starts:
			e = s + float(window_ms)
			left = int(np.searchsorted(t, s, side="left"))
			right = int(np.searchsorted(t, e, side="left"))

			# n is how many samples landed in this time window.
			n = right - left
			if n < min_samples_per_window:
				# Skip windows that are too sparse.
				# This avoids generating noisy / misleading stats when BLE drops packets.
				continue

			acc_w = acc[left:right]
			gyro_w = gyro[left:right]

			# Time deltas inside the window (data quality signal, still minimal).
			#
			# dt is the array of (t[i+1] - t[i]) within the window.
			# - dt_mean_ms approximates the average sample period
			# - dt_std_ms tells you jitter / irregular sampling (drops cause spikes)
			dt = np.diff(t[left:right])
			dt_mean = float(np.nanmean(dt)) if dt.size else math.nan
			dt_std = float(np.nanstd(dt)) if dt.size else math.nan

			# Accel magnitude window features (units: g).
			#
			# mean/std/max/min: classic summary statistics
			# rms: root-mean-square, acts like a "power" measure
			# ptp: peak-to-peak (max-min), a simple "burst range"
			# energy: sum of squares, increases with both duration and amplitude
			acc_mean = float(np.nanmean(acc_w))
			acc_std = float(np.nanstd(acc_w))
			acc_max = float(np.nanmax(acc_w))
			acc_min = float(np.nanmin(acc_w))
			acc_rms = float(np.sqrt(np.nanmean(acc_w * acc_w)))
			acc_ptp = float(acc_max - acc_min)
			acc_energy = float(np.nansum(acc_w * acc_w))

			# Gyro magnitude window features (units: deg/s).
			gyro_mean = float(np.nanmean(gyro_w))
			gyro_std = float(np.nanstd(gyro_w))
			gyro_max = float(np.nanmax(gyro_w))
			gyro_rms = float(np.sqrt(np.nanmean(gyro_w * gyro_w)))

			rows.append(
				{
					# Identify which sensor stream this window came from.
					"sensor_role": sensor_role,
					# Window start/end timestamps (ms since epoch or since recording start,
					# depending on how you collected timestamp_ms).
					"timestamp_start_ms": float(s),
					"timestamp_end_ms": float(e),
					# Data quality / density.
					"n_samples": int(n),
					"dt_mean_ms": dt_mean,
					"dt_std_ms": dt_std,
					# Accel magnitude features.
					"acc_mean": acc_mean,
					"acc_std": acc_std,
					"acc_max": acc_max,
					"acc_min": acc_min,
					"acc_rms": acc_rms,
					"acc_ptp": acc_ptp,
					"acc_energy": acc_energy,
					# Gyro magnitude features.
					"gyro_mean": gyro_mean,
					"gyro_std": gyro_std,
					"gyro_max": gyro_max,
					"gyro_rms": gyro_rms,
				}
			)

	return pd.DataFrame(rows)


def bytes_to_imu_dataframe(
	file_bytes: bytes,
	*,
	file_path: str,
	on_error: str = "raise",
) -> pd.DataFrame:
	"""High-level helper: parse a supported file and return an IMU DataFrame.

	This is the main entry point once you already have file bytes.
	"""

	# Parse bytes -> DataFrame.
	raw_df = parse_file_bytes_to_dataframe(file_bytes, file_path)

	# If packets exist, decode them (preferred; produces gx/gy/gz reliably).
	candidate_packet_cols = [
		"raw",  # your JSON uses this name
		"packet",
		"packet_bytes",
		"raw_packet",
		"ble_packet",
		"payload",
		"packet_hex",
		"raw_hex",
		"hex",
	]

	packet_col = next((c for c in candidate_packet_cols if c in raw_df.columns), None)

	if packet_col:
		imu_df = decode_wt901_packets_dataframe(
			raw_df,
			packet_col=packet_col,
			timestamp_col="timestamp_ms" if "timestamp_ms" in raw_df.columns else None,
			on_error=on_error,
		)
		return compute_derived_features(imu_df)

	# Otherwise, if the file already has sensor columns, normalize and compute magnitudes.
	# Accept wx/wy/wz as aliases for gx/gy/gz.
	if any(col in raw_df.columns for col in ("ax", "ay", "az", "gx", "gy", "gz", "wx", "wy", "wz")):
		raw_df = coerce_gyro_alias_columns(raw_df)
		imu_df = ensure_required_imu_columns(raw_df)
		return compute_derived_features(imu_df)

	# If neither packets nor sensor columns exist, we can't decode.
	raise ImuDecodeError(
		"Could not produce IMU DataFrame. Expected ax/ay/az/gx/gy/gz columns "
		"or a packet column like 'raw'/'packet'/'packet_hex'."
	)


def supabase_path_to_dataframe(
	raw_file_path: str,
	*,
	bucket: str | None = None,
	supabase_url: str | None = None,
	on_error: str = "raise",
) -> pd.DataFrame:
	"""Download a raw file from storage and decode it into an IMU DataFrame."""

	# Local import so local-only workflows don't require Supabase settings.
	from config import SUPABASE_STORAGE_BUCKET  # noqa: WPS433

	# Choose bucket: explicit arg wins, else config.
	bkt = bucket or SUPABASE_STORAGE_BUCKET

	# Validate bucket is known.
	if not bkt:
		raise ValueError("SUPABASE_STORAGE_BUCKET is not set (or bucket not provided)")

	# Download file bytes.
	file_bytes = download_supabase_object_bytes(
		SupabaseObjectRef(bucket=bkt, path=raw_file_path),
		supabase_url=supabase_url,
	)

	# Decode bytes -> DataFrame.
	return bytes_to_imu_dataframe(file_bytes, file_path=raw_file_path, on_error=on_error)

