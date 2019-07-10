# Google Cloud Healthcare

> The [Google Cloud Healthcare API](https://cloud.google.com/healthcare/) is a
> powerful option for storing medical imaging data in the cloud.

An alternative to deploying your own PACS is to use a software-as-a-service
provider such as Google Cloud. The Cloud Healthcare API promises to be a
scalable, secure, cost effective image storage solution for those willing to
store their data in the cloud. It offers an
[almost-entirely complete DICOMWeb API](https://cloud.google.com/healthcare/docs/dicom)
which requires tokens generated via the
[OAuth 2.0 Sign In flow](https://developers.google.com/identity/sign-in/web/sign-in).
Images can even be transcoded on the fly if this is desired. The Cloud
Healthcare API is a very attractive option because it allows us to avoid
deploying the Meteor server entirely. We can just deploy OHIF as a client-only
static site application.

## Setup a Google Cloud Healthcare Project

- Create a Google Cloud account
- Create a project in Google Cloud
- Enable the [Cloud Healthcare API](https://cloud.google.com/healthcare/) for
  your project.
  - (Optional): Create a Dataset and Data Store for storing your DICOM data
- Enable the
  [Cloud Resource Manager API](https://cloud.google.com/resource-manager/) for
  your project.
  - _Note:_ If you are having trouble finding the APIs, use the search box at
    the top of the Cloud console.
- Go to APIs & Services > Credentials to create an OAuth Consent screen and fill
  in your application details.
  - Under Scopes for Google APIs, click "manually paste scopes".
  - Add the following scopes:
    - `https://www.googleapis.com/auth/cloudplatformprojects.readonly`
    - `https://www.googleapis.com/auth/cloud-healthcare`
- Go to APIs & Services > Credentials to create a new set of credentials:

  - Choose the "Web Application" type
  - Set up an
    [OAuth 2.0 Client ID](https://support.google.com/cloud/answer/6158849?hl=en)
  - Add your domain (e.g. `http://localhost:3000`) to Authorized JavaScript
    origins.
  - Add your domain, plus `_oauth/google` (e.g.
    `http://localhost:3000/_oauth/google`) to Authorized Redirect URIs.
  - Save your Client ID for later.

- (Optional): Enable Public Datasets that are being hosted by Google:
  https://cloud.google.com/healthcare/docs/resources/public-datasets/

## Run the viewer with your OAuth Client ID

1. Open the `config/oidc-googleCloud.json` file and change `YOURCLIENTID` to
   your Client ID value.
1. Run the OHIF Viewer using the oidc-googleCloud.json configuration file

```bash
yarn install
REACT_APP_CONFIG=config/google.js yarn run dev
```

## Running via Docker

The OHIF Viewer Docker image can also be connected to Google Cloud Healthcare by modifying the default.js configuration file stored in the image. This is a very simple method to get up and running.

1. Install Docker (https://www.docker.com/)
1. Start the Docker container.
1. Set your Client ID inside your config file.
   Client IDs look like `xyz.apps.googleusercontent.com`.
1. Copy your config file into the container to overwrite the default configuration

```bash
# Run the container. It will default to the public DICOMWeb server
docker run --publish 5000:80 ohif/viewer-google-cloud:latest

# Obtain the container ID
docker ps

# Use the container ID to copy your config file into the container
docker cp ./public/config/google.js 4a3828ac3780:/usr/share/nginx/html/config/default.js

# Now refresh your browser
```