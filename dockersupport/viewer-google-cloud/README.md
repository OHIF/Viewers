This folder contains the instructions for building the ohif/viewer-google-cloud Docker container.

1. [Install Meteor](https://www.meteor.com/install)
1. Clone the repository
```bash
git clone https://github.com/OHIF/Viewers.git
cd Viewers
```

1. Install meteor-build-client-fixed2 so you can build the Standalone Viewer

```bash
npm install -g meteor-build-client-fixed2
```

1. Build the Standalone client-only OHIF Viewer

```bash
cd OHIFViewer/
METEOR_PACKAGE_DIRS="../Packages" meteor-build-client ../dockersupport/viewer-google-cloud/build -s ../config/oidc.json
```

1. Build the Docker image

```bash
cd ../dockersupport/viewer-google-cloud
docker build -t ohif/viewer-google-cloud .
```

1. Run the Docker image using an OAuth Client ID

```bash
docker run --env CLIENT_ID={$someID}.apps.googleusercontent.com --publish 3000:80 ohif/viewer-google-cloud
```
