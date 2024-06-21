---
sidebar_position: 1
sidebar_label: Configuration Files
---

# Config files

After following the steps outlined in
[Getting Started](./../development/getting-started.md), you'll notice that the
OHIF Viewer has data for several studies and their images. You didn't add this
data, so where is it coming from?

By default, the viewer is configured to connect to a Amazon S3 bucket that is hosting
a Static WADO server (see [Static WADO DICOMWeb](https://github.com/RadicalImaging/static-dicomweb)).
By default we use `default.js` for the configuration file. You can change this by setting the `APP_CONFIG` environment variable
and select other options such as `config/local_orthanc.js` or `config/google.js`.


## Configuration Files

The configuration for our viewer is in the `<root>platform/app/public/config`
directory. Our build process knows which configuration file to use based on the
`APP_CONFIG` environment variable. By default, its value is
[`config/default.js`][default-config]. The majority of the viewer's features,
and registered extension's features, are configured using this file.

The simplest way is to update the existing default config:

```js title="platform/app/public/config/default.js"
window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'dcmjs DICOMWeb Server',
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
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
};
```

> As you can see a new change in `OHIF-v3` is the addition of `dataSources`. You
> can build your own datasource and map it to the internal data structure of
> OHIF’s > metadata and enjoy using other peoples developed mode on your own
> data!
>
> You can read more about data sources at
> [Data Source section in Modes](../platform/modes/index.md)

The configuration can also be written as a JS Function in case you need to
inject dependencies like external services:

```js
window.config = ({ servicesManager } = {}) => {
  const { UIDialogService } = servicesManager.services;
  return {
    cornerstoneExtensionConfig: {
      tools: {
        ArrowAnnotate: {
          configuration: {
            getTextCallback: (callback, eventDetails) => UIDialogService.create({...
          }
        }
      },
    },
    routerBasename: '/',
    dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'dcmjs DICOMWeb Server',
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
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
  };
};
```





## Configuration Options


Here are a list of some options available:
- `disableEditing`:  If true, it disables editing in OHIF, hiding edit buttons in segmentation
  panel and locking already stored measurements.
- `maxNumberOfWebWorkers`: The maximum number of web workers to use for
  decoding. Defaults to minimum of `navigator.hardwareConcurrency` and
  what is specified by `maxNumberOfWebWorkers`. Some windows machines require smaller values.
- `acceptHeader` : accept header to request specific dicom transfer syntax ex : [ 'multipart/related; type=image/jls; q=1', 'multipart/related; type=application/octet-stream; q=0.1' ]
- `investigationalUseDialog`: This should contain an object with `option` value, it can be either `always` which always shows the dialog once per session, `never` which never shows the dialog, or `configure` which shows the dialog once and won't show it again until a set number of days defined by the user, if it's set to configure, you are required to add an additional property `days` which is the number of days to wait before showing the dialog again.
- `groupEnabledModesFirst`: boolean, if set to true, all valid modes for the study get grouped together first, then the rest of the modes. If false, all modes are shown in the order they are defined in the configuration.
- `experimentalStudyBrowserSort`: boolean, if set to true, you will get the experimental StudyBrowserSort component in the UI, which displays a list of sort functions that the displaySets can be sorted by, the sort reflects in all part of the app including the thumbnail/study panel. These sort functions are defined in the customizationModule and can be expanded by users.
- `disableConfirmationPrompts`: boolean, if set to true, it skips confirmation prompts for measurement tracking and hydration.
- `showPatientInfo`: string, if set to 'visible', the patient info header will be shown and its initial state is expanded. If set to 'visibleCollapsed', the patient info header will be shown but it's initial state is collapsed. If set to 'disabled', the patient info header will never be shown, and if set to 'visibleReadOnly', the patient info header will be shown and always expanded.
- `requestTransferSyntaxUID` : Request a specific Transfer syntax from dicom web server ex: 1.2.840.10008.1.2.4.80  (applied only if acceptHeader is not set)
- `omitQuotationForMultipartRequest`: Some servers (e.g., .NET) require the `multipart/related` request to be sent without quotation marks. Defaults to `false`. If your server doesn't require this, then setting this flag to `true` might improve performance (by removing the need for preflight requests). Also note that
if auth headers are used, a preflight request is required.
- `maxNumRequests`: The maximum number of requests to allow in parallel. It is an object with keys of `interaction`, `thumbnail`, and `prefetch`. You can specify a specific number for each type.
- `modesConfiguration`: Allows overriding modes configuration.
  - Example config:
  ```js
    modesConfiguration: {
      '@ohif/mode-longitudinal': {
        displayName: 'Custom Name',
        routeName: 'customRouteName',
          routes: [
            {
              path: 'customPath',
              layoutTemplate: () => {
                /** Custom Layout */
                return {
                  id: ohif.layout,
                  props: {
                    leftPanels: [tracked.thumbnailList],
                    rightPanels: [dicomSeg.panel, tracked.measurements],
                    rightPanelClosed: true,
                    viewports: [
                      {
                        namespace: tracked.viewport,
                        displaySetsToDisplay: [ohif.sopClassHandler],
                      },
                    ],
                  },
                };
              },
            },
          ],
      }
    },
  ```
  Note: Although the mode configuration is passed to the mode factory function, it is up to the particular mode itself if its going to use it to allow overwriting its original configuration e.g.
  ```js
    function modeFactory({ modeConfiguration }) {
    return {
      id,
      routeName: 'viewer',
      displayName: 'Basic Viewer',
      ...
      onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
        ...
      },
      /**
       * This mode allows its configuration to be overwritten by
       * destructuring the modeConfiguration value from the mode fatory function
       * at the end of the mode configuration definition.
       */
      ...modeConfiguration,
    };
  }
  ```
- `showLoadingIndicator`: (default to true), if set to false, the loading indicator will not be shown when navigating between studies.
- `useNorm16Texture`: (default to false), if set to true, it will use 16 bit data type for the image data wherever possible which has
  significant impact on reducing the memory usage. However, the 16Bit textures require EXT_texture_norm16 extension in webGL 2.0 (you can check if you have it here https://webglreport.com/?v=2). In addition to the extension, there are reported problems for Intel Macs that might cause the viewer to crash. In summary, it is great a configuration if you have support for it.
- `useSharedArrayBuffer` (default to 'TRUE', options: 'AUTO', 'FALSE', 'TRUE', note that these are strings), for volume loading we use sharedArrayBuffer to be able to
  load the volume progressively as the data arrives (each webworker has the shared buffer and can write to it). However, there might be certain environments that do not support sharedArrayBuffer. In that case, you can set this flag to false and the viewer will use the regular arrayBuffer which might be slower for large volume loading.
- `supportsWildcard`: (default to false), if set to true, the datasource will support wildcard matching for patient name and patient id.
- `allowMultiSelectExport`: (default to false), if set to true, the user will be able to select the datasource to export the report to.
- `activateViewportBeforeInteraction`: (default to true), if set to false, tools can be used directly without the need to click and activate the viewport.
- `autoPlayCine`: (default to false), if set to true, data sets with the DICOM frame time tag (i.e. (0018,1063)) will auto play when displayed
- `addWindowLevelActionMenu`: (default to true), if set to false, the window level action menu item is NOT added to the viewport action corners
- `dangerouslyUseDynamicConfig`: Dynamic config allows user to pass `configUrl` query string. This allows to load config without recompiling application. If the `configUrl` query string is passed, the worklist and modes will load from the referenced json rather than the default .env config. If there is no `configUrl` path provided, the default behaviour is used and there should not be any deviation from current user experience.<br/>
Points to consider while using `dangerouslyUseDynamicConfig`:<br/>
  - User have to enable this feature by setting `dangerouslyUseDynamicConfig.enabled:true`. By default it is `false`.
  - Regex helps to avoid easy exploit. Default is `/.*/`. Setup your own regex to choose a specific source of configuration only.
  - System administrators can return `cross-origin: same-origin` with OHIF files to disallow any loading from other origin. It will block read access to resources loaded from a different origin to avoid potential attack vector.
  - Example config:
    ```js
    dangerouslyUseDynamicConfig: {
      enabled: false,
      regex: /.*/
    }
    ```
  > Example 1, to allow numbers and letters in an absolute or sub-path only.<br/>
`regex: /(0-9A-Za-z.]+)(\/[0-9A-Za-z.]+)*/`<br/>
Example 2, to restricts to either hosptial.com or othersite.com.<br/>
`regex: /(https:\/\/hospital.com(\/[0-9A-Za-z.]+)*)|(https:\/\/othersite.com(\/[0-9A-Za-z.]+)*)/` <br/>
Example usage:<br/>
`http://localhost:3000/?configUrl=http://localhost:3000/config/example.json`<br/>
- `onConfiguration`: Currently only available for DicomWebDataSource, this option allows the interception of the data source configuration for dynamic values e.g. values coming from url params or query params. Here is an example of building the dicomweb datasource configuration object with values that are based on the route url params:
   ```
   {
     namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
     sourceName: 'gcpdicomweb',
     configuration: {
       friendlyName: 'GCP DICOMWeb Server',
       name: 'gcpdicomweb',
       qidoSupportsIncludeField: false,
       imageRendering: 'wadors',
       thumbnailRendering: 'wadors',
       enableStudyLazyLoad: true,
       supportsFuzzyMatching: false,
       supportsWildcard: false,
       singlepart: 'bulkdata,video,pdf',
       useBulkDataURI: false,
       onConfiguration: (dicomWebConfig, options) => {
         const { params } = options;
         const { project, location, dataset, dicomStore } = params;
         const pathUrl = `https://healthcare.googleapis.com/v1/projects/${project}/locations/${location}/datasets/${dataset}/dicomStores/${dicomStore}/dicomWeb`;
         return {
           ...dicomWebConfig,
           wadoRoot: pathUrl,
           qidoRoot: pathUrl,
           wadoUri: pathUrl,
           wadoUriRoot: pathUrl,
         };
       },
     },
   },
  ```
This configuration would allow the user to build a dicomweb configuration from a GCP healthcare api path e.g. http://localhost:3000/projects/your-gcp-project/locations/us-central1/datasets/your-dataset/dicomStores/your-dicom-store/study/1.3.6.1.4.1.1234.5.2.1.1234.1234.123123123123123123123123123123


:::note
You can stack multiple panel components on top of each other by providing an array of panel components in the `rightPanels` or `leftPanels` properties.

For instance we can use

```
rightPanels: [[dicomSeg.panel, tracked.measurements], [dicomSeg.panel, tracked.measurements]]
```

This will result in two panels, one with `dicomSeg.panel` and `tracked.measurements` and the other with `dicomSeg.panel` and `tracked.measurements` stacked on top of each other.

:::

### More on Accept Header Configuration
In the previous section we showed that you can modify the `acceptHeader`
configuration to request specific dicom transfer syntax. By default
we use `acceptHeader: ['multipart/related; type=application/octet-stream; transfer-syntax=*']` for the following
reasons:

- **Ensures Optimal Transfer Syntax**: By allowing the server to select the transfer syntax,
  the client is more likely to receive the image in a syntax that's well-suited for fast transmission
  and rendering. This might be the original syntax the image was stored in or another syntax that the server deems efficient.

- **Avoids Transcoding**: Transcoding (converting from one transfer syntax to another) can be a resource-intensive process.
 Since the OHIF Viewer supports all transfer syntaxes, it is fine to accept any transfer syntax (transfer-syntax=*).
 This allows the server to send the images in their stored syntax, avoiding the need for costly on-the-fly conversions.
 This approach not only saves server resources but also reduces response times by leveraging the viewer's capability to handle various syntaxes directly.

- **Faster Data Transfer**: Compressed transfer syntaxes generally result in smaller file sizes compared
  to uncompressed ones. Smaller files transmit faster over the network, leading to quicker load
  times for the end-user. By accepting any syntax, the client can take advantage of compression when available.

However, if you would like to get compressed data in a specific transfer syntax, you can modify the `acceptHeader` configuration or
`requestTransferSyntaxUID` configuration.

## Environment Variables

We use environment variables at build and dev time to change the Viewer's
behavior. We can update the `HTML_TEMPLATE` to easily change which extensions
are registered, and specify a different `APP_CONFIG` to connect to an
alternative data source (or even specify different default hotkeys).

| Environment Variable | Description                                                                                        | Default             |
| -------------------- | -------------------------------------------------------------------------------------------------- | ------------------- |
| `HTML_TEMPLATE`      | Which [HTML template][html-templates] to use as our web app's entry point. Specific to PWA builds. | `index.html`        |
| `PUBLIC_URL`         | The route relative to the host that the app will be served from. Specific to PWA builds.           | `/`                 |
| `APP_CONFIG`         | Which [configuration file][config-file] to copy to output as `app-config.js`                       | `config/default.js` |
| `PROXY_TARGET`       | When developing, proxy requests that match this pattern to `PROXY_DOMAIN`                          | `undefined`         |
| `PROXY_DOMAIN`       | When developing, proxy requests from `PROXY_TARGET` to `PROXY_DOMAIN`                              | `undefined`         |
| `OHIF_PORT`      | The port to run the webpack server on for PWA builds. | `3000`        |

You can also create a new config file and specify its path relative to the build
output's root by setting the `APP_CONFIG` environment variable. You can set the
value of this environment variable a few different ways:

- ~[Add a temporary environment variable in your shell](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables#adding-temporary-environment-variables-in-your-shell)~
  - Previous `react-scripts` functionality that we need to duplicate with
    `dotenv-webpack`
- ~[Add environment specific variables in `.env` file(s)](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env)~
  - Previous `react-scripts` functionality that we need to duplicate with
    `dotenv-webpack`
- Using the `cross-env` package in a npm script:
  - `"build": "cross-env APP_CONFIG=config/my-config.js react-scripts build"`

After updating the configuration, `yarn run build` to generate updated build
output.

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[dcmjs-org]: https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado
[dicom-web]: https://en.wikipedia.org/wiki/DICOMweb
[storescu]: https://support.dcmtk.org/docs/storescu.html
[webpack-proxy]: https://webpack.js.org/configuration/dev-server/#devserverproxy
[orthanc-docker-compose]: https://github.com/OHIF/Viewers/tree/master/platform/app/.recipes/Nginx-Orthanc
<!-- Archives -->
[dcm4chee]: https://github.com/dcm4che/dcm4chee-arc-light
[dcm4chee-docker]: https://github.com/dcm4che/dcm4chee-arc-light/wiki/Running-on-Docker
[orthanc]: https://www.orthanc-server.com/
[orthanc-docker]: https://book.orthanc-server.com/users/docker.html
[dicomcloud]: https://github.com/DICOMcloud/DICOMcloud
[dicomcloud-install]: https://github.com/DICOMcloud/DICOMcloud#running-the-code
[osirix]: https://www.osirix-viewer.com/
[horos]: https://www.horosproject.org/
[default-config]: https://github.com/OHIF/Viewers/blob/master/platform/app/public/config/default.js
[html-templates]: https://github.com/OHIF/Viewers/tree/master/platform/app/public/html-templates
[config-files]: https://github.com/OHIF/Viewers/tree/master/platform/app/public/config
<!-- prettier-ignore-end -->
