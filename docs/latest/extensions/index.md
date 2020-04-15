# Extensions

- [Overview](#overview)
- [Concepts](#concepts)
  - [Extension Skeleton](#extension-skeleton)
  - [Registering an Extension](#registering-an-extension)
  - [Lifecylce Hooks](#lifecycle-hooks)
  - [Modules](#modules)
  - [Contexts](#contexts)
- [Consuming Extensions](#consuming-extensions)
  - [Extension Manager](#extensionmanager)
- [Maintained Extensions](#maintained-extensions)

## Overview

We use extensions to help us isolate and package groups of related features.
Extensions provide functionality, ui components, and new behaviors. Ideally,
they're built in a way that allows them to extend entirely different
implementations of the `@ohif/viewer` project.

<div style="text-align: center;">
  <a href="/assets/img/extensions-diagram.png">
    <img src="/assets/img/extensions-diagram.png" alt="Extensions Diagram" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>Diagram showing how extensions are configured and accessed.</i></div>
</div>

The `@ohif/viewer`'s application level configuration gives us the ability to add
and configure extensions. When the application starts, extensions are registered
with the `ExtensionManager`. Different portions of the `@ohif/viewer` project
will use registered extensions to influence application behavior.

Extensions allow us to:

- Wrap and integrate functionality of 3rd party dependencies in a reusable way
- Change how application data is mapped and transformed
- Display a consistent/cohesive UI
- Inject custom components to override built-in components

Practical examples of extensions include:

- A set of segmentation tools that build on top of the `cornerstone` viewport
- Showing ML/AI report summaries for the selected study/series/image
- Support for parsing DICOM structured reports and displaying them in a user
  friendly way
- [See our maintained extensions for more examples of what's possible](#maintained-extensions)

## Concepts

### Extension Skeleton

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
  // Modules
  getCommandsModule() { /* */ },
  getToolbarModule() { /* */ },
  getPanelModule() { /* */ },
  getSopClassHandler() { /* */ },
  getViewportModule() { /* */ },
}
```

### Registering an Extension

There are two different ways to register and configure extensions: At
[runtime](#registering-at-runtime) and at
[build time](#registering-at-build-time).

You can leverage one or both strategies. Which one(s) you choose depend on your
application's requirements. Each [module](#modules) defined by the extension
becomes available to the core application via the `ExtensionManager`.

#### Registering at Runtime

The `@ohif/viewer` uses a [configuration file](../viewer/configuration.md) at
startup. The schema for that file includes an `Extensions` key that supports an
array of extensions to register.

```js
// prettier-ignore
const config = {
  extensions: [
    MyFirstExtension,
    [
      MySecondExtension,
      { /* MySecondExtensions Configuration */ },
    ],
  ];
}
```

#### Registering at Build Time

The `@ohif/viewer` works best when built as a "Progressive Web Application"
(PWA). If you know the extensions your application will need, you can specify
them at "build time" to leverage advantages afforded to us by modern tooling:

- Code Splitting (dynamic imports)
- Tree Shaking
- Dependency deduplication

You can update the list of bundled extensions by:

1. Having your `@ohif/viewer` project depend on the extension
2. Importing and adding it to the list of extensions in the
   `<repo-root>/platform/src/index.js` entrypoint.

### Lifecycle Hooks

Currently, there is only a single lifecycle hook for extensions:
[`preRegistration`](./lifecycle/pre-registration.md)

If an extension defines the [`preRegistration`](./lifecycle/pre-registration.md)
lifecycle hook, it is called before any modules are registered in the
`ExtensionManager`. It's most commonly used to wire up extensions to
[services](./../services/index.md) and [commands](./modules/commands.md), and to
bootstrap 3rd party libraries.

### Modules

Modules are the meat of extensions. They provide "definitions", components, and
filtering/mapping logic that are then made available by various managers and
services.

Each module type has a special purpose, and is consumed by our viewer
differently.

| Type                                              | Description                                                      | Examples                                          |
| ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| [Commands](./modules/commands.md)                 | Adds named commands, scoped to a context, to the CommandsManager | `setToolActive()`, `nextSeries()`                 |
| [Panel](./modules/panel.md)                       | Adds left or right hand side panels                              | `<ThumbnailList />`, `<MeasurementsTable />`      |
| [SOPClassHandler](./modules/sop-class-handler.md) | Determines how retrieved study data is split into "DisplaySets"  | `getDisplaySetFromSeries()`                       |
| [Toolbar](./modules/toolbar.md)                   | Adds buttons or custom components to the toolbar                 | Toolbar button, nested buttons, custom            |
| [Viewport](./modules/viewport.md)                 | Adds a component responsible for rendering a "DisplaySet"        | `<CornerstoneViewport />`, `<DicomPdfViewport />` |

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

## Consuming Extensions

We consume extensions, via the `ExtensionManager`, in our `@ohif/viewer`
project.

```js
const extensionManager = new ExtensionManager({
  commandsManager,
  servicesManager,
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
today, create a GitHub issue!

### `ExtensionManager`

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

- `registerExtension` - Registers a single extension
- `registerExtensions` - Registers an array of extensions
- `modules` - An object containing registered extensions by `MODULE_TYPE`

During registration, lifecycle hooks and modules have access to the extension's
config, the application's config and `ExtensionManager`'s `ServicesManager` and
`CommandsManager` instances.

Our `@ohif/viewer` uses the `modules` member to access registered extensions at
appropriate places in our application.

## Maintained Extensions

A small number of powerful extensions for popular use cases are maintained by
OHIF. They're co-located in the [`OHIF/Viewers`][viewers-repo] repository, in
the top level [`extensions/`][ext-source] directory.

{% include "./_maintained-extensions-table.md" %}

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[viewers-repo]: https://github.com/OHIF/Viewers
[ext-source]: https://github.com/OHIF/Viewers/tree/master/extensions
[module-types]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/extensions/MODULE_TYPES.js
<!-- prettier-ignore-end -->
