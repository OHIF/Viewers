---
sidebar_position: 3
sidebar_label: Configuration
---

# Viewer: Configuration

The OHIF Viewer Platform strives to be highly configurable and extensible. This
makes it easier for our community members to keep their "secret sauce" private,
and incentives contributions back to the platform. The `@ohif/viewer` project of
the platform is the lynchpin that combines everything to create our application.

There are two configuration mechanisms, one for run-time configuration, allowing
for changes to be decided based on including different configuration files as
specified by the 'theme' URL parameters.  This mechanism is intended for
modifications of data exposed as configurable items by the existing code.  See
sections below on configuring this type of value.

The other mechanism is the code-configuration mechanism that specifies load
time configuration.  This is intended to load things that require code level
changes to OHIF such as adding a new viewer configuration.  This is also used
for base definitions that are shared site-wide such as the data sources.  This
was the original configuration mechanism provided, and some of the configurations
specified there are better suited to the run time loading, but are currently
left alone as there hasn't been time to move them.

We maintain a number of common viewer application configurations at
[`<root>/platform/viewer/public/configs`][config-dir].

You can take a look at how to use different configs in the
[Environment Variables](../platform/environment-variables)

```js title="<root>/platform/viewer/public/configs"
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
    /** ... **/
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
};
```


<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[config-dir]: https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/config
<!-- prettier-ignore-end -->
