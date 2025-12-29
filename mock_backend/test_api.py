import requests
import zipfile
from pathlib import Path

# Base URL
BASE_URL = "http://localhost:8000"

# Example Study Instance UID (in real usage, this would be from actual DICOM files)
STUDY_INSTANCE_UID = "1.2.840.113619.2.55.3.604688119.969.1255545756.914"

def test_upload_dicom():
    """Test uploading a DICOM zip file"""
    # Create a dummy zip file for testing
    test_zip = Path("test_dicom.zip")
    with zipfile.ZipFile(test_zip, 'w') as zf:
        zf.writestr("dummy.dcm", "dummy dicom content")
    
    print(f"Using Study Instance UID: {STUDY_INSTANCE_UID}")
    
    # Upload the file with studyInstanceUIDs
    with open(test_zip, 'rb') as f:
        files = {'file': ('test_dicom.zip', f, 'application/zip')}
        data = {'studyInstanceUIDs': STUDY_INSTANCE_UID}
        response = requests.post(f"{BASE_URL}/upload_dicom", files=files, data=data)
    
    print("Upload Response:", response.json())
    test_zip.unlink()  # Clean up

def test_download_segmentation():
    """Test downloading segmentations.zip"""
    print(f"Using Study Instance UID: {STUDY_INSTANCE_UID}")
    
    response = requests.get(f"{BASE_URL}/segmentation", params={"studyInstanceUIDs": STUDY_INSTANCE_UID})
    
    if response.status_code == 200:
        # Save the downloaded file
        with open("downloaded_segmentations.zip", "wb") as f:
            f.write(response.content)
        print("Segmentation file downloaded successfully")
    else:
        print("Download Response:", response.json())

def test_download_report():
    """Test downloading mri_report.pdf"""
    print(f"Using Study Instance UID: {STUDY_INSTANCE_UID}")
    
    response = requests.get(f"{BASE_URL}/generate_report", params={"studyInstanceUIDs": STUDY_INSTANCE_UID})
    
    if response.status_code == 200:
        # Save the downloaded file
        with open("downloaded_mri_report.pdf", "wb") as f:
            f.write(response.content)
        print("MRI report PDF downloaded successfully")
    else:
        print("Download Response:", response.json())

def test_check_conversion_status():
    """Test checking conversion status"""
    print(f"Using Study Instance UID: {STUDY_INSTANCE_UID}")
    
    response = requests.get(f"{BASE_URL}/check_conversion_status/{STUDY_INSTANCE_UID}")
    
    if response.status_code == 200:
        print("Conversion Status:", response.json())
    else:
        print("Error Response:", response.json())

if __name__ == "__main__":
    print("Testing DICOM upload...")
    test_upload_dicom()
    
    print("\nTesting conversion status check...")
    test_check_conversion_status()
    
    print("\nTesting segmentation download...")
    test_download_segmentation()

    print("\nTesting MRI report download...")
    test_download_report()
