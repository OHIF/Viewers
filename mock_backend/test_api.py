import requests
import zipfile
from pathlib import Path
import uuid

# Base URL
BASE_URL = "http://localhost:8000"

SESSION_ID = str(uuid.uuid4())
def test_upload_dicom():
    """Test uploading a DICOM zip file"""
    # Create a dummy zip file for testing
    test_zip = Path("test_dicom.zip")
    with zipfile.ZipFile(test_zip, 'w') as zf:
        zf.writestr("dummy.dcm", "dummy dicom content")
    
    # Generate a test session ID
    
    print(f"Using session ID: {SESSION_ID}")
    
    # Upload the file with session ID
    with open(test_zip, 'rb') as f:
        files = {'file': ('test_dicom.zip', f, 'application/zip')}
        data = {'sessionID': SESSION_ID}
        response = requests.post(f"{BASE_URL}/upload_dicom", files=files, data=data)
    
    print("Upload Response:", response.json())
    test_zip.unlink()  # Clean up

def test_download_segmentation():
    """Test downloading segmentations.zip"""
    # Generate a test session ID
    SESSION_ID
    print(f"Using session ID: {SESSION_ID}")
    
    response = requests.get(f"{BASE_URL}/segmentation", params={"sessionID": SESSION_ID})
    
    if response.status_code == 200:
        # Save the downloaded file
        with open("downloaded_segmentations.zip", "wb") as f:
            f.write(response.content)
        print("Segmentation file downloaded successfully")
    else:
        print("Download Response:", response.json())

def test_download_report():
    """Test downloading mri_report.pdf"""
    # Generate a test session ID
    
    print(f"Using session ID: {SESSION_ID}")
    
    response = requests.get(f"{BASE_URL}/generate_report", params={"sessionID": SESSION_ID})
    
    if response.status_code == 200:
        # Save the downloaded file
        with open("downloaded_mri_report.pdf", "wb") as f:
            f.write(response.content)
        print("MRI report PDF downloaded successfully")
    else:
        print("Download Response:", response.json())

if __name__ == "__main__":
    print("Testing DICOM upload...")
    test_upload_dicom()
    
    print("\nTesting segmentation download...")
    test_download_segmentation()

    print("\nTesting MRI report download...")
    test_download_report()