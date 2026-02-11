# Baseline IMU windowed features (minimal)

This repo stores BLE-captured IMU frames (WT901 `0x55 0x61`) and/or already-decoded samples.
The goal of this baseline is to produce **robust, ML-ready, orientation-invariant** features.

## What we compute

We assume raw per-sample columns:
- `timestamp_ms`
- `ax`, `ay`, `az` (acceleration in **g**)
- `gx`, `gy`, `gz` (angular velocity in **deg/s**)
- optional: `sensor_role` (e.g. `left_wrist`, `right_ankle`)

If your uploaded JSON uses `wx/wy/wz`, the pipeline aliases them to `gx/gy/gz`.

### Per-sample magnitudes (orientation-invariant)

- `accel_mag = sqrt(ax^2 + ay^2 + az^2)`
  - Overall acceleration “strength”, independent of axis orientation.
  - Includes gravity (~1g) plus motion.

- `gyro_mag = sqrt(gx^2 + gy^2 + gz^2)`
  - Overall rotation rate “strength”, independent of axis orientation.

## Windowing

We segment into **fixed-length sliding windows in time** (milliseconds):
- `window_ms` default: **200 ms**
- `step_ms` default: **100 ms** (50% overlap)

We window by timestamps (not sample count) to be robust to BLE jitter and packet drops.
Output is **one row per window per sensor stream** (grouped by `sensor_role`).

## Features per window

All window features are computed on `accel_mag` and `gyro_mag`.

### Data-quality helpers
- `n_samples`: number of samples that landed in the window
- `dt_mean_ms`: mean inter-sample time inside the window
- `dt_std_ms`: stddev of inter-sample time inside the window

These help you detect dropped packets / jitter (high `dt_std_ms`) and sparse windows.

### Acceleration features (from `accel_mag`)
- `acc_mean`: average magnitude
- `acc_std`: variability (how much it changes)
- `acc_max`: peak magnitude
- `acc_min`: minimum magnitude
- `acc_rms`: root-mean-square magnitude (like “average power”)
- `acc_ptp`: peak-to-peak range (`max - min`)
- `acc_energy`: sum of squares (`sum(accel_mag^2)`) over the window

### Gyroscope features (from `gyro_mag`)
- `gyro_mean`
- `gyro_std`
- `gyro_max`
- `gyro_rms`

## Why these are useful

These features are a strong baseline for:
- movement classification (what drill / what phase)
- repetition detection (periodic bursts in magnitude)
- coaching feedback heuristics (smooth vs explosive, consistent vs noisy)

Non-goals:
- no gravity alignment, quaternions, sensor fusion
- no frequency domain / FFT
- no labeling logic
