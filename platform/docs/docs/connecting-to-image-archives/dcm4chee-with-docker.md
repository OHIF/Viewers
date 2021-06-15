---
sidebar_position: 4
---
# DCM4CHEE with Docker

1. Install Docker (https://www.docker.com/)
2. Follow the DCM4CHEE Guidelines for Running on Docker.

    The easiest path is to use Docker-Compose which will start and stop multiple containers for you. There are excellent instructions provided by the DCM4CHEE team on the 'light archive' repository:

    https://github.com/dcm4che/dcm4chee-arc-light/wiki/Running-on-Docker#use-docker-compose

    * Create docker-compose.yml and docker-compose.env files
    * Start the containers:

    ```` bash
    docker-compose start
    ````

    **Note:** If you are running this on Mac OSX you will probably need to change the default docker-compose.yml file slightly. Specifically, the paths that refer to /var/local/ will likely need to be changed to /opt/

3. Run the OHIF Viewer or Lesion Tracker using the dcm4cheeDIMSE.json configuration file

    ````bash
    cd OHIFViewer
    PACKAGE_DIRS="../Packages" meteor --settings ../config/dcm4cheeDIMSE.json
    ````

## Web Service URLs from DCM4CHEE:
Original source here: https://github.com/dcm4che/dcm4chee-arc-light/wiki/Running-on-Docker#web-service-urls

 - Archive UI: <http://localhost:8080/dcm4chee-arc/ui> - if secured, login with

     Username | Password | Role
     --- | --- | ---
     `user` | `user` | `user`
     `admin` | `admin` | `user` + `admin`
 - Keycloak Administration Console: <http://localhost:8080/auth>, login with Username: `admin`, Password: `admin`.
 - Wildfly Administration Console: <http://localhost:9990>, login with Username: `admin`, Password: `admin`.
 - Kibana UI: <http://localhost:5601>
 - DICOM QIDO-RS Base URL: <http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs>
 - DICOM STOW-RS Base URL: <http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs>
 - DICOM WADO-RS Base URL: <http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs>
 - DICOM WADO-URI: <http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado>
