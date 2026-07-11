---
sidebar_position: 1
sidebar_label: Configuration Files
title: Configuration Files
summary: Comprehensive guide to configuring OHIF Viewer, including data sources, environment variables, advanced options like study prefetching, and detailed explanations of configuration parameters for performance optimization and feature customization.
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
  routerBasename: null,
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
    routerBasename: null,
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
- `customizationService`: An array of customization module references and inline overrides applied at the global scope. This is how deployers enable optional features like the [Appearance & Theming](./ui.md) system and configure UI components without modifying core code. See [Customization Service](../platform/services/customization-service/customizationService.md) for the full syntax reference.
- `disableEditing`:  If true, it disables editing in OHIF, hiding edit buttons in segmentation
  panel and locking already stored measurements.
- `maxNumberOfWebWorkers`: The maximum number of web workers to use for
  decoding. Defaults to minimum of `navigator.hardwareConcurrency` and
  what is specified by `maxNumberOfWebWorkers`. Some windows machines require smaller values.
- `acceptHeader` : accept header to request specific dicom transfer syntax ex : [ 'multipart/related; type=image/jls; q=1', 'multipart/related; type=application/octet-stream; q=0.1' ]
- `investigationalUseDialog`: This should contain an object with `option` value, it can be either `always` which always shows the dialog once per session, `never` which never shows the dialog, or `configure` which shows the dialog once and won't show it again until a set number of days defined by the user, if it's set to configure, you are required to add an additional property `days` which is the number of days to wait before showing the dialog again.
- `groupEnabledModesFirst`: boolean, if set to true, all valid modes for the study get grouped together first, then the rest of the modes. If false, all modes are shown in the order they are defined in the configuration.
- `experimentalStudyBrowserSort`: boolean, if set to true, you will get the experimental StudyBrowserSort component in the UI, which displays a list of sort functions that the displaySets can be sorted by, the sort reflects in all part of the app including the thumbnail/study panel. These sort functions are defined in the customizationModule and can be expanded by users.
- `disableConfirmationPrompts`: boolean, if set to true, it skips confirmation prompts for segmentation related prompts.
- `showPatientInfo`: string, if set to 'visible', the patient info header will be shown and its initial state is expanded. If set to 'visibleCollapsed', the patient info header will be shown but it's initial state is collapsed. If set to 'disabled', the patient info header will never be shown, and if set to 'visibleReadOnly', the patient info header will be shown and always expanded.
- `requestTransferSyntaxUID` : Request a specific Transfer syntax from dicom web server ex: 1.2.840.10008.1.2.4.80  (applied only if acceptHeader is not set)
- `omitQuotationForMultipartRequest`: Some servers (e.g., .NET) require the `multipart/related` request to be sent without quotation marks. Defaults to `false`. If your server doesn't require this, then setting this flag to `true` might improve performance (by removing the need for preflight requests). Also note that
if auth headers are used, a preflight request is required.
- `maxNumRequests`: The maximum number of requests to allow in parallel. It is an object with keys of `interaction`, `thumbnail`, and `prefetch`. You can specify a specific number for each type. For `thumbnail`, a small pool (around `5`) is recommended: the study list preview panel fetches a thumbnail per series in parallel, and a larger pool yields little throughput benefit while risking server overload and contention with `interaction`/`prefetch` requests.
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
- `showStudyList`: (default to false), if set to false, the OHIF search (or work list) page will not be shown nor will there be a back button (chevron) in the viewer to navigate to it
- `useNorm16Texture`: (default to false), if set to true, it will use 16 bit data type for the image data wherever possible which has
  significant impact on reducing the memory usage. However, the 16Bit textures require EXT_texture_norm16 extension in webGL 2.0 (you can check if you have it here https://webglreport.com/?v=2). In addition to the extension, there are reported problems for Intel Macs that might cause the viewer to crash. In summary, it is great a configuration if you have support for it.
- `useSharedArrayBuffer` (default to 'TRUE', options: 'AUTO', 'FALSE', 'TRUE', note that these are strings), for volume loading we use sharedArrayBuffer to be able to
  load the volume progressively as the data arrives (each webworker has the shared buffer and can write to it). However, there might be certain environments that do not support sharedArrayBuffer. In that case, you can set this flag to false and the viewer will use the regular arrayBuffer which might be slower for large volume loading.
- `supportsWildcard`: (default to false), if set to true, the datasource will support wildcard matching for patient name and patient id.
- `allowMultiSelectExport`: (default to false), if set to true, the user will be able to select the datasource to export the report to.
- `activateViewportBeforeInteraction`: (default to true), if set to false, tools can be used directly without the need to click and activate the viewport.
- `autoPlayCine`: (default to false), if set to true, data sets with the DICOM frame time tag (i.e. (0018,1063)) will auto play when displayed
- `addWindowLevelActionMenu`: (default to true), if set to false, the window level action menu item is NOT added to the viewport action corners
- `showErrorDetails`: determines which runtime environments can display exception and error details caught at the `ErrorBoundary`; acceptable values include: `always`, `dev`, and `production`
- `runtimeExtensionOrigins`: (default `[]`) array of origins allowed to serve runtime-loaded extension/mode code referenced by URL in `extensions`/`modes` (e.g. `['https://cdn.example.com']`). Same-origin URLs and relative paths are always allowed. Any other origin is refused unless listed here.
- `dangerouslyUseDynamicConfig`: Dynamic config allows user to pass `configUrl` query string. This allows to load config without recompiling application. If the `configUrl` query string is passed, the worklist and modes will load from the referenced json rather than the default .env config. If there is no `configUrl` path provided, the default behaviour is used and there should not be any deviation from current user experience.<br/>
Points to consider while using `dangerouslyUseDynamicConfig`:<br/>
  - User have to enable this feature by setting `dangerouslyUseDynamicConfig.enabled:true`. By default it is `false`.
  - `regex` is **required** when `enabled: true`. There is no default: if `regex` is omitted, OHIF refuses to load any `configUrl`, logs a console error, and starts with the built-in configuration. Set a regex that pins the exact configuration sources you trust. To knowingly accept any URL (strongly discouraged), set `regex: /.*/` explicitly.
  - System administrators can return `cross-origin: same-origin` with OHIF files to disallow any loading from other origin. It will block read access to resources loaded from a different origin to avoid potential attack vector.
  - Example config:
    ```js
    dangerouslyUseDynamicConfig: {
      enabled: true,
      regex: /^https:\/\/config\.your-hospital\.org\//
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

### Study Prefetcher

You can enable the study prefetcher so that OHIF loads the next/previous series/display sets
based on the proximity to the current series/display set. This can be useful to improve the user experience


```js
  studyPrefetcher: {
    /* Enable/disable study prefetching service (default: false) */
    enabled: true,
    /* Number of displaysets to be prefetched  (default: 2)*/
    displaySetsCount: 2,
    /**
     * Max number of concurrent prefetch requests (default: 10)
     * High numbers may impact on the time to load a new dropped series because
     * the browser will be busy with all prefetching requests. As soon as the
     * prefetch requests get fulfilled the new ones from the new dropped series
     * are sent to the server.
     *
     * TODO: abort all prefetch requests when a new series is loaded on a viewport.
     * (need to add support for `AbortController` on Cornerstone)
     * */
    maxNumPrefetchRequests: 10,
    /* Display sets loading order (closest (deafult), downward or upward) */
    order: 'closest',
  },

```

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

### Data Source: stackRetrieveOptions
At the data source configuration level, you can set `stackRetrieveOptions` to customize Cornerstone stack image retrieval. Merged with defaults; only specify overrides. For example, set `streaming: false` when the data source returns uncompressed DICOM (e.g. `application/octet-stream` only) to avoid black image on load:

```js
configuration: {
  acceptHeader: ['application/octet-stream'],
  stackRetrieveOptions: {
    retrieveOptions: { single: { streaming: false } },
  },
}
```

## Runtime Extensions and Modes (Track B)

:::note Normative reference
This section is the normative reference for the runtime extension descriptor
and the `runtimeExtensionOrigins` allowlist. Other pages (the Runtime
Extensions page, deployment docs, plugin author guides) link here; if wording
differs, this section wins.
:::

Besides bundled (build-time) plugins declared in `pluginConfig.json`, the
viewer can load prebuilt extension and mode bundles at runtime — no viewer
rebuild. Entries in `window.config.extensions` and `window.config.modes` may
be **descriptor objects** instead of plain strings:

```js title="app-config.js"
window.config = {
  // ...
  runtimeExtensionOrigins: ['https://plugins.example.com'],
  extensions: [
    // Same-origin UMD bundle (UMD builds MUST set globalName):
    {
      packageName: '@acme/ohif-extension-ai',
      importPath: '/plugins/acme-ai/index.umd.js',
      globalName: '@acme/ohif-extension-ai',
      coreVersionRange: '^3.13.0',
      styles: ['/plugins/acme-ai/index.css'],
    },
    // Cross-origin ESM bundle (globalName omitted; integrity REQUIRED):
    {
      packageName: '@acme/ohif-extension-cloud',
      importPath: 'https://plugins.example.com/cloud/index.mjs',
      integrity: 'sha384-...',
    },
  ],
};
```

A bundled mode may list a runtime-loaded extension's `packageName` in its
`extensionDependencies`; the dependency is resolved through the runtime
loader's cache.

### Descriptor fields

| Field              | Required           | Description                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packageName`      | yes                | MUST equal the extension/mode `id` exported by the package. The loader refuses modules whose id differs.                                                                                                                                                                                                                        |
| `importPath`       | yes                | Where to fetch the bundle: an absolute `http(s)` URL, a `/rooted` path, or a path relative to `PUBLIC_URL`.                                                                                                                                                                                                                     |
| `globalName`       | UMD bundles only   | Strict format discriminator — see below. UMD builds MUST set it (normally equal to `packageName`, matching the bundle's `output.library` name); ESM builds MUST omit it.                                                                                                                                                        |
| `coreVersionRange` | no                 | semver range checked against the host version (the build's `version.txt` value, exposed as `VERSION_NUMBER`), prereleases included. Fail-closed: if the host version does not satisfy the range, the load is refused with status `version-mismatch` BEFORE any network import. Note `version.txt` can lag `package.json`; target the value shown as `hostVersion` in the audit records. |
| `integrity`        | cross-origin loads | `sha256-`, `sha384-`, or `sha512-` prefix plus the base64 digest of the bundle. REQUIRED when `importPath` resolves to a different origin; same-origin loads skip integrity verification.                                                                                                                                        |
| `styles`           | no                 | Stylesheet URLs appended to the document head as `link rel="stylesheet"` tags. Resolved and origin-checked with the same rules as `importPath`.                                                                                                                                                                                  |

### globalName is a strict format discriminator

The presence or absence of `globalName` tells the loader how the bundle was
built. There is **no fallback chain** and the loader never defaults
`globalName` to `packageName`:

- `globalName` **present** = UMD: after the script evaluates, the loader
  returns `window[globalName]` — nothing else. If that global is undefined,
  the load fails with `import-error`.
- `globalName` **absent** = ESM: the loader dynamically imports the module and
  returns the namespace's `default` export — never a window global. A missing
  default export fails with `import-error`.

The audit record's `format` field (`'umd'` or `'esm'`) derives from this
discriminator.

### Origin allowlist: runtimeExtensionOrigins

Runtime plugin code (and stylesheets) may only be served from allowlisted
origins. The allowlist is **deny-by-default**:

- The viewer's own origin is always implicitly allowed.
- Every other origin must be listed in
  `window.config.runtimeExtensionOrigins` (an array of origin strings, e.g.
  `['https://plugins.example.com']`). Ports are part of the origin. Full-URL
  entries allowlist that URL's origin; malformed entries are skipped, never
  fatal.
- Non-allowlisted origins are refused with status `refused-origin` before any
  code is fetched.

Function-style app configs are supported: at init the viewer stashes
`appConfig.runtimeExtensionOrigins` onto
`window.__ohif.runtimeExtensionOrigins`, which takes precedence over
`window.config.runtimeExtensionOrigins` when both exist.

### Audit surface: `window.__ohif.runtimeExtensions`

Every runtime load attempt — success AND failure — appends a record to
`window.__ohif.runtimeExtensions`:

```js
{
  packageName: '@acme/ohif-extension-ai',
  importPath: '/plugins/acme-ai/index.umd.js',
  resolvedUrl: 'https://viewer.example.com/plugins/acme-ai/index.umd.js',
  status: 'loaded',        // see the status enum below
  hostVersion: '3.13.0-beta.116',   // the host build's version.txt value
  requiredRange: '^3.13.0',         // the descriptor's coreVersionRange
  format: 'umd',           // derived from the globalName discriminator
  error: undefined,        // failure message when status is not 'loaded'
  durationMs: 142,
  timestamp: '2026-07-11T00:00:00.000Z',
}
```

`status` is one of `'loaded'`, `'refused-origin'`, `'integrity-failed'`,
`'version-mismatch'`, `'import-error'`, `'registration-error'`. Records carry
both the host version and the descriptor's required range so version skew is
diagnosable from the console. Failures additionally surface one error toast
each once the UI mounts (toasts are suppressed in test environments — assert
on the audit array instead).

### CSP and CORS requirements

The deployment docs describe an optional `CSP_HEADER` for the official
Docker/nginx image with this baseline value:

```
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'
```

Two caveats for runtime plugins:

1. **Cross-origin loads need `blob:`.** Cross-origin integrity loads execute
   through a `blob:` URL (the loader fetches the bundle, verifies the digest,
   then imports a blob URL), so a deployment CSP needs `script-src blob:` —
   the baseline above does not include it. The plugin's origin must also send
   CORS headers (the integrity fetch uses `mode: 'cors'`). Same-origin plugins
   work without either.
2. **Interim `'unsafe-inline'` note.** As written, the baseline's
   `script-src 'self' 'wasm-unsafe-eval'` also blocks the viewer's own two
   inline bootstrap scripts in `index.html` (the `window.PUBLIC_URL` bootstrap
   and `browserImportFunction`), so the app itself cannot boot under it. Until
   the automated inline-script-hash handshake ships, deployments enabling
   `CSP_HEADER` must interim-add `'unsafe-inline'` to `script-src` (or add the
   per-deployment `sha256-...` hashes of those two inline scripts — the hashes
   vary with `PUBLIC_URL`).

### Shared host packages

The host assigns its singleton copies of 12 packages to `window`, keyed by
full package name; runtime plugin builds externalize them instead of bundling
their own copies: `react`, `react-dom`, `react/jsx-runtime`, `@ohif/core`,
`@ohif/ui-next`, `@ohif/i18n`, `@ohif/extension-default`,
`@ohif/extension-cornerstone`, `@cornerstonejs/core`, `@cornerstonejs/tools`,
`dcmjs`, `gl-matrix`. `@ohif/ui` is NOT shared: it is legacy and a forbidden
import for runtime plugins (use `@ohif/ui-next`).

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
| `OHIF_PORT`          | The port to run the webpack server on for PWA builds.                                              | `3000`              |

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
