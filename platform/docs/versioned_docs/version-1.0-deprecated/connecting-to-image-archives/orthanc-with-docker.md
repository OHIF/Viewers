---
sidebar_position: 5
---
# Orthanc with Docker

Depending on whether or not you want uploaded studies to persist in Orthanc after Docker has been closed, there are two different methods for starting the Docker image:

## Temporary data storage
This command will start an instance of the jodogne/orthanc-plugins Docker image. *All data will be removed when the instance is stopped!*

````
docker run --rm -p 4242:4242 -p 8042:8042 jodogne/orthanc-plugins
````

## Persistent data storage
In order to allow your data to persist after the instance is stopped, you first need to create an image and attached data volume with Docker. The steps are as follows:

1. Create a persistent data volume for Orthanc to use

    ````
    docker create --name sampledata -v /sampledata jodogne/orthanc-plugins
    ````

    **Note: On Windows, you need to use an absolute path for the data volume, like so:**

    ````
    docker create --name sampledata -v '//C/Users/erik/sampledata' jodogne/orthanc-plugins
    ````

2. Run Orthanc from Docker with the data volume attached

    ````
    docker run --volumes-from sampledata -p 4242:4242 -p 8042:8042 jodogne/orthanc-plugins
    ````

3. Upload your data and it will be persisted
