---
sidebar_position: 3
sidebar_label: Configuration
---

# Viewer: Configuration

The OHIF Viewer Platform strives to be highly configurable and extensible. This
makes it easier for our community members to keep their "secret sauce" private,
and incentives contributions back to the platform. The `@ohif/viewer` project of
the platform is the lynchpin that combines everything to create our application.

There are two configuration mechanisms, one for load-time configuration, allowing
for changes to be decided based on including different configuration files as
specified by the 'theme' URL parameters.  This mechanism is intended for
modifications of data exposed as configurable items by the existing code.  See
sections below on configuring this type of value.

The other mechanism is the code-configuration mechanism that specifies compile
time configuration.  This is intended to add new code for things that require code level
changes to OHIF such as adding a new viewer mode or new viewer functionality.
This is also used for base definitions that are shared site-wide such as the data sources.
This was the original configuration mechanism provided, and some of the configurations
specified there are better suited to the run time loading, but are currently
left alone as there hasn't been time to move them.

It is possible to specify which of the compile time configuration objects get
loaded, by specifying the extensions to use, but the configuration itself is still
defined a compile time, as the extension needs to compile against the OHIF
distribution.

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
   * TODO: Move this to load time configuration
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

## Load time or Compile time Configuration
To decide whether you want to create a load or a compile time configuration,
you need to examine whether your configuration requires adding modes or extensions,
and whether you want your configuration to itself be configurable.  Adding
a new extension requires writing new code, so it must be a compile time configuration.
Currently, the modes perform direct inclusion of the extensions they want to use,
and are thus only applicable to compile time configuration, as the extensions to be
used need to be included in the build of the overall application.

For configurations which allow further configuration, it is possible to write
these directly as load time configurations, but it is recommended to define
these as extensions themselves as that provides better documentation on how
to extend the configurations, and config-point provides convenience methods to
hide some of the obscure syntax for how to define configuration that can be
further extended.

The types of configurations that should be run time are things like site
settings that modify existing configurations without defining new ones entirely.
For example, the ordering and choice of the viewport overlay is a good area for
runtime configuration.  Enabling or disabling certain tools or re-organizing the
menu layout is another good area for runtime configuration.  Some configurations
are currently hard coded, and so require modifying the component to change them.
If the configuration of this is something that likely has several possible
configurations for different sites, then the recommended change is to move
the configuration into a separate configuration file, and then register that
configuration with config-point.
An example of this can be seen in the `viewportOverlayConfig.js`
file.  The basic overlay is a static definition, which can then at run time
be enhanced.

## Load Time Configuration (Config-Point)
There is a library [config-point](https://github.com/OHIF/config-point)
used to allow loading of configuration values dynamically,
that is, at load time rather than being built into the compiled application.
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
