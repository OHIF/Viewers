# Docker compose files

This folder contains docker-compose files used to spin up OHIF-Viewer with
different options such as locally or with any PAS you desire to

## Public Server

#### build

`$ docker-compose -f docker-compose-publicserver.yml build`

#### run

`$ docker-compose -f docker-compose-publicserver.yml up -d`

then, access the application at [http://localhost](http://localhost)

## Local Orthanc

### Build

`$ docker-compose -f docker-compose-orthanc.yml build`

### Run

Starts containers and leaves them running in the background.

`$ docker-compose -f docker-compose-orthanc.yml up -d`

then, access the application at [http://localhost](http://localhost)

**remember that you have to access orthanc application and include your studies
there**

## Local Dcm4chee

#### build

`$ docker-compose -f docker-compose-dcm4chee.yml build`

#### run

`$ docker-compose -f docker-compose-dcm4chee.yml up -d`

then, access the application at [http://localhost](http://localhost)

**remember that you have to access dcm4chee application and include your studies
there** You can use the following command to import your studies into dcm4che

`$ docker run -v {YOUR_STUDY_FOLDER}:/tmp --rm --network=docker_dcm4che_default dcm4che/dcm4che-tools:5.14.0 storescu -cDCM4CHEE@arc:11112 /tmp`

**make sure that your Docker network name is docker_dcm4chee_default or change
it to the right one**
