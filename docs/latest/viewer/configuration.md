# Viewer: Configuration

We maintain a number of common viewer application configurations at
[`<root>/platform/viewer/public/configs`][config-dir].

You can take a look at how to use different configs in the [Environment Variables](../configuring/index.md#environment-variables)


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
    /** coming soon **/
  },
  httpErrorHandler: {
    /** coming soon **/
  },
  extensions: [],
  showStudyList: true,
  filterQueryParam: false,
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
};
```

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[config-dir]: https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/config
<!-- prettier-ignore-end -->
