# Extensions

- [Extensions](#extensions)
  - [Overview](#overview)
  - [Extension Skeleton](#extension-skeleton)
  - [OHIF-Maintained Extensions](#ohif-maintained-extensions)
  - [Registering an Extension](#registering-an-extension)
    - [Registering at Runtime](#registering-at-runtime)
    - [Registering at Build Time](#registering-at-build-time)
  - [Lifecycle Hooks](#lifecycle-hooks)
  - [Modules](#modules)
    - [Contexts](#contexts)
  - [Extension Manager](#extension-manager)
    - [Accessing Modules](#accessing-modules)

## Overview
We have re-designed the architecture of the `OHIF-v3` to enable building applications
that are easily extensible to various use cases (modes) that  behind the scene would utilize desired functionalities (extensions) to reach the goal of the use case.

Previously, extensions were “additive” and could not easily be mixed and matched within the same viewer for different use cases. Previous `OHIF-v2` architecture meant that
any minor extension alteration usually  would require the user to hard fork. E.g. removing some of the tools from the toolbar of the cornerstone extension meant you had to hard fork it, which was frustrating if the implementation was otherwise the same as master.


> - Developers should make packages of *reusable* functionality as extensions, and can consume
> publicly available extensions.
> - Any conceivable radiological workflow or viewer setup will be able to be built with the platform through *modes*.



Practical examples of extensions include:

- A set of segmentation tools that build on top of the `cornerstone` viewport
- A set of rendering functionalities to volume render the data
- [See our maintained extensions for more examples of what's possible](#maintained-extensions)



<mark>Diagram showing how extensions are configured and accessed.
<!--
<div style="text-align: center;">
  <a href="/assets/img/extensions-diagram.png">
    <img src="/assets/img/extensions-diagram.png" alt="Extensions Diagram" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>Diagram showing how extensions are configured and accessed.</i></div>
</div> -->



## Extension Skeleton

An extension is a plain JavaScript object that has an `id` property, and one or
more [modules](#modules) and/or [lifecycle hooks](#lifecycle-hooks).

```js
// prettier-ignore
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'example-extension',

  // Lifecyle
  preRegistration() { /* */ },
  onModeEnter() { /* */ },
  onModeExit() { /* */ },
  // Modules
  getLayoutTemplateModule() { /* */ },
  getDataSourcesModule() { /* */ },
  getSopClassHandlerModule() { /* */ },
  getPanelModule() { /* */ },
  getViewportModule() { /* */ },
  getCommandsModule() { /* */ },
  getContextModule() { /* */ },
  getToolbarModule() { /* */ },
  getHangingProtocolModule() { /* */ },
}
```

## OHIF-Maintained Extensions
A small number of powerful extensions for popular use cases are maintained by
OHIF. They're co-located in the [`OHIF/Viewers`][viewers-repo] repository, in
the top level [`extensions/`][ext-source] directory.

{% include "./_maintained-extensions-table.md" %}


## Registering an Extension

Extensions are building blocks that need to be registered. There are two different ways to register and configure extensions: At
[runtime](#registering-at-runtime) and at
[build time](#registering-at-build-time).
You can leverage one or both strategies. Which one(s) you choose depend on your
application's requirements.

Each [module](#modules) defined by the extension
becomes available to the modes via the `ExtensionManager` by requesting it via
its id. [Read more about Extension Manager](#extension-manager)



### Registering at Runtime

The `@ohif/viewer` uses a [configuration file](../viewer/configuration.md) at
startup. The schema for that file includes an `extensions` key that supports an
array of extensions to register.

```js
import MyFirstExtension from '@ohif/extension-first'
import MySecondExtension from '@ohif/extension-second'

const extensionConfig = {/* extension configuration */}

// prettier-ignore
const config = {
  routerBasename: '/',
  extensions: [
    MyFirstExtension,
    [
      MySecondExtension,
      extensionConfig
    ],
  ],
  modes: [/* modes */],
  showStudyList: true,
  dataSources: [ /* data source config */]
}
```

Then, behind the scene, the runtime-added extensions will get merged with the
default app extensions (note: default app extensions include: `OHIFDefaultExtension`,
   `OHIFCornerstoneExtension`, `OHIFDICOMSRExtension`,
   `OHIFMeasurementTrackingExtension`)

### Registering at Build Time

The `@ohif/viewer` works best when built as a "Progressive Web Application"
(PWA). If you know the extensions your application will need, you can specify
them at "build time" to leverage advantages afforded to us by modern tooling:

- Code Splitting (dynamic imports)
- Tree Shaking
- Dependency deduplication

You can update the list of bundled extensions by:

1. Having your `@ohif/viewer` project depend on the extension
2. Importing and adding it to the list of extensions in the
   `<repo-root>/platform/src/index.js` entrypoint:

  ```js
  import OHIFDefaultExtension from '@ohif/extension-default';
  import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
  import OHIFMeasurementTrackingExtension from '@ohif/extension-measurement-tracking';
  import OHIFDICOMSRExtension from '@ohif/extension-dicom-sr';
  import MyFirstExtension from '@ohif/extension-first'

  /** Combine our appConfiguration and "baked-in" extensions */
  const appProps = {
    config: window ? window.config : {},
    defaultExtensions: [
      OHIFDefaultExtension,
      OHIFCornerstoneExtension,
      OHIFMeasurementTrackingExtension,
      OHIFDICOMSRExtension,
      MyFirstExtension
    ],
  };
  ```

## Lifecycle Hooks

Currently, there are three lifecycle hook for extensions:


[`preRegistration`](./lifecycle/pre-registration.md)
This hook is called once on initialization of the entire viewer application, used to initialize the extensions state, and consume user defined extension configuration. If an extension defines the [`preRegistration`](./lifecycle/pre-registration.md)
lifecycle hook, it is called before any modules are registered in the
`ExtensionManager`. It's most commonly used to wire up extensions to
[services](./../services/index.md) and [commands](./modules/commands.md), and to
bootstrap 3rd party libraries.


[`onModeEnter`](./lifecycle/on-mode-enter.md): This hook is called whenever a new mode is entered, or a mode’s data or datasource is switched. This hook can be used to initialize data.

[`onModeExit`](./lifecycle/on-mode-exit.md): Similarly to onModeEnter, this hook is called when navigating away from a mode, or before a mode’s data or datasource is changed. This can be used to clean up data (e.g. remove annotations that do not need to be persisted)



## Modules
Modules are the meat of extensions, the `blocks` that we have been talking about a lot.
They provide "definitions", components, and filtering/mapping logic that are then made available to modes and services.

Each module type has a special purpose, and is consumed by our viewer
differently.


{% include "./_modules.md" %}


<figure style="text-align: center; font-style: italic;">Tbl. Module types with abridged descriptions and examples. Each module links to a dedicated documentation page.</figure>




### Contexts

The `@ohif/viewer` tracks "active contexts" that extensions can use to scope
their functionality. Some example contexts being:

- Route: `ROUTE:VIEWER`, `ROUTE:STUDY_LIST`
- Active Viewport: `ACTIVE_VIEWPORT:CORNERSTONE`, `ACTIVE_VIEWPORT:VTK`

An extension module can use these to say "Only show this Toolbar Button if the
active viewport is a Cornerstone viewport." This helps us use the appropriate UI
and behaviors depending on the current contexts.

For example, if we have hotkey that "rotates the active viewport", each Viewport
module that supports this behavior can add a command with the same name, scoped
to the appropriate context. When the `command` is fired, the "active contexts"
are used to determine the appropriate implementation of the rotate behavior.


<!-- <mark>do we want the followings?
## Consuming Extensions

We consume extensions, via the `ExtensionManager`, in our `@ohif/viewer`
project.

```js
const extensionManager = new ExtensionManager({
  commandsManager,
  servicesManager,
  hotkeysManager
});

// prettier-ignore
extensionManager.registerExtensions([ /** **/ ]);
```

The `@ohif/viewer` project handles data fetching, basic routing, wires up UI
services, and is the home to the more bespoke application logic that doesn't
make as much sense to make reusable.

Long-term, replacing the `@ohif/viewer` application and consuming extensions
(and the `ExtensionManager`) in your own project is the ideal path for
applications requiring a high degree of customization that can't be achieved
with current theming, configuration, extension, and services support.

If you're not sure how to achieve your goals with the extensibility available
today, create a GitHub issue! -->

## Extension Manager

The `ExtensionManager` is a class made available to us via the `@ohif/core`
project (platform/core). Our application instantiates a single instance of it,
and provides a `ServicesManager` and `CommandsManager` along with the
application's configuration through the appConfig key (optional).

```js
const commandsManager = new CommandsManager();
const servicesManager = new ServicesManager();
const extensionManager = new ExtensionManager({
  commandsManager,
  servicesManager,
  appConfig,
});
```

The `ExtensionManager` only has a few public members:

- `setActiveDataSource` - Sets the active data source for the application
- `getDataSources` - Returns the registered data sources
- `getActiveDataSource` - Returns the currently active data source
- `getModuleEntry` - Returns the module entry by the give id.


### Accessing Modules

We use `getModuleEntry` in our `ViewerLayout` logic to find the panels based on the
provided IDs in the mode's configuration.


For instance: `extensionManager.getModuleEntry("org.ohif.measurement-tracking.panelModule.seriesList")`
accesses the `seriesList` panel from `panelModule` of the `org.ohif.measurement-tracking` extension.


```js
const getPanelData = id => {
  const entry = extensionManager.getModuleEntry(id);
  const content = entry.component;

  return {
    iconName: entry.iconName,
    iconLabel: entry.iconLabel,
    label: entry.label,
    name: entry.name,
    content,
  };
};
```




<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[viewers-repo]: https://github.com/OHIF/Viewers
[ext-source]: https://github.com/OHIF/Viewers/tree/master/extensions
[module-types]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/extensions/MODULE_TYPES.js
<!-- prettier-ignore-end -->
