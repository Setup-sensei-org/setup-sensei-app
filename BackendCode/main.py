from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

from supabase_auth import verify_supabase_jwt
from supabase_db import create_attempt, create_signed_upload_url
from supabase_db import mark_attempt_uploaded
from supabase_db import service_role_headers
from config import SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

# Broad CORS for development so browser preflight (OPTIONS) succeeds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    loginIdentifier: str
    password: str


@app.post("/auth/login")
def auth_login(payload: LoginRequest):
    """Login via Supabase Auth.

    Supports either:
    - email + password (direct)
    - username + password (resolve username -> email using service role, then login)

    This exists because anonymous clients often cannot read `profiles` due to RLS,
    which breaks client-side username lookup.
    """

    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="SUPABASE_URL is not set")
    if not SUPABASE_ANON_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_ANON_KEY is not set")

    identifier = (payload.loginIdentifier or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="loginIdentifier is required")

    email = identifier
    if "@" not in identifier:
        if not SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(
                status_code=500,
                detail=(
                    "SUPABASE_SERVICE_ROLE_KEY is not set on the backend. "
                    "Create BackendCode/.env and add SUPABASE_SERVICE_ROLE_KEY, then restart Uvicorn."
                ),
            )

        # Resolve username -> email using service role (bypasses RLS).
        lookup_url = (
            f"{SUPABASE_URL}/rest/v1/profiles"
            f"?select=email"
            f"&username=eq.{identifier}"
            f"&limit=2"
        )

        try:
            headers = service_role_headers()
        except ValueError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        resp = requests.get(lookup_url, headers=headers, timeout=15)
        if not resp.ok:
            raise HTTPException(
                status_code=500,
                detail=f"Username lookup failed: {resp.status_code} {resp.text}",
            )

        rows = resp.json() or []
        if len(rows) == 0:
            raise HTTPException(status_code=401, detail="User not found")
        if len(rows) > 1:
            raise HTTPException(status_code=409, detail="Username is not unique")

        email = (rows[0].get("email") or "").strip()
        if not email:
            raise HTTPException(status_code=401, detail="User not found")

    # Supabase Auth password grant
    token_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    token_headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    token_body = {"email": email, "password": payload.password}

    token_resp = requests.post(token_url, headers=token_headers, json=token_body, timeout=15)
    if not token_resp.ok:
        # Keep the message short; Supabase often returns detailed reasons.
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return token_resp.json()

@app.options("/attempts/start")
def options_attempts_start() -> dict:
    """Handle CORS preflight for /attempts/start."""
    return {}

#Starts a decorated FastAPI endpoint /attempts/start
@app.post("/attempts/start")
def start_attempt(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    #Extracts the token from the Authorization header
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = verify_supabase_jwt(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    
    #Retrieves the user_id from the JWT payload
    
    user_id = payload.get("id")   # NOT sub

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    attempt = create_attempt(user_id)
    signed_url = create_signed_upload_url(attempt["raw_file_path"])

    return {
        "attempt_id": attempt["attempt_id"],
        "raw_file_path": attempt["raw_file_path"],
        "signed_upload_url": signed_url,
    }

#Registers a POST endpoint
@app.post("/attempts/{attempt_id}/finish")

#attempt_id is pulled from the URL path, and authorization from the authorization handler
def finish_attempt(attempt_id: str, authorization: str | None = Header(default=None)):

    #Request is rejected if Authorization header is missing or malformed
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code = 401, detail = "Missing or invalid Authorization header")
    
    #Extracts the JWT token from Bearer <token>
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = verify_supabase_jwt(token)

    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    

    user_id = payload.get("id")

    #user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    #Updates attempt row using the service role key
    updated = mark_attempt_uploaded(attempt_id, user_id)
    return {"attempt_id": updated["id"], "status": updated["status"], "uploaded_at": updated["uploaded_at"]}