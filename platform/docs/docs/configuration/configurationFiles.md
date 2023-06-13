---
sidebar_position: 1
sidebar_label: Configuration Files
---

# Config files

After following the steps outlined in
[Getting Started](./../development/getting-started.md), you'll notice that the
OHIF Viewer has data for several studies and their images. You didn't add this
data, so where is it coming from?

By default, the viewer is configured to connect to a remote server hosted by the
nice folks over at [dcmjs.org][dcmjs-org]. While convenient for getting started,
the time may come when you want to develop using your own data either locally or
remotely.

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
      friendlyName: 'dcmjs DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
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
      friendlyName: 'dcmjs DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
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
};
```

## Configuration Options

Here are a list of some options available:

- `maxNumberOfWebWorkers`: The maximum number of web workers to use for
  decoding. Defaults to minimum of `navigator.hardwareConcurrency` and
  what is specified by `maxNumberOfWebWorkers`. Some windows machines require smaller values.
- `omitQuotationForMultipartRequest`: Some servers (e.g., .NET) require the `multipart/related` request to be sent without quotation marks. Defaults to `false`. If your server doesn't require this, then setting this flag to `true` might improve performance (by removing the need for preflight requests). Also note that
if auth headers are used, a preflight request is required.
- `maxNumRequests`: The maximum number of requests to allow in parallel. It is an object with keys of `interaction`, `thumbnail`, and `prefetch`. You can specify a specific number for each type.
- `showLoadingIndicator`: (default to true), if set to false, the loading indicator will not be shown when navigating between studies.
- `dangerouslyUseDynamicConfig`: Dynamic config allows user to pass `configUrl` query string. This allows to load config without recompiling application. If the `configUrl` query string is passed, the worklist and modes will load from the referenced json rather than the default .env config. If there is no `configUrl` path provided, the default behaviour is used and there should not be any deviation from current user experience.<br/>
Points to consider while using `dangerouslyUseDynamicConfig`:<br/>
  - User have to enable this feature by setting `dangerouslyUseDynamicConfig.enabled:true`. By default it is `false`.
  - Regex helps to avoid easy exploit. Dafault is `/.*/`. Setup your own regex to choose a specific source of configuration only.
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



<!-- **Embedded Use Note:**

Alternatively, when using the `umd` bundle for embedded use cases, these same
values are what you'll pass to `installViewer` method:

`OHIFStandaloneViewer.installViewer(window.config)` -->

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
[orthanc-docker-compose]: https://github.com/OHIF/Viewers/tree/master/.docker/Nginx-Orthanc
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
