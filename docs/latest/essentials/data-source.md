# Data Source

After following the steps outlined in [Getting Started](./getting-started.md),
you'll notice that the OHIF Viewer has data for several studies and their
images. You didn't add this data, so where is it coming from?

By default, the viewer is configured to connect to a remote server hosted by the
nice folks over at [dcmjs.org][dcmjs-org]. While convenient for getting started,
the time may come when you want to develop using your own data either locally or
remotely.

## Set up a local DICOM server

> ATTENTION! Already have a remote or local server? Skip to the
> [configuration section](#configuration-learn-more) below.

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

> If you are using `Docker Toolbox` you need to change the _proxy_ parameter in
> _package.json_ to http://192.168.99.100:8042 or the ip docker-machine ip
> throws. This is the value [`react-scripts`][react-proxy] uses to proxy
> requests

### Running Orthanc

_Start Orthanc:_

```bash
# Runs orthanc so long as window remains open
yarn run orthanc:up
```

_Upload your first Study:_

1. Navigate to [Orthanc's web interface](http://localhost:8899) at
   `http://localhost:8899` in a web browser.
2. In the top right corner, click "Upload"
3. Click "Select files to upload..." and select one or more DICOM files
4. Click "Start the upload"

#### Orthanc: Learn More

You can see the `docker-compose.yml` file this command runs at
[`<project-root>/platform/viewer/.recipes/Nginx-Orthanc/`](https://github.com/OHIF/Viewers/tree/master/platform/viewer/.recipes/Nginx-Orthanc),
and more on Orthanc for Docker in [Orthanc's documentation][orthanc-docker].

### Connecting to Orthanc

Now that we have a local Orthanc instance up and running, we need to configure
our web application to connect to it. Open a new terminal window, navigate to
this project's root directory, and run:

```bash
# If you haven't already, restore dependencies
yarn install

# Run our dev command, but with the local orthanc config
yarn run dev:orthanc
```

#### Configuration: Learn More

> For more configuration fun, check out the
> [Essentials Configuration](./configuration.md) guide.

Let's take a look at what's going on under the hood here. `yarn run dev:orthanc`
is running the `dev:orthanc` script in our project's `package.json`. That script
is:

```js
cross-env PORT=5000 APP_CONFIG=config/docker_nginx-orthanc.js react-scripts start
```

- `cross-env` sets two environment variables
  - PORT: 5000
  - APP_CONFIG: `config/docker_nginx-orthanc.js`
- `react-scripts` runs it's `start` script. This is [the de-facto
  way][cra-start] to run a "Create React App" in development mode.

The `APP_CONFIG` value tells our app which file to load on to `window.config`.
By default, our app uses the file at `<project-root>/public/config/default.js`.
Here is what that configuration looks like:

```js
window.config = {
  routerBasename: '/',
  servers: {
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: 'http://localhost:8899/wado',
        qidoRoot: 'http://localhost:8899/dicom-web',
        wadoRoot: 'http://localhost:8899/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
};
```

To learn more about how you can configure the OHIF Viewer, check out our
[Configuration Guide](./configuration.md).

## Open Source DICOM Image Archives

Our example uses `Orthanc`, but there are a lot of options available to you.
Here are some of the more popular ones:

| Archive                                       | Installation                       |
| --------------------------------------------- | ---------------------------------- |
| [DCM4CHEE Archive 5.x][dcm4chee]              | [W/ Docker][dcm4chee-docker]       |
| [Orthanc][orthanc]                            | [W/ Docker][orthanc-docker]        |
| [DICOMcloud][dicomcloud] (**DICOM Web only**) | [Installation][dicomcloud-install] |
| [OsiriX][osirix] (**Mac OSX only**)           | Desktop Client                     |
| [Horos][horos] (**Mac OSX only**)             | Desktop Client                     |

_Feel free to make a Pull Request if you want to add to this list._

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[dcmjs-org]: https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado
[dicom-web]: https://en.wikipedia.org/wiki/DICOMweb
[storescu]: http://support.dcmtk.org/docs/storescu.html
[cra-start]: https://github.com/facebook/create-react-app#npm-start-or-yarn-start
[react-proxy]: https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development#configuring-the-proxy-manually
<!-- Archives -->
[dcm4chee]: https://github.com/dcm4che/dcm4chee-arc-light
[dcm4chee-docker]: https://github.com/dcm4che/dcm4chee-arc-light/wiki/Running-on-Docker
[orthanc]: https://www.orthanc-server.com/
[orthanc-docker]: http://book.orthanc-server.com/users/docker.html
[dicomcloud]: https://github.com/DICOMcloud/DICOMcloud
[dicomcloud-install]: https://github.com/DICOMcloud/DICOMcloud#running-the-code
[osirix]: http://www.osirix-viewer.com/
[horos]: https://www.horosproject.org/
<!-- prettier-ignore-end -->
