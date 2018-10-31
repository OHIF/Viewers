# Viewers
This repo contains the OHIF DICOM Viewer and Lesion Tracker, and various shared meteor packages.

Documentation is available here: http://docs.ohif.org/

### Demos
[OHIF Viewer](http://viewer.ohif.org/) - A general-purpose radiology viewer with a variety of tools exposed.

[Lesion Tracker](http://lesiontracker.ohif.org/) - A prototype viewer focused on oncology metrics.

Community
---------

Have questions?  Try posting on our [google groups forum](https://groups.google.com/forum/#!forum/cornerstone-platform).


### Run the viewer

Easiest way to run the OHIF viewer is to use `docker-compose`. Here are the instructions:

````
git clone https://github.com/OHIF/Viewers.git

# alternatively you can just download the required files.
wget https://raw.githubusercontent.com/OHIF/Viewers/master/docker-compose.yml -O docker-compose.yml
mkdir dockersupport && https://raw.githubusercontent.com/OHIF/Viewers/master/dockersupport/app.json -O dockersupport/app.json

docker-compose up
````

This runs
1. Orthanc web interface at `http://0.0.0.0:8042/` (username: `orthanc`, password: `orthanc`). Orthanc dicom server is run on port 4242. You can use the web interface to upload dicoms.
2. OHIF viewer itself at `http://0.0.0.0:3000/`. You should be able to query and open the dicoms uploaded to orthanc.

### Orthanc Docker usage
Following the instructions below, the docker image will listen for DICOM connections on port 4242, and for web traffic on port 8042. The default username for the web interface is `orthanc`, and the password is `orthanc`.
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
