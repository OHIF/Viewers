# Installation

## Getting the Code

Either clone the repository using Git:

````bash
git clone git@github.com:OHIF/Viewers.git
````

or [Download the latest Master as a ZIP File](https://github.com/OHIF/Viewers/archive/master.zip).

## Set up a DICOM server

1. Choose and install an Image Archive
2. Upload some data into your archive (e.g. with DCMTK's [storescu](http://support.dcmtk.org/docs/storescu.html) or your archive's web interface)
3. Keep the server running

#### Open Source DICOM Image Archive Options

Archive                                    | Installation
-------------------------------------------|
[DCM4CHEE Archive 5.x](https://github.com/dcm4che/dcm4chee-arc-light) | [Installation with Docker](https://github.com/dcm4che/dcm4chee-arc-light/wiki/Running-on-Docker)
[Orthanc](https://www.orthanc-server.com/) | [Installation with Docker](http://book.orthanc-server.com/users/docker.html)
[DICOMcloud](https://github.com/DICOMcloud/DICOMcloud) (**DICOM Web only**)| [Installation](https://github.com/DICOMcloud/DICOMcloud#running-the-code)
[OsiriX](http://www.osirix-viewer.com/) (**Mac OSX only**) |
[Horos](https://www.horosproject.org/)  (**Mac OSX only**) |

*Feel free to make a Pull Request if you want to add to this list.*

## Set up and test the OHIF Viewer (or LesionTracker) application:
1. [Install Meteor](https://www.meteor.com/install)
2. Open a new terminal tab in one of the Application directories (OHIFViewer or LesionTracker)
3. Instruct Meteor to install all dependent NPM Packages

  ````bash
  METEOR_PACKAGE_DIRS="../Packages" meteor npm install
  ````

4. Run Meteor using one of the available configuration files.

  ````bash
  METEOR_PACKAGE_DIRS="../Packages" meteor --settings ../config/orthancDICOMWeb.json
  ````

  **Note:** On Windows, you may need to set PACKAGE_DIRS="../Packages" in your Environment Variables in your operating system settings.

5. Launch the OHIF Viewer / Lesion Tracker Study List by visiting [http://localhost:3000/](http://localhost:3000/) in a web browser.

  **If everything is working correctly, you should see the Study List from your archive when you visit the Study List.**

6. Double-click on a Study in the Study List to launch it in the Viewer

  **If everything is working correctly, you should see your study load into the Viewer.**

#### Troubleshooting
* If you receive a *"No Studies Found"* message and do not see your studies, try changing the Study Date filters to a wider range.
* If you see any errors in your server console, check the [Troubleshooting](../troubleshooting.md) page for more in depth advice.
