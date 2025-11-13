from fastapi import FastAPI, File, UploadFile, Form, Query, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional
import os

# Uncomment these if you want to use Cloud Storage Signed URLs
# from google.cloud import storage
# import json

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Cannot use "*" with credentials=True
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)

# Custom exception handler to ensure CORS headers on all responses
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Cloud Storage configuration (uncomment and configure if using signed URLs)
# BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "your-bucket-name")
# storage_client = storage.Client()

@app.post("/generate_signed_url")
async def generate_signed_url(
    sessionID: str = Form(..., description="Session ID (UUID) for file organization"),
    filename: str = Form(..., description="Filename for the upload")
):
    """
    Generate a signed URL for direct upload to Cloud Storage.
    This bypasses the 32MB Cloud Run HTTP/1 limit.

    To use this:
    1. Uncomment Cloud Storage imports and configuration above
    2. Set GCS_BUCKET_NAME environment variable
    3. Frontend calls this endpoint first to get signed URL
    4. Frontend uploads directly to the signed URL
    5. Frontend calls /upload_complete to notify backend
    """
    try:
        # UNCOMMENT THIS SECTION TO USE CLOUD STORAGE SIGNED URLS:
        # bucket = storage_client.bucket(BUCKET_NAME)
        # blob_name = f"uploads/{sessionID}/{filename}"
        # blob = bucket.blob(blob_name)
        #
        # # Generate signed URL valid for 1 hour
        # signed_url = blob.generate_signed_url(
        #     version="v4",
        #     expiration=timedelta(hours=1),
        #     method="PUT",
        #     content_type="application/zip"
        # )
        #
        # return {
        #     "signed_url": signed_url,
        #     "blob_name": blob_name,
        #     "sessionID": sessionID,
        #     "expires_in": 3600
        # }

        # For now, return a message to implement Cloud Storage
        return {
            "error": "Cloud Storage not configured",
            "message": "Uncomment Cloud Storage code in main.py and set GCS_BUCKET_NAME",
            "alternative": "Use HTTP/2 by deploying with --use-http2 flag"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload_complete")
async def upload_complete(
    sessionID: str = Form(...),
    blob_name: str = Form(...),
    filename: str = Form(...)
):
    """
    Called by frontend after successfully uploading to Cloud Storage via signed URL.
    Backend can now process the file from Cloud Storage.
    """
    try:
        print(f"Upload completed - Session: {sessionID}, File: {filename}, Blob: {blob_name}")

        # UNCOMMENT TO PROCESS FROM CLOUD STORAGE:
        # bucket = storage_client.bucket(BUCKET_NAME)
        # blob = bucket.blob(blob_name)
        #
        # # Download and process the file
        # local_path = UPLOAD_DIR / filename
        # blob.download_to_filename(local_path)
        #
        # # Process the file here...
        # file_size = local_path.stat().st_size

        return {
            "status": "success",
            "sessionID": sessionID,
            "filename": filename,
            "message": "File upload recorded"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload_dicom")
async def upload_dicom(
    file: UploadFile = File(..., description="ZIP file containing DICOM files"),
    sessionID: str = Form(..., description="Session ID (UUID) for file organization")
):
    """
    Direct upload endpoint (works with HTTP/2 for unlimited size).

    NOTE: Cloud Run HTTP/1 has 32MB limit. For larger files:
    - Use HTTP/2 (deploy with --use-http2 flag) - NO SIZE LIMIT
    - OR use /generate_signed_url endpoint for Cloud Storage uploads
    """
    try:
        print(f"Session ID: {sessionID}")
        print(f"Receiving file: {file.filename}")

        # Save the uploaded file
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = file_path.stat().st_size
        print(f"File saved: {file_size} bytes")

        return {
            "filename": file.filename,
            "message": "File uploaded successfully",
            "size": file_size,
            "sessionID": sessionID
        }
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return {"error": str(e)}
    finally:
        file.file.close()

@app.get("/segmentation")
async def get_segmentation(
    sessionID: str = Query(..., description="Session ID (UUID) for tracking")
):
    """
    Serve the segmentations.zip file
    """
    # Print session ID
    print(f"Session ID: {sessionID}")

    file_path = Path("segmentations.zip")

    if not file_path.exists():
        return {"error": "segmentations.zip not found"}

    return FileResponse(
        path=file_path,
        media_type="application/zip",
        filename="segmentations.zip"
    )

@app.get("/generate_report")
async def generate_report(
    sessionID: str = Query(..., description="Session ID (UUID) for tracking")
):
    """
    Serve the mri_report.pdf file
    """
    # Print session ID
    print(f"Session ID: {sessionID}")

    file_path = Path("mri_report.pdf")

    if not file_path.exists():
        return {"error": "mri_report.pdf not found"}

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename="mri_report.pdf"
    )

@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "DICOM Processing API",
        "endpoints": {
            "POST /upload_dicom": "Upload zipped DICOM file",
            "GET /segmentation": "Download segmentations.zip"
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Run with HTTP/2 support and increased timeouts for large file uploads
    # HTTP/2 removes the 32MB limit on Cloud Run
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        timeout_keep_alive=300,
        limit_max_requests=10000
    )
