# Running the Backend Server

This project uses FastAPI for the backend. To run the backend server locally:

1. Make sure you have Python 3.10+ and all dependencies installed (see below).
2. Copy `BackendCode/.env.example` to `BackendCode/.env` and fill in your own secrets.
3. From the repo root, run:

```bash
cd BackendCode
pip install -r requirements.txt  # if you have a requirements.txt
# or install manually:
pip install fastapi uvicorn python-dotenv pydantic requests

# Start the server (from BackendCode/):
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- The server will be available at http://localhost:8000
- The `--reload` flag auto-restarts on code changes (for development).
- If you see errors about missing keys, check your `.env` file.

If you need more endpoints or want to run with production settings, see the FastAPI and Uvicorn docs.
