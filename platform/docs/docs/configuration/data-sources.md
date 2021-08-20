---
sidebar_position: 2
sidebar_label: Data Sources
---

# Data Sources

## Set up a local DICOM server

ATTENTION! Already have a remote or local server? Skip to the
[configuration section](#configuration-learn-more) below.

While the OHIF Viewer can work with any data source, the easiest to configure
are the ones that follow the [DICOMWeb][dicom-web] spec.

1. Choose and install an Image Archive
2. Upload data to your archive (e.g. with DCMTK's [storescu][storescu] or your
   archive's web interface)
3. Keep the server running

For our purposes, we will be using `Orthanc`, but you can see a list of
[other Open Source options](#open-source-dicom-image-archives) below.

### Requirements

- Docker
  - [Docker for Mac](https://docs.docker.com/docker-for-mac/)
  - [Docker for Windows (recommended)](https://docs.docker.com/docker-for-windows/)
  - [Docker Toolbox for Windows](https://docs.docker.com/toolbox/toolbox_install_windows/)

_Not sure if you have `docker` installed already? Try running `docker --version`
in command prompt or terminal_

> If you are using `Docker Toolbox` you need to change the _PROXY_DOMAIN_
> parameter in _platform/viewer/package.json_ to http://192.168.99.100:8042 or
> the ip docker-machine ip throws. This is the value [`WebPack`][webpack-proxy]
> uses to proxy requests

## Open Source DICOM Image Archives

There are a lot of options available to you to use as a local DICOM server. Here
are some of the more popular ones:

| Archive                                       | Installation                       |
| --------------------------------------------- | ---------------------------------- |
| [DCM4CHEE Archive 5.x][dcm4chee]              | [W/ Docker][dcm4chee-docker]       |
| [Orthanc][orthanc]                            | [W/ Docker][orthanc-docker]        |
| [DICOMcloud][dicomcloud] (**DICOM Web only**) | [Installation][dicomcloud-install] |
| [OsiriX][osirix] (**Mac OSX only**)           | Desktop Client                     |
| [Horos][horos] (**Mac OSX only**)             | Desktop Client                     |

_Feel free to make a Pull Request if you want to add to this list._

Below, we will focus on `DCM4CHEE` and `Orthanc` usage:

### Running Orthanc

_Start Orthanc:_

```bash
# Runs orthanc so long as window remains open
yarn run orthanc:up
```

_Upload your first Study:_

1. Navigate to
   [Orthanc's web interface](http://localhost:8042/app/explorer.html) at
   `http://localhost:8042/app/explorer.html` in a web browser.
2. In the top right corner, click "Upload"
3. Click "Select files to upload..." and select one or more DICOM files
4. Click "Start the upload"

#### Orthanc: Learn More

You can see the `docker-compose.yml` file this command runs at
[`<project-root>/.docker/Nginx-Orthanc/`][orthanc-docker-compose], and more on
Orthanc for Docker in [Orthanc's documentation][orthanc-docker].

#### Connecting to Orthanc

Now that we have a local Orthanc instance up and running, we need to configure
our web application to connect to it. Open a new terminal window, navigate to
this repository's root directory, and run:

```bash
# If you haven't already, enable yarn workspaces
yarn config set workspaces-experimental true

# Restore dependencies
yarn install

# Run our dev command, but with the local orthanc config
yarn run dev:orthanc
```

#### Configuration: Learn More

> For more configuration fun, check out the
> [Essentials Configuration](./index.md) guide.

Let's take a look at what's going on under the hood here. `yarn run dev:orthanc`
is running the `dev:orthanc` script in our project's `package.json` (inside
`platform/viewer`). That script is:

```js
cross-env NODE_ENV=development PROXY_TARGET=/dicom-web PROXY_DOMAIN=http://localhost:8042 APP_CONFIG=config/docker_nginx-orthanc.js webpack-dev-server --config .webpack/webpack.pwa.js -w
```

- `cross-env` sets three environment variables
  - PROXY_TARGET: `/dicom-web`
  - PROXY_DOMAIN: `http://localhost:8042`
  - APP_CONFIG: `config/docker_nginx-orthanc.js`
- `webpack-dev-server` runs using the `.webpack/webpack.pwa.js` configuration
  file. It will watch for changes and update as we develop.

`PROXY_TARGET` and `PROXY_DOMAIN` tell our development server to proxy requests
to `Orthanc`. This allows us to bypass CORS issues that normally occur when
requesting resources that live at a different domain.

The `APP_CONFIG` value tells our app which file to load on to `window.config`.
By default, our app uses the file at
`<project-root>/platform/viewer/public/config/default.js`. Here is what that
configuration looks like:

```js
window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
  dataSources: [
    {
      friendlyName: 'dcmjs DICOMWeb Server',
      namespace: 'org.ohif.default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'DCM4CHEE',
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
};
```

To learn more about how you can configure the OHIF Viewer, check out our
[Configuration Guide](./index.md).

### Running DCM4CHEE

dcm4che is a collection of open source applications for healthcare enterprise
written in Java programming language which implements DICOM standard. dcm4chee
(extra 'e' at the end) is dcm4che project for an Image Manager/Image Archive
which provides storage, retrieval and other functionalities. You can read more
about dcm4chee in their website [here](https://www.dcm4che.org/)

DCM4chee installation is out of scope for these tutorials and can be found
[here](https://github.com/dcm4che/dcm4chee-arc-light/wiki/Run-minimum-set-of-archive-services-on-a-single-host)

An overview of steps for running OHIF Viewer using a local DCM4CHEE is shown
below:

<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/557570043?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
</div>

[dcm4chee]: https://github.com/dcm4che/dcm4chee-arc-light
[dcm4chee-docker]:
  https://github.com/dcm4che/dcm4chee-arc-light/wiki/Running-on-Docker
[orthanc]: https://www.orthanc-server.com/
[orthanc-docker]: http://book.orthanc-server.com/users/docker.html
[dicomcloud]: https://github.com/DICOMcloud/DICOMcloud
[dicomcloud-install]: https://github.com/DICOMcloud/DICOMcloud#running-the-code
[osirix]: http://www.osirix-viewer.com/
[horos]: https://www.horosproject.org/
[default-config]:
  https://github.com/OHIF/Viewers/blob/master/platform/viewer/public/config/default.js
[html-templates]:
  https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/html-templates
[config-files]:
  https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/config

## Static Files

There is a binay DICOM to static file generator, which provides easily served
binary files.  The files are all compressed in order to reduce space signifcantly,
and are pre-computed for the files required for OHIF, so that the performance
of serving the files is just the read from disk/write to http stream time, without
any extra processing time.

The project for the static wado files is located here:
[static-wado]: https://github.com/wayfarer3130/static-wado

It can be compiled with Java and Gradle, and then run against a set of dicom,
in the example located in /dicom/study1 outputting to /dicomweb, and then a
server run against that data, like this:
```
git clone https://github.com/wayfarer3130/static-wado.git
cd static-wado
./gradlew installDist
StaticWado/build/install/StaticWado/bin/StaticWado -d /dicomweb /dicom/study1
cd /dicomweb
npx http-server -p 5000 --cors -g
```

There is then a dev environment in the platform/viewer directory which can be run
against those files, like this:
```
cd platform/viewer
yarn dev:static
```

Additional studies can be added to the dicomweb by re-running the StaticWado command.
It will create a single studies.gz index file (JSON DICOM file, compressed)
containing an index of all studies created.  There is then a small extension
to OHIF which performs client side indexing.

The StaticWado command also knows how to deploy a client and dicomweb directory
to Amazon s3, which can then server files up directly.  There is another
build setup build:aws in the viewer package.json to create such a deployment.
