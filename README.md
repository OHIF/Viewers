# Viewers
This repo contains the OHIF DICOM Viewer and Lesion Trackers, and various shared meteor packages

Community
---------

Have questions?  Try posting in the [OHIF forum](http://forum.ohif.org/).

### Docker usage
#### Temporary data storage
````
docker run --rm -p 4242:4242 -p 8042:8042 jodogne/orthanc-plugins
````

#### Persistent data storage
1. Create a persistant data volume for Orthanc to use

````
docker create --name sampledata -v /sampledata jodogne/orthanc-plugins
````

2. Run Orthanc from Docker with the data volume attached

````
docker run --volumes-from sampledata -p 4242:4242 -p 8042:8042 jodogne/orthanc-plugins
````

3. Upload your data and it will be persisted
