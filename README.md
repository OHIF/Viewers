# Viewers
This repo contains the OHIF DICOM Viewer and Lesion Tracker, and various shared meteor packages

### Demos
[OHIF viewer](http://viewer.ohif.org/) - A prototype general-purpose radiology viewer with a variety of tools exposed.
[Lesiontracker](http://lesiontracker.ohif.org/) - a prototype viewer focused on oncology metrics.

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
    
    **Note: On Windows, you need to use an absolute path for the data volume, like so:**
    
    ````
    docker create --name sampledata -v '//C/Users/erik/sampledata' jodogne/orthanc-plugins
    ````

2. Run Orthanc from Docker with the data volume attached

    ````
    docker run --volumes-from sampledata -p 4242:4242 -p 8042:8042 jodogne/orthanc-plugins
    ````

3. Upload your data and it will be persisted
