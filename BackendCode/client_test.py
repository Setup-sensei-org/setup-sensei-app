import json
import requests

from config import API_BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, TEST_EMAIL, TEST_PASSWORD
from dotenv import load_dotenv
load_dotenv()


def sign_in() -> str:
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    response = requests.post(url, headers=headers, json=payload, timeout=15)
    if not response.ok:
        raise RuntimeError(f"Sign-in failed: {response.status_code} {response.text}")
    return response.json()["access_token"]


def start_attempt(token: str) -> dict:
    url = f"{API_BASE_URL}/attempts/start"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(url, headers=headers, timeout=15)
    if not response.ok:
        raise RuntimeError(f"Start attempt failed: {response.status_code} {response.text}")
    data = response.json()
    #print("signed url:", data["signed_upload_url"])

    return data


def upload_dummy_file(signed_url: str) -> None:
    dummy_payload = {"imu": [{"t": 0, "x": 0.1, "y": 0.0, "z": 0.0}]}
    data = json.dumps(dummy_payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    response = requests.put(signed_url, headers=headers, data=data, timeout=30)
    if not response.ok:
        raise RuntimeError(f"Upload failed: {response.status_code} {response.text}")


def finish_attempt(token: str, attempt_id: str) -> dict:
    url = f"{API_BASE_URL}/attempts/{attempt_id}/finish"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(url, headers=headers, timeout=15)
    if not response.ok:
        raise RuntimeError(f"Finish attempt failed: {response.status_code} {response.text}")
    return response.json()


def main() -> None:
    token = sign_in()
    attempt = start_attempt(token)
    upload_dummy_file(attempt["signed_upload_url"])
    result = finish_attempt(token, attempt["attempt_id"])
    print(result)


if __name__ == "__main__":
    main()
