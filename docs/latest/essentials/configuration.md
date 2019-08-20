# Configuration

> This step assumes you have an imaging archive. If you need assistance setting
> one up, check out the [`Data Source` Guide](./data-source.md) or a deployment
> recipe that contains an open source Image Archive

## How it Works

The configuration for our project is in the `/public/config` directory. Our
build process knows which configuration file to use based on the `APP_CONFIG`
environment variable. By default, its value is
[`default.js`](https://github.com/OHIF/Viewers/blob/master/platform/viewer/public/config/default.js).
When we build, the `%APP_CONFIG%` value in
our[`/public/index.html`](https://github.com/OHIF/Viewers/blob/master/platform/viewer/public/index.html)
file is substituted for the correct configuration file's name. This sets the
`window.config` equal to our configuration file's value.

## How do I configure my project?

The simplest way is to update the existing default config:

_/public/config/default.js_

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
        requestOptions: {
          requestFromBrowser: true,
        },
      },
    ],
  },
};
```

You can also create a new config file and specify its path relative to the build
output's root by setting the `APP_CONFIG` environment variable. You can set the
value of this environment variable a few different ways:

- [Add a temporary environment variable in your shell](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables#adding-temporary-environment-variables-in-your-shell)
- [Add environment specific variables in `.env` file(s)](https://facebook.github.io/create-react-app/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env)
- Using the `cross-env` package in an npm script:
  - `"build": "cross-env APP_CONFIG=config/my-config.js react-scripts build"`

After updating the configuration, `yarn run build:web` to generate updated build
output.
