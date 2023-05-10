from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
import requests
from orthanc_rest_client import Orthanc
import json
import nibabel as nib
import numpy as np
import pydicom
from io import BytesIO
import tempfile
import os
import shutil
import platipy.dicom as dcm
from platipy.dicom.io import rtstruct_to_nifti


def ohif_viewer(request):
    return HttpResponseRedirect(r'http://127.0.0.1:3000/')


def test_view(request):
    study_instance_uid = request.GET.get('studyInstanceUID')
    DATA_ROOT = '/Users/zpick/Desktop/Viewers/testdata/'
    # Create an Orthanc client object
    client = Orthanc('http://127.0.0.1/pacs')
    query = {'Level': 'Series',
             'Query': {'StudyInstanceUID': study_instance_uid},
             }
    series_query = client.find(query)[0]
    series = client.get_one_series(series_query)
    # Create the output folder if it does not exist
    output_folder = f'{DATA_ROOT}{study_instance_uid}/dcm'
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Download and save the instance files
    for instance_id in series['Instances']:
        # Download the DICOM instance data from the Orthanc server
        instance_data = client.get_instance_file(instance_id)

        # Write the data to a file
        filename = os.path.join(output_folder, f"{instance_id}.dcm")
        with open(filename, "wb") as f:
            for chunk in instance_data:
                f.write(chunk)

    files = os.listdir(output_folder)

    # Iterate over the files
    for file in files:
        try:
            # Get the DICOM object for the file
            dicom_object = pydicom.read_file(
                os.path.join(output_folder, file), force=True)

            # Get the SOP class UID of the DICOM object
            sop_class_uid = dicom_object.SOPClassUID
            print(sop_class_uid)
            # If the SOP class UID is 1.2.840.10008.5.1.4.1.1.481.3, print the file name
            if sop_class_uid == "1.2.840.10008.5.1.4.1.1.481.3":
                nifti_folder = f'/Users/zpick/Desktop/Viewers/testdata/{study_instance_uid}/nifti'
                rtstruct_to_nifti.convert_rtstruct(
                    output_folder, file, output_dir=nifti_folder)
                print(nifti_folder)
        except Exception as e:
            print(e)
        # Load the DICOM instances into memory and create a list of images and image affine matrices

    shutil.rmtree(output_folder)
    return HttpResponse("Instances saved to folder.")
