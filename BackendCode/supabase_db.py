import uuid #-- for generating UUIDs
import requests #-- for making HTTP requests

# Import configuration variables
from config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPABASE_STORAGE_BUCKET
from datetime import datetime, timezone

def service_role_headers() -> dict:
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not set.")
    #builds the headers for every REST call made to the service role
    return{ 
        #identifies project + grants access
        "apikey": SUPABASE_SERVICE_ROLE_KEY, 

        #authenticates the request
        "Authorization":f"Bearer {SUPABASE_SERVICE_ROLE_KEY}", 

        #Tells supabase the body is json
        "Content-Type":"application/json", 

        #asks supabase to return the modified rows for debugging
        "Prefer":"return=representation", 
    }


def create_attempt(user_id:str) -> dict:
    
    '''Function that takes user_id from a verified JWT and returns a 
    dictionary with attempt_id and raw_file_path for storing 
    the raw IMU session file'''

    #generate a unique id for the attempt
    attempt_id = str(uuid.uuid4()) 

    #The Supabase REST endpoint for the attempts table
    url = f"{SUPABASE_URL}/rest/v1/attempts"

    #Builds the storage path where the raw IMU data will be uploaded
    raw_file_path = f"{user_id}/{attempt_id}/raw.json"

    #JSON body sent to supabase to create a new row in the attempts table
    payload = {
        "id": attempt_id,
        "user_id": user_id,
        "status": "created",
        "raw_file_path": raw_file_path,
    }

    #Make the POST request to create the attempt
    response = requests.post(url, headers=service_role_headers(), json=payload, timeout=15)

    #If Supabase returns an error, raise an exception
    if not response.ok:
        raise RuntimeError(f"Create attempt failed: {response.status_code} {response.text}")
    
    #Return only what the client needs.
    return {"attempt_id": attempt_id, "raw_file_path": raw_file_path}

def create_signed_upload_url(raw_file_path: str, expires_in: int = 3600) -> str:
    if not SUPABASE_STORAGE_BUCKET:
        raise ValueError("SUPABASE_STORAGE_BUCKET is not set.")

    url = f"{SUPABASE_URL}/storage/v1/object/upload/sign/{SUPABASE_STORAGE_BUCKET}/{raw_file_path}"
    payload = {"expiresIn": expires_in}

    response = requests.post(url, headers=service_role_headers(), json=payload, timeout=15)
    if not response.ok:
        raise RuntimeError(f"Create signed upload URL failed: {response.status_code} {response.text}")
    data = response.json()

    signed_url = (
        data.get("signedUrl")
        or data.get("signedURL")
        or data.get("signed_url")
        or data.get("url")
    )
    if not signed_url:
        raise RuntimeError(f"Signed URL is missing in response. Got: {data}")

    # Normalize to a valid storage URL
    if signed_url.startswith("http://") or signed_url.startswith("https://"):
        if "/storage/v1/" not in signed_url and "/object/" in signed_url:
            signed_url = signed_url.replace("/object/", "/storage/v1/object/", 1)
        return signed_url

    if signed_url.startswith("/object/"):
        signed_url = "/storage/v1" + signed_url

    return f"{SUPABASE_URL}{signed_url}"
'''
def create_signed_upload_url(raw_file_path: str, expires_in: int = 3600) -> str:
    
    #Ensures bucket name exists in config
    if not SUPABASE_STORAGE_BUCKET:
        raise ValueError("SUPABASE_STORAGE_BUCKET is not set.")
    
    #Builds the supabase REST endpoint for creating a signed upload URL
    url = f"{SUPABASE_URL}/storage/v1/object/upload/sign/{SUPABASE_STORAGE_BUCKET}/{raw_file_path}"
    #Sets the expiration time for the signed URL
    payload = {"expiresIn":expires_in}

    #Makes a POST request to Supabase to use service role key to create a signed upload URL
    response = requests.post(url, headers=service_role_headers(),json=payload, timeout=15)
    if not response.ok:
        raise RuntimeError(f"Create signed upload URL failed: {response.status_code} {response.text}")
    data = response.json()

    # common variants across Supabase versions/endpoints
    signed_url = (
        data.get("signedUrl")
        or data.get("signedURL")
        or data.get("signed_url")
        or data.get("url")
    )

    if not signed_url:
        raise RuntimeError(f"Signed URL is missing in response. Got: {data}")

    # If it's already a full URL, return as-is
    if signed_url.startswith("http://") or signed_url.startswith("https://"):
        return signed_url

    # Otherwise it's a path like "/storage/v1/..."
    return f"{SUPABASE_URL}{signed_url}"
    #Getting the signed URL from the response
    data = response.json()

    #Gets the signed URL key (Supabase sometimes uses camelCase or snake_case)
    signed_url = data.get("signedURL") or data.get("signed_url")

    #Fails if the expected field is missing
    if not signed_url:
        raise RuntimeError("Signed URL is missing in response")
    
    #If it is already a full URL, return as is
    if signed_url.startswith("http://") or signed_url.startswith("https://"):
        return signed_url

    #Normalising to a full URL if path is returned.
'''
def mark_attempt_uploaded(attempt_id: str, user_id:str) -> dict:
    '''Function that marks an attempt as uploaded in the database.'''

    #The Supabase REST endpoint for updating the attempts table
    #Using supabase/postgres filter syntax
    url = f"{SUPABASE_URL}/rest/v1/attempts?id=eq.{attempt_id}&user_id=eq.{user_id}"
    payload = {
        "status": "uploaded",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }

    response = requests.patch(url, headers= service_role_headers(), json=payload, timeout=15)
    if not response.ok:
        raise RuntimeError(f"Update attempt failed: {response.status_code} {response.text}")
    
    #Parses the returned rows as the supabase rest endpoint returns a json array of rows
    rows = response.json()
    if not rows:
        raise RuntimeError("Attempt not found for user")

    return rows[0]