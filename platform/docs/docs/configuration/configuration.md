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

## Run Time Configuration (Config-Point)
There is a library [config-point](https://github.com/OHIF/config-point)
used to allow loading of configuration values dynamically,
that is, at load time rather than being built into the runtime configuration.
A user of OHIF can specify a dynamic configuration by adding one or more theme
parameters, for example:
```
https://ohif.hospital.org/?theme=mgHP&theme=euroKeyboard
```
to load two hypothetical theme settings files mgHP and euroKeyboard to add
mammographic hanging protocols and European keyboard settings.

A site can add such settings by creating custom files in the deployment
directory (which is wherever the deployed OHIF is located.)  For a deployment
running off a straight build of OHIF, this would be:
```
...Viewers/platform/viewer/dist/theme/mgHP.json5
...Viewers/platform/viewer/dist/theme/euroKeyboard.json5
```
A site might build such different themes to support various user preferences
or site differences between users, such as themes to support specific clinics
or differences in user groups such as left on right mammography viewing versus
right on left mammography viewing.

The decision to use the JSON5 parser for this was primarily aimed at allowing
comments in the configuration files, an important consideration for sites
wanting to document their settings.

See [theme-configuration](theme-configuration.md) for more details on the
specific configuration settings which can be applied.

See [config-point-service](../platform/services/config-point-service.md) for
information on how to add your own config-point based extensions to the code.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[config-dir]: https://github.com/OHIF/Viewers/tree/master/platform/viewer/public/config
<!-- prettier-ignore-end -->
