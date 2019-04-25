# Docker compose files

This folder contains docker-compose files used to spin up OHIF-Viewer with differnt options such as locally or with any PAS you desire to

## Public Server
#### build

`$ docker-compose -f docker-compose-publicserver.yml build`

#### run
`$ docker-compose -f docker-compose-publicserver.yml up -d`

then, access the application at (http://localhost)[http://localhost]

## Local Orthanc
#### build

`$ docker-compose -f docker-compose-orthanc.yml build`

#### run
`$ docker-compose -f docker-compose-orthanc.yml up -d`

then, access the application at (http://localhost)[http://localhost]