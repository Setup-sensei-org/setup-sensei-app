"""Local runner for decoding an IMU file into a DataFrame.

This script is intentionally kept inside BackendCode/IMU_processing so you can
copy a raw file (e.g. raw.json) into this folder and quickly sanity-check that
our parsing + WT901 decoding works.

Usage examples (from repo root):
  python BackendCode/IMU_processing/run_decode_local.py BackendCode/IMU_processing/raw.json
  python BackendCode/IMU_processing/run_decode_local.py path/to/file.json --out decoded.csv

Notes:
- The main decoder lives in decodeIMU.py.
- This runner prints shape/columns and the first few rows.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _ensure_backendcode_on_syspath() -> None:
	"""Make sure BackendCode/ is importable regardless of where we run from.

	decodeIMU.py imports config.py and supabase_db.py from BackendCode.
	When you run this file from the repo root, Python might not automatically
	include BackendCode on sys.path. We add it explicitly.
	"""

	# __file__ is the path to *this* script:
	#   .../BackendCode/IMU_processing/run_decode_local.py
	# resolve() makes it absolute, and parents[1] goes up two levels:
	#   parents[0] -> .../BackendCode/IMU_processing
	#   parents[1] -> .../BackendCode
	# We want BackendCode/ on sys.path so `import IMU_processing...` works.
	backendcode_dir = Path(__file__).resolve().parents[1]

	# sys.path is the list of directories Python searches for imports.
	# If BackendCode/ isn't already in it, add it at the front so Python finds
	# our project modules reliably (no matter what the current working directory is).
	if str(backendcode_dir) not in sys.path:
		sys.path.insert(0, str(backendcode_dir))


def main() -> int:
	# argparse builds the command-line interface (CLI) for this script.
	# Everything we define here becomes something you can pass in the terminal.
	parser = argparse.ArgumentParser(description="Decode an IMU raw file to a DataFrame")
	parser.add_argument(
		"input_path",
		nargs="?",
		default=None,
		help=(
			"Path to input file (.json/.csv/.tsv/.parquet) containing IMU data. "
			"If omitted, defaults to raw.json next to this script."
		),
	)
	parser.add_argument(
		"--on-error",
		# "raise" means: stop immediately if a packet/row is invalid (throw an exception).
		# "skip"  means: ignore bad packets/rows and keep going (best-effort output).
		choices=["raise", "skip"],
		default="raise",
		help="How to handle bad packets/rows during decoding",
	)
	parser.add_argument(
		"--out",
		default=None,
		# If provided, we'll write the decoded *per-sample* dataframe to this CSV path.
		help="Optional output CSV path (writes decoded dataframe)",
	)
	parser.add_argument(
		"--features",
		# A boolean flag:
		# - if you include --features, args.features becomes True
		# - if you omit it, args.features is False
		# Later we do: if args.features: ...compute windowed features...
		action="store_true",
		help="Compute windowed magnitude features (baseline ML-ready output)",
	)
	parser.add_argument(
		"--window-ms",
		type=int,
		default=200,
		# Only used when --features is enabled.
		help="Window length in milliseconds (used with --features)",
	)
	parser.add_argument(
		"--step-ms",
		type=int,
		default=None,
		# Only used when --features is enabled.
		# If None, the feature code defaults to 50% overlap (step = window//2).
		help="Step size in milliseconds (defaults to 50% overlap)",
	)
	parser.add_argument(
		"--min-samples",
		type=int,
		default=3,
		# Only used when --features is enabled.
		# Prevents computing statistics on windows that have too few samples.
		help="Minimum samples required per window (used with --features)",
	)
	parser.add_argument(
		"--features-out",
		default=None,
		# If provided (and --features is enabled), we'll write the features table.
		# If the filename ends with .parquet we try Parquet; otherwise we write CSV.
		help="Optional output path for features (CSV by default; Parquet if suffix is .parquet)",
	)
	parser.add_argument(
		"--head",
		type=int,
		default=10,
		# Controls how many rows we print to the console (doesn't affect file output).
		help="Number of rows to print",
	)

	# Parse the actual command line into args.* attributes.
	args = parser.parse_args()

	# Ensure imports work before we import from BackendCode/IMU_processing.
	_ensure_backendcode_on_syspath()

	# Import after sys.path fix.
	from IMU_processing.decodeIMU import bytes_to_imu_dataframe, windowed_magnitude_features  # noqa: WPS433

	if args.input_path is None:
		input_path = Path(__file__).with_name("raw.json")
		if not input_path.exists():
			raise SystemExit(
				"Missing input_path. Either pass a file path, or copy raw.json to "
				"BackendCode/IMU_processing/raw.json"
			)
	else:
		input_path = Path(args.input_path)
		if not input_path.exists():
			raise SystemExit(f"Input file not found: {input_path}")

	file_bytes = input_path.read_bytes()
	if len(file_bytes) == 0:
		raise SystemExit(
			f"Input file is empty (0 bytes): {input_path}. Paste the JSON into the file and save it, then rerun."
		)

	df = bytes_to_imu_dataframe(
		file_bytes,
		file_path=input_path.as_posix(),
		on_error=args.on_error,
	)

	print(f"Decoded DataFrame shape: {df.shape}")
	print(f"Columns: {list(df.columns)}")
	print(df.head(args.head).to_string(index=False))

	if args.features:
		feat_df = windowed_magnitude_features(
			df,
			window_ms=args.window_ms,
			step_ms=args.step_ms,
			min_samples_per_window=args.min_samples,
		)
		print("\nFeatures DataFrame:")
		print(f"Shape: {feat_df.shape}")
		print(f"Columns: {list(feat_df.columns)}")
		print(feat_df.head(args.head).to_string(index=False))

		if args.features_out:
			out_path = Path(args.features_out)
			out_path.parent.mkdir(parents=True, exist_ok=True)
			if out_path.suffix.lower() == ".parquet":
				try:
					feat_df.to_parquet(out_path, index=False)
				except Exception as exc:
					raise SystemExit(
						"Failed writing Parquet. Install 'pyarrow' (recommended) or "
						"use a .csv output path instead.\n" + str(exc)
					)
				print(f"Wrote Parquet: {out_path}")
			else:
				feat_df.to_csv(out_path, index=False)
				print(f"Wrote CSV: {out_path}")

	if args.out:
		out_path = Path(args.out)
		out_path.parent.mkdir(parents=True, exist_ok=True)
		df.to_csv(out_path, index=False)
		print(f"Wrote CSV: {out_path}")

	return 0


if __name__ == "__main__":
	raise SystemExit(main())
