import json
import time
from datetime import datetime, timezone
from typing import Any

import requests

from config import SUPABASE_URL, SUPABASE_STORAGE_BUCKET
from supabase_db import service_role_headers
from dotenv import load_dotenv
load_dotenv()


# --- Worker settings ---
POLL_INTERVAL_SECONDS = 5
BATCH_SIZE = 10

STATUS_UPLOADED = "uploaded"
STATUS_PROCESSING = "processing"
STATUS_DONE = "done"
STATUS_FAILED = "failed"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def fetch_uploaded_attempts(limit: int = BATCH_SIZE) -> list[dict]:
    """
    Fetch attempts ready for processing (status='uploaded').
    Service role bypasses RLS.
    """
    url = (
        f"{SUPABASE_URL}/rest/v1/attempts"
        f"?status=eq.{STATUS_UPLOADED}"
        f"&order=created_at.asc"
        f"&limit={limit}"
        "&select=id,user_id,raw_file_path,pipeline_version,retry_count"
    )
    resp = requests.get(url, headers=service_role_headers(), timeout=20)
    if not resp.ok:
        raise RuntimeError(f"Fetch uploaded attempts failed: {resp.status_code} {resp.text}")
    return resp.json()


def try_claim_attempt(attempt_id: str) -> dict | None:
    """
    Try to claim work by transitioning uploaded -> processing.
    Uses a filter on BOTH id and status, so only one worker should win.
    Returns the updated row, or None if it was already claimed.
    """
    url = f"{SUPABASE_URL}/rest/v1/attempts?id=eq.{attempt_id}&status=eq.{STATUS_UPLOADED}"
    payload = {"status": STATUS_PROCESSING}
    resp = requests.patch(url, headers=service_role_headers(), json=payload, timeout=20)
    if not resp.ok:
        raise RuntimeError(f"Claim attempt failed: {resp.status_code} {resp.text}")

    rows = resp.json()
    return rows[0] if rows else None


def download_raw_file(raw_file_path: str) -> bytes:
    """
    Download raw IMU file from Supabase Storage using service role key.
    """
    if not SUPABASE_STORAGE_BUCKET:
        raise ValueError("SUPABASE_STORAGE_BUCKET is not set.")

    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{raw_file_path}"
    resp = requests.get(url, headers=service_role_headers(), timeout=30)
    if not resp.ok:
        raise RuntimeError(f"Download raw file failed: {resp.status_code} {resp.text}")
    return resp.content


def compute_placeholder_metrics(raw_bytes: bytes) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    """
    Placeholder metrics so you can prove the pipeline end-to-end.

    Returns:
      core: fields that map to typed columns (overall_score, rep_count, etc.)
      metrics: jsonb payload (flexible)
      quality: jsonb payload (data quality)
    """
    core: dict[str, Any] = {
        "overall_score": None,
        "accuracy": None,
        "duration_seconds": None,
        "rep_count": None,
        "avg_speed": None,
        "peak_speed": None,
    }
    metrics: dict[str, Any] = {}
    quality: dict[str, Any] = {"confidence": 0.2, "parser": "unknown"}

    # Try to parse JSON (your dummy upload uses JSON)
    try:
        text = raw_bytes.decode("utf-8")
        obj = json.loads(text)
        quality["parser"] = "json"
        quality["confidence"] = 0.3

        imu = obj.get("imu", [])
        metrics["sample_count"] = len(imu)
        metrics["has_imu_key"] = "imu" in obj

        # Simple placeholders
        core["rep_count"] = len(imu)
        core["overall_score"] = min(100, len(imu))  # toy score

        # include a little debug snippet (safe-ish for MVP)
        metrics["first_sample"] = imu[0] if imu else None

    except Exception as exc:
        # If parsing fails, just store basic info
        quality["parser"] = "raw"
        quality["parse_error"] = str(exc)
        metrics["raw_bytes_len"] = len(raw_bytes)

    return core, metrics, quality


def insert_attempt_results(
    attempt_id: str,
    user_id: str,
    pipeline_version: str,
    model_version: str,
    core: dict[str, Any],
    metrics: dict[str, Any],
    quality: dict[str, Any],
) -> dict:
    """
    Insert results into public.attempt_results.
    """
    url = f"{SUPABASE_URL}/rest/v1/attempt_results"
    payload: dict[str, Any] = {
        "attempt_id": attempt_id,
        "user_id": user_id,
        "pipeline_version": pipeline_version,
        "model_version": model_version,
        "computed_at": utc_now_iso(),
        **core,
        "metrics": metrics,
        "quality": quality,
    }

    resp = requests.post(url, headers=service_role_headers(), json=payload, timeout=20)
    if not resp.ok:
        raise RuntimeError(f"Insert attempt_results failed: {resp.status_code} {resp.text}")

    rows = resp.json()
    return rows[0] if rows else payload


def mark_attempt_done(attempt_id: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/attempts?id=eq.{attempt_id}"
    payload = {"status": STATUS_DONE, "processed_at": utc_now_iso(), "last_error": None}
    resp = requests.patch(url, headers=service_role_headers(), json=payload, timeout=20)
    if not resp.ok:
        raise RuntimeError(f"Mark done failed: {resp.status_code} {resp.text}")


def get_retry_count(attempt_id: str) -> int:
    url = f"{SUPABASE_URL}/rest/v1/attempts?id=eq.{attempt_id}&select=retry_count"
    resp = requests.get(url, headers=service_role_headers(), timeout=20)
    if not resp.ok:
        raise RuntimeError(f"Fetch retry_count failed: {resp.status_code} {resp.text}")
    rows = resp.json()
    return int(rows[0].get("retry_count", 0)) if rows else 0


def mark_attempt_failed(attempt_id: str, error_message: str) -> None:
    """
    Mark attempt as failed, increment retry_count, store last_error.
    """
    current = get_retry_count(attempt_id)
    url = f"{SUPABASE_URL}/rest/v1/attempts?id=eq.{attempt_id}"
    payload = {
        "status": STATUS_FAILED,
        "retry_count": current + 1,
        "last_error": (error_message or "unknown error")[:2000],
    }
    resp = requests.patch(url, headers=service_role_headers(), json=payload, timeout=20)
    if not resp.ok:
        raise RuntimeError(f"Mark failed failed: {resp.status_code} {resp.text}")


def process_attempt_row(attempt: dict) -> None:
    """
    Full processing for one claimed attempt row.
    """
    attempt_id = attempt["id"]
    user_id = attempt["user_id"]
    raw_file_path = attempt["raw_file_path"]

    pipeline_version = attempt.get("pipeline_version") or "p0"
    model_version = "model 0"  # matches your default

    raw_bytes = download_raw_file(raw_file_path)
    core, metrics, quality = compute_placeholder_metrics(raw_bytes)

    insert_attempt_results(
        attempt_id=attempt_id,
        user_id=user_id,
        pipeline_version=pipeline_version,
        model_version=model_version,
        core=core,
        metrics=metrics,
        quality=quality,
    )

    mark_attempt_done(attempt_id)


def run_forever() -> None:
    print("Worker running. Polling for uploaded attempts...")

    while True:
        try:
            uploaded = fetch_uploaded_attempts(limit=BATCH_SIZE)

            if not uploaded:
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            for attempt in uploaded:
                attempt_id = attempt["id"]

                # Claim (uploaded -> processing). If we lose the race, skip.
                claimed = try_claim_attempt(attempt_id)
                if not claimed:
                    continue

                try:
                    process_attempt_row(claimed)
                    print(f"processed attempt {attempt_id}")
                except Exception as exc:
                    print(f"failed attempt {attempt_id}: {exc}")
                    try:
                        mark_attempt_failed(attempt_id, str(exc))
                    except Exception as exc2:
                        # Don't crash the loop if marking failed fails
                        print(f"also failed to mark attempt failed: {exc2}")

        except Exception as loop_exc:
            print(f"worker loop error: {loop_exc}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    run_forever()