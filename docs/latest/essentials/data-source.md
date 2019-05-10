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
> [configuration section](#) below.

While the OHIF Viewer can work with any data source, the easiest to configure
are the ones that follow the [DICOMWeb][dicom-web] spec.

1. Choose and install an Image Archive
2. Upload data to your archive (e.g. with DCMTK's [storescu][storescu] or your
   archive's web interface)
3. Keep the server running

For our purposes, we will be using `Orthanc`, but you can see a list of
[other Open Source options](#open-source-dicom-image-archives) below.

### Requirements

...

### Running Orthanc

```bash
# Runs orthanc so long as window remains open
yarn run orthanc:up
```

After running this command, you can access
[Orthanc's web interface](http://127.0.0.1:8042) at `http://127.0.0.1:8042` to
upload DICOM files.

You can see the `docker-compose.yml` file this command runs at
`<project-root>/docker/Orthanc/`, and more on Orthanc for Docker in [Orthanc's
documentation][orthanc-docker].

### Setting up OHIF Viewer with Orthanc as an example

Once you have Orthanc running with docker either with temporary data storage or
persistent data storage we con move forward with the next steps.

1. Load orthanc with a dataset you might want to use. To upload data use
   [http://localhost:8042/app/explorer.html](http://localhost:8042/app/explorer.html).

   **orthanc is the username and password for orthanc docker**

2. Go under
   [http://localhost:8042/app/explorer.html#upload](http://localhost:8042/app/explorer.html#upload)
   and upload your DICOM files there

3. After you load the data, open a new terminal tab in the `ohif-viewer`
   directory and install all dependency packages via Yarn

```bash
yarn install
```

3. Run the application using one of the available configuration files. **the
   following command assumes you are under the `root` folder**

```bash
export REACT_APP_CONFIG=$(cat ./config/local_orthanc.js)
yarn start
```

This uses the
[Custom Environment Variables of Create-React-App](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables)
to pass in your configuration. The example above will not work on Windows.
Please visit the link to read about how to set environment variables on Windows.

4. Launch the OHIF Viewer Study List by visiting
   [http://localhost:3000/](http://localhost:3000/) in a web browser.

   **If everything is working correctly, you should see the Study List from your
   archive when you visit the Study List.**

5. Double-click on a Study in the Study List to launch it in the Viewer

   **If everything is working correctly, you should see your study load into the
   Viewer.**

## Open Source DICOM Image Archives

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
