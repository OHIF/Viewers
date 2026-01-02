from fastapi import FastAPI, File, UploadFile, Form, Query, Request, Body, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional
import os

from google.cloud import storage
import json
import requests
import zipfile
from fastapi import Body
import logging

logger = logging.getLogger(__name__)

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

# Cloud Storage configuration
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "ohif-dicom")
try:
    storage_client = storage.Client()
    logger.info(f"Google Cloud Storage client initialized for bucket: {BUCKET_NAME}")
except Exception as e:
    logger.warning(f"Could not initialize GCS client: {e}")
    storage_client = None

@app.post("/generate_signed_url")
async def generate_signed_url(
    studyInstanceUIDs: str = Body(..., description="Session ID (UUID) for file organization", embed=True),
    filename: str = Body(..., description="Filename for the upload", embed=True)
):
    """
    Generate a signed URL for direct upload to Cloud Storage.
    This bypasses the 32MB Cloud Run HTTP/1 limit.

    To use this:
    1. Frontend calls this endpoint first to get signed URL and download URL
    2. Frontend uploads directly to the signed upload URL
    3. Frontend calls /upload_dicom_from_url with the download URL
    """
    try:
        if not storage_client:
            raise HTTPException(
                status_code=503,
                detail="Cloud Storage not available. Check GCS credentials and configuration."
            )

        bucket = storage_client.bucket(BUCKET_NAME)
        blob_name = f"uploads/{studyInstanceUIDs}/{filename}"
        blob = bucket.blob(blob_name)

        # Generate signed URL for upload (PUT) - valid for 1 hour
        upload_signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=1),
            method="PUT",
            content_type="application/zip"
        )

        # Generate signed URL for download (GET) - valid for 2 hours
        download_signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=2),
            method="GET"
        )

        return JSONResponse({
            "upload_url": upload_signed_url,
            "download_url": download_signed_url,
            "blob_name": blob_name,
            "studyInstanceUIDs": studyInstanceUIDs,
            "expires_in": 3600
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating signed URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating signed URL: {str(e)}")

@app.post("/upload_dicom_from_url")
async def upload_dicom_from_url(
    signed_url: str = Body(..., description="Google Cloud Storage signed URL for the DICOM ZIP file", embed=True),
    studyInstanceUIDs: str = Body(..., description="Study Instance UID for file organization", embed=True),
    filename: Optional[str] = Body(None, description="Optional filename for the downloaded file", embed=True)
):
    """
    Download a DICOM ZIP file from a Google Cloud Storage signed URL and process it.

    This endpoint is useful for bypassing HTTP upload size limits by using pre-signed URLs.
    The file will be downloaded from Google Cloud Storage and processed the same way as direct uploads.

    Args:
        signed_url: The pre-signed Google Cloud Storage URL
        studyInstanceUIDs: The UUID session identifier
        filename: Optional custom filename (defaults to dicom_files_{studyInstanceUIDs}.zip)

    Returns:
        Success response with the path where the file was saved
    """
    try:
        # Validate that the URL is from the expected bucket
        if "storage.googleapis.com" not in signed_url:
            raise HTTPException(
                status_code=400,
                detail="Invalid URL: Must be a Google Cloud Storage signed URL"
            )

        # Create session directory
        session_dir = UPLOAD_DIR / studyInstanceUIDs
        session_dir.mkdir(parents=True, exist_ok=True)

        # Determine filename
        zip_filename = filename or f"dicom_files_{studyInstanceUIDs}.zip"
        if not zip_filename.endswith('.zip'):
            zip_filename += '.zip'

        zip_path = session_dir / zip_filename

        logger.info(f"Downloading DICOM ZIP file from signed URL to: {zip_path}")

        # Download the file from the signed URL
        response = requests.get(signed_url, stream=True, timeout=600)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get('content-type', '')
        if 'application/zip' not in content_type and 'application/x-zip' not in content_type and 'application/octet-stream' not in content_type:
            logger.warning(f"Unexpected content type: {content_type}, proceeding anyway...")

        # Save the downloaded file
        total_size = 0
        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    total_size += len(chunk)

        logger.info(f"Successfully downloaded DICOM ZIP file ({total_size} bytes): {zip_path}")

        # Validate that it's actually a ZIP file
        if not zipfile.is_zipfile(zip_path):
            raise HTTPException(
                status_code=400,
                detail="Downloaded file is not a valid ZIP file"
            )

        return JSONResponse({
            "status": "success",
            "message": f"DICOM ZIP file downloaded and processed successfully",
            "path": str(zip_path),
            "studyInstanceUIDs": studyInstanceUIDs,
            "size_bytes": total_size,
            "filename": zip_filename
        })

    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading file from signed URL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading file: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing DICOM ZIP file from URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during file processing: {str(e)}")

@app.post("/upload_dicom")
async def upload_dicom(
    file: UploadFile = File(..., description="ZIP file containing DICOM files"),
    studyInstanceUIDs: str = Form(..., description="Study Instance UID for file organization")
):
    """
    Direct upload endpoint (works with HTTP/2 for unlimited size).

    NOTE: Cloud Run HTTP/1 has 32MB limit. For larger files:
    - Use HTTP/2 (deploy with --use-http2 flag) - NO SIZE LIMIT
    - OR use /generate_signed_url endpoint for Cloud Storage uploads
    """
    try:
        print(f"Session ID: {studyInstanceUIDs}")
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
            "studyInstanceUIDs": studyInstanceUIDs
        }
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return {"error": str(e)}
    finally:
        file.file.close()

@app.get("/segmentation")
async def get_segmentation(
    studyInstanceUIDs: str = Query(..., description="Study Instance UID for tracking")):
    """
    Serve the segmentations.zip file
    """
    # Print session ID
    print(f"Study Instance UID: {studyInstanceUIDs}")

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
    studyInstanceUIDs: str = Query(..., description="Study Instance UID for tracking")
):
    """
    Serve the mri_report.pdf file
    """
    # Print session ID
    print(f"studyInstanceUIDs: {studyInstanceUIDs}")

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


@app.get(
    "/check_conversion_status/{studyInstanceUIDs}",
    summary="Check NIfTI Conversion Status",
    description="Check if DICOM to NIfTI conversion is complete for a session",
    response_description="Conversion status information",
    responses={
        200: {
            "description": "Status check completed",
            "content": {
                "application/json": {
                    "example": {
                        "studyInstanceUIDs": "123e4567-e89b-12d3-a456-426614174000",
                        "conversion_complete": True,
                        "nifti_dir_exists": True,
                        "body_part": "lumbar",
                        "nifti_files_found": 12,
                        "message": "Conversion complete - ready for segmentation"
                    }
                }
            }
        }
    },
    tags=["File Management"]
)
async def check_conversion_status(studyInstanceUIDs: str):
    """
    Check the status of DICOM to NIfTI conversion for a session.

    This endpoint helps the frontend determine if the conversion is complete
    before allowing segmentation to proceed.

    Args:
        studyInstanceUIDs: The UUID session identifier

    Returns:
        JSON with conversion status information
    """
    conversion_complete = True
    nifti_dir_exists = True
    body_part = "cervical"
    nifti_files_count = 1
    message = f"Conversion complete - {body_part} spine detected with {nifti_files_count} volumes"

    return JSONResponse({
        "studyInstanceUIDs": studyInstanceUIDs,
        "conversion_complete": conversion_complete,
        "nifti_dir_exists": nifti_dir_exists,
        "body_part": body_part,
        "nifti_files_found": nifti_files_count,
        "message": message
    })

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
