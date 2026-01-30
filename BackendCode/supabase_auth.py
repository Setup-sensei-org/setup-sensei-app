# supabase_auth.py
import requests
from config import SUPABASE_URL, SUPABASE_ANON_KEY

def verify_supabase_jwt(token: str) -> dict:
    """
    Validate token by asking Supabase Auth.
    Returns user object (includes 'id') if valid.
    """
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL is not set")
    if not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_ANON_KEY is not set")

    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
    }
    resp = requests.get(url, headers=headers, timeout=15)
    if not resp.ok:
        raise ValueError("Invalid token")
    return resp.json()
