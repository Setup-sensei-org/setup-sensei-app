from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from supabase_auth import verify_supabase_jwt
from supabase_db import create_attempt, create_signed_upload_url
from supabase_db import mark_attempt_uploaded
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