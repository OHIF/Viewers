# Lesion Tracker - Manage Studies in Orthanc
Orthanc is an open-source, simple and powerful standalone DICOM server which eases DICOM scripting and data management for clinical routine and medical research. LesionTracker installer installs Orthanc as a service and runs automatically in the background. Orthanc serves a web interface, Orthanc Explorer, and it can be accessed through http://localhost:8042 in your web browser or the Orthanc Server shortcut which is created by LesionTracker installer and loads http://localhost:8042 in your default browser.

## Upload a study into Orthanc using Orthanc Explorer

1. Click **Upload** button at the top-right of Orthanc Explorer and you will be brought to the upload page.

  ![Upload](../assets/img/LesionTracker/LT_Orthanc_Upload.png)

2. Select the DICOM files and drag those files into Orthanc Explorer.

  ![Drag and Drop Studies](../assets/img/LesionTracker/LT_Orthanc_Drag_and_Drop.png)

3. Click **Start the upload** and wait until the upload is complete.

  ![Start the Upload](../assets/img/LesionTracker/LT_Orthanc_Start_Upload.png)

4. Click **Patients** to view the uploaded study.

  ![Upload Result](../assets/img/LesionTracker/LT_Orthanc_Upload_Result.png)

## Delete a study from Orthanc using Orthanc Explorer

1. Select a patient from Patients list.

  ![Select Patient](../assets/img/LesionTracker/LT_Orthanc_Delete_Select_Patient.png)

2. Select a study of the patient.

  ![Select Study](../assets/img/LesionTracker/LT_Orthanc_Delete_Select_Study.png)

3. Select **Delete this study** in the Interact menu.

  ![Delete Study](../assets/img/LesionTracker/LT_Orthanc_Delete_Study.png)
