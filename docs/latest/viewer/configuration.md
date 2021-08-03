# Viewer: Configuration

We maintain a number of common viewer application configurations at
[`<root>/platform/viewer/public/configs`][config-dir]. How these values are
passed to the viewer depend on how it's deployed, but the two most common paths
are:

- `index.html` looks for `https://your-website.com/app-config.js` OR
- `index.html` passes the values to `OHIF.installViewer()`

```js
window.config = {
  routerBasename: '/',
  /**
   * "White Labeling" is used to change the branding, look, and feel of the OHIF
   * Viewer. These settings, and the color variables that are used by our components,
   * are the easiest way to rebrand the application.
   *
   * More extensive changes are made possible through swapping out the UI library,
   * Viewer project, or extensions.
   */
  whiteLabeling: {
    /* Optional: Should return a React component to be rendered in the "Logo" section of the application's Top Navigation bar */
    createLogoComponentFn: function(React) {
      return React.createElement('a', {
        target: '_self',
        rel: 'noopener noreferrer',
        className: 'header-brand',
        href: '/',
        style: {
          display: 'block',
          textIndent: '-9999px',
          background: 'url(/svg-file-hosted-at-domain-root.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '200px',
        },
      });
    },
  },
  /**
   * Internally, the OHIF Viewer fetches data primarily with the
   * `cornerstoneWADOImageLoader` and the `DICOMWebClient`. If either of these
   * receive a non-200 response, this method allows you to handle that error.
   *
   * Common use cases include:
   * - Showing a notification with the UINotificationService
   * - Redirecting the user
   * - Refreshing an auth token
   *
   * @param {Object} error - JS new Error()
   * @param {XMLHttpRequest} error.request - The XHR request that's onreadystate change triggered this callback
   * @param {string} error.response - The XHR's response property
   * @param {number} error.status - The XHR's status property
   */
  httpErrorHandler: error => {
    const { request: xhr, response, status } = err;
    const { responseType, statusText } = xhr;

    // In local files, status is 0 upon success in Firefox
    if (xhr.readyState === XMLHttpRequest.DONE) {
      console.log(statusText, response, responseType);
    } else {
      console.warn('Likely CORS error');
    }
  },
  extensions: [],
  showStudyList: true,
  filterQueryParam: false,
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
        enableStudyLazyLoad: true,
      },
    ],
  },
  // Supported Keys: https://craig.is/killing/mice
  hotkeys: [
    { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
    { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
    { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Horizontally',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Vertically',
      keys: ['v'],
    },
  ],
  /* Configuration passed to the bundled cornerstone extension
   *
   * The cornerstone extension is currently tightly coupled to the platform.
   * Until we're able to decouple it, this key will serve as a workaround to
   * pass it configuration.
   */
  cornerstoneExtensionConfig: {
    /* Whether to show/hide annotation "handles" */
    hideHandles: true,
  },
};
```

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[config-dir]: https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/config
<!-- prettier-ignore-end -->
