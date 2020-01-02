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
  whiteLabelling: {},
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
