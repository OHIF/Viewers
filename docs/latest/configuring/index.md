# Configuration

> This step assumes you have an imaging archive. If you need assistance setting
> one up, check out the [`Data Source` Guide](./data-source.md) or a deployment
> recipe that contains an open Image Archive

- [Overview](#overview)
  - [Configuration Files](#configuration-files)
  - [Environment Variables](#environment-variables)
- [How do I configure my project?](#how-do-i-configure-my-project)

## Overview

### Configuration Files

The configuration for our viewer is in the `<root>platform/viewer/public/config`
directory. Our build process knows which configuration file to use based on the
`APP_CONFIG` environment variable. By default, its value is
[`config/default.js`][default-config]. The majority of the viewer's features,
and registered extension's features, are configured using this file.

**Embedded Use Note:**

Alternatively, when using the `umd` bundle for embedded use cases, these same
values are what you'll pass to `installViewer` method:

`OHIFStandaloneViewer.installViewer(window.config)`

### Environment Variables

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

## How do I configure my project?

The simplest way is to update the existing default config:

_/platform/viewer/public/config/default.js_

```js
window.config = {
  routerBasename: '/',
  servers: {
    dicomWeb: [
      {
        name: 'DCM4CHEE',
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
};
```

The configuration can also be written as a JS Function in case you need to inject dependencies like external services:

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
    servers: {
      dicomWeb: [
        {
          name: 'DCM4CHEE',
          wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
          qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
          wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
          qidoSupportsIncludeField: true,
          imageRendering: 'wadors',
          thumbnailRendering: 'wadors',
        },
      ],
    },
  };
};
```

You can also create a new config file and specify its path relative to the build
output's root by setting the `APP_CONFIG` environment variable. You can set the
value of this environment variable a few different ways:

- ~[Add a temporary environment variable in your shell](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables#adding-temporary-environment-variables-in-your-shell)~
  - Previous `react-scripts` functionality that we need to duplicate with
    `dotenv-webpack`
- ~[Add environment specific variables in `.env` file(s)](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env)~
  - Previous `react-scripts` functionality that we need to duplicate with
    `dotenv-webpack`
- Using the `cross-env` package in an npm script:
  - `"build": "cross-env APP_CONFIG=config/my-config.js react-scripts build"`

After updating the configuration, `yarn run build` to generate updated build
output.

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[default-config]: https://github.com/OHIF/Viewers/blob/master/platform/viewer/public/config/default.js
[html-templates]: https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/html-templates
[config-files]: https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/config
<!-- prettier-ignore-end -->
