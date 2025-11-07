from fastapi import FastAPI, File, UploadFile, Form, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pathlib import Path

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Cannot use "*" with credentials=True
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload_dicom")
async def upload_dicom(
    file: UploadFile = File(..., description="ZIP file containing DICOM files"),
    sessionID: str = Form(..., description="Session ID (UUID) for file organization")
):
    """
    Upload a zipped DICOM file with a session ID
    """
    try:
        # Print session ID
        print(f"Session ID: {sessionID}")

        # Save the uploaded file
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "filename": file.filename,
            "message": "File uploaded successfully",
            "size": file_path.stat().st_size,
            "sessionID": sessionID
        }
    except Exception as e:
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
