# Extensions

- [Overview](#overview)
- [Concepts](#concepts)
  - [Extension Skeleton](#extension-skeleton)
  - [Registering an Extension](#registering-an-extension)
  - [Lifecylce Hooks](#lifecycle-hooks)
  - [Modules](#modules)
  - [Contexts](#contexts)
- [Consuming Extensions](#consuming-extensions)
- [Maintained Extensions](#maintained-extensions)

## Overview

We use extensions to help us isolate and package groups of related features.
Extensions provide functionality, ui components, and new behaviors.

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

An extension is a plain JavaScript object has an `id` property, and one or more
"getModuleFunctions" and/or lifecycle hooks. You can read more about
[lifecycle hooks](#lifecycle-hooks) and [modules](#modules) further down.

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
[runtime](#runtime-extensions) and at [build time](#bundled-extensions).

You can leverage one or both strategies. Which one(s) you choose depend on your
application's requirements. Each [module](#modules) defined by the extension
becomes available to the core application via the `ExtensionManager`.

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

#### Registering at Runtime

The `@ohif/viewer` uses a [configuration file](#) at startup. The schema for
that file includes an `Extensions` key that supports an array of extensions to
register.

#### Registering at Build Time

The `@ohif/viewer` works best when built as a "Progressive Web Application"
(PWA). If you know the extensions your application will need, you can specify
them at "build time" to leverage advantages afforded to us by modern tooling:

- Code Splitting
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

There are a few different module types. Each module type allows us to extend the
viewer in a different way, and provides a consistent API for us to do so. You
can find a full list of the different types of modules
[`in ohif-core`][module-types]. Information on each type of module, it's API,
and how we determine when/where it should be used is included below.

### Contexts

...

## Consuming Extensions

...

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
