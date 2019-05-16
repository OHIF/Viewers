# Google Cloud Healthcare

> The [Google Cloud Healthcare API](https://cloud.google.com/healthcare/) is a powerful option for storing medical imaging data in the cloud.

An alternative to deploying your own PACS is to use a software-as-a-service provider such as Google Cloud. The Cloud Healthcare API promises to be a scalable, secure, cost effective image storage solution for those willing to store their data in the cloud. It offers an [almost-entirely complete DICOMWeb API](https://cloud.google.com/healthcare/docs/dicom) which requires tokens generated via the [OAuth 2.0 Sign In flow](https://developers.google.com/identity/sign-in/web/sign-in). Images can even be transcoded on the fly if this is desired. The Cloud Healthcare API is a very attractive option because it allows us to avoid deploying the Meteor server entirely. We can just deploy OHIF as a client-only static site application.

## Setup a Google Cloud Healthcare Project

1. Create a Google Cloud account
1. Create a project in Google Cloud
1. Enable the [Cloud Healthcare API](https://cloud.google.com/healthcare/) for your project.
1. (Optional): Create a Dataset and Data Store for storing your DICOM data
1. Enable the [Cloud Resource Manager API](https://cloud.google.com/resource-manager/) for your project.

  *Note:* If you are having trouble finding the APIs, use the search box at the top of the Cloud console.

1. Go to APIs & Services > Credentials to create an OAuth Consent screen and fill in your application details.

    - Under Scopes for Google APIs, click "manually paste scopes".
    - Add the following scopes:
        - https://www.googleapis.com/auth/cloudplatformprojects.readonly
        - https://www.googleapis.com/auth/cloud-healthcare

1. Go to APIs & Services > Credentials to create a new set of credentials:
  - Choose the "Web Application" type
  - Set up an [OAuth 2.0 Client ID](https://support.google.com/cloud/answer/6158849?hl=en)

  - Add your domain (e.g. ```http://localhost:3000```) to Authorized JavaScript origins.
  - Add your domain, plus `_oauth/google` (e.g. ```http://localhost:3000/_oauth/google```) to Authorized Redirect URIs.
  - Save your Client ID for later.
1. (Optional): Enable Public Datasets that are being hosted by Google: https://cloud.google.com/healthcare/docs/resources/public-datasets/

## Run the viewer with your OAuth Client ID

1. Open the `config/oidc-googleCloud.json` file and change `YOURCLIENTID` to your Client ID value.
1. Run the OHIF Viewer using the oidc-googleCloud.json configuration file

````bash
cd OHIFViewer
METEOR_PACKAGE_DIRS="../Packages" meteor npm install
METEOR_PACKAGE_DIRS="../Packages" meteor --settings ../config/oidc-googleCloud.json
````

## Running via Docker

OHIF is also providing a Docker container which can connect to Google Cloud Healthcare with a Client ID which is provided at runtime. This is a very simple method to get up and running. Internally, the container is running [Nginx](https://nginx.org/) to serve the [Standalone Viewer](../standalone-viewer/usage.md).

1. Install Docker (https://www.docker.com/)
1. Run the Docker container, providing a Client ID as an environment variable. Client IDs look like `xyz.apps.googleusercontent.com`.

````bash
docker run --env CLIENT_ID=$CLIENT_ID --publish 3000:80 ohif/viewer-google-cloud:latest
````

## Building the ohif/viewer-google-cloud Docker Image

The [ohif/viewer-google-cloud](https://cloud.docker.com/u/ohif/repository/docker/ohif/viewer-google-cloud) Docker image is built as follows. The Dockerfile and nginx.conf are in the `/dockersupport/viewer-google-cloud` folder.

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
METEOR_PACKAGE_DIRS="../Packages" meteor npm install
METEOR_PACKAGE_DIRS="../Packages" meteor-build-client-fixed2 ../dockersupport/viewer-google-cloud/build -s ../config/oidc.json
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
