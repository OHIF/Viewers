# Lesion Tracker - Installation on Windows
On Windows, the easiest way to install LesionTracker is using the provided Windows Installer. You can download the latest version of LesionTracker installer from [OHIF](ohif.org)

## Install

1. After you have obtained the latest version of LesionTracker installer, double-click the installer to install the application.
2. When you start the installer, setup wizard will pop up.

  ![Installer Initial](../assets/img/LesionTracker/LT_Installer_Initial.png)

3. Click **Install** to start the installation.
4. LesionTracker will install prerequisites if they do not exist before installing the application.

  ![Prerequisites](../assets/img/LesionTracker/LT_Installer_Prerequisites.png)

5. Click the **Next** if you accept the installation.

  ![After Prerequisites](../assets/img/LesionTracker/LT_Installer_After_Prerequisites.png)

6. Read the license agreement, and if you agree, click **I accept the terms in the License Agreement** and then click the **Next**.

  ![License Aggrement](../assets/img/LesionTracker/LT_Installer_License_Aggrement.png)

7. Select a location to install LesionTracker and click the **Next** to continue.

  ![Select Location](../assets/img/LesionTracker/LT_Installer_Select_Location.png)

8. Click the **Install** to start the installation and the installation will be started.

  ![Launch Installation](../assets/img/LesionTracker/LT_Installer_Launch_Installation.png)

9. Click **Finish** to complete the installation.

  ![Finish](../assets/img/LesionTracker/LT_Installer_Finish.png)

10. When the installation is done,
* You will see the final dialog which gives the URLs in order to connect to LesionTracker Viewer and Orthanc Server.

    * It will launch computer's default browser and display LesionTracker Viewer if you click 'http://localhost:3000'
    * It will launch computer's default browser and enables to upload studies to Orthanc Server if you click 'http://localhost:8042'

  ![Final](../assets/img/LesionTracker/LT_Installer_Final.png)

* Also, LesionTracker installer will create two shortcuts named LesionTracker and Orthanc Server on the Desktop.

    * It will launch computer's default browser and display LesionTracker image viewer if you click LesionTracker application on the Desktop.
    * It will launch computer's default browser and enables to upload studies to Orthanc Server if you click Orthanc Server application.

  ![Desktop Shortcuts](../assets/img/LesionTracker/LT_Installer_Desktop_Shortcuts.png)

11. Click the **Done** and **Close** to close the installation window.

  ![Installation Successful](../assets/img/LesionTracker/LT_Installer_Successful.png)

12. After the installation is completed,
* You can find the project folder in C:\Program Files\OHIF\LesionTracker if you use the default installation location.
* You will find 4 program executables which eases managing the services in the project folder:

    * **Start Services.exe:** Starts LesionTracker, MongoDB and Orthanc services manually.
    * **Stop Services.exe:** Stops LesionTracker, MongoDB and Orthanc services manually.
    * **Turn Off Auto Services.exe:** Configures not to start LesionTracker, MongoDB and Orthanc services automatically when Windows starts up.
    * **Turn On Auto Services.exe:** Configures to start LesionTracker, MongoDB and Orthanc services automatically when Windows starts up.

  ![Services](../assets/img/LesionTracker/LT_Installer_Services.png)

## Uninstall

1. Open the Start Menu.
2. Click **Settings**.
3. Click **Apps** on the Settings menu.
4. Select **Apps & features** from the left panel.
5. Find the LesionTracker in programs list and click LesionTracker, then click the **Uninstall**.

  ![Uninstall](../assets/img/LesionTracker/LT_Installer_Uninstall.png)

6. Click **Uninstall** from the LesionTracker Setup dialog.

  ![Launch Uninstall](../assets/img/LesionTracker/LT_Installer_Launch_Uninstall.png)

When the uninstallation is done, the uninstallation will remove;

* Prerequisites: MongoDB, nodejs and Orthanc Server
* The project folder, OHIF, from C:\Program Files
* Background Services: LesionTracker Server, MongoDB and Orthanc services
* Shortcuts: LesionTracker and Orthanc Server shortcuts on the Desktop
