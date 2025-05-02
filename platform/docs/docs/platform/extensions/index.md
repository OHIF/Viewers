---
sidebar_position: 1
sidebar_label: Introduction
title: OHIF Extensions Introduction
summary: Comprehensive introduction to the OHIF viewer extension system, explaining how extensions provide modular functionality through different module types, and how they're configured and accessed in modes to build customized viewer experiences.
---

# Introduction

We have re-designed the architecture of the `OHIF-v3` to enable building
applications that are easily extensible to various use cases (modes) that behind
the scene would utilize desired functionalities (extensions) to reach the goal
of the use case.

Previously, extensions were “additive” and could not easily be mixed and matched
within the same viewer for different use cases. Previous `OHIF-v2` architecture
meant that any minor extension alteration usually would require the user to hard
fork. E.g. removing some tools from the toolbar of the cornerstone
extension meant you had to hard fork it, which was frustrating if the
implementation was otherwise the same as master.

> - Developers should make packages of _reusable_ functionality as extensions,
>   and can consume publicly available extensions.
> - Any conceivable radiological workflow or viewer setup will be able to be
>   built with the platform through _modes_.

Practical examples of extensions include:

- A set of segmentation tools that build on top of the `cornerstone` viewport
- A set of rendering functionalities to volume render the data
- [See our maintained extensions for more examples of what's possible](#maintained-extensions)

**Diagram showing how extensions are configured and accessed.**

<!--
<div style="text-align: center;">
  <a href="/assets/img/extensions-diagram.png">
    <img src="/assets/img/extensions-diagram.png" alt="Extensions Diagram" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>Diagram showing how extensions are configured and accessed.</i></div>
</div> -->

## Extension Skeleton

An extension is a plain JavaScript object that has `id` and `version` properties, and one or
more [modules](#modules) and/or [lifecycle hooks](#lifecycle-hooks).

```js
// prettier-ignore
export default {
  /**
   * Required properties. Should be a unique value across all extensions.
   */
  id,

  // Lifecycle
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
  getUtilityModule() { /* */ },
}
```

## OHIF-Maintained Extensions

A small number of powerful extensions for popular use cases are maintained by
OHIF. They're co-located in the [`OHIF/Viewers`][viewers-repo] repository, in
the top level [`extensions/`][ext-source] directory.

<table>
    <thead>
        <tr>
            <th>Extension</th>
            <th>Description</th>
            <th>Modules</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <a href="">
                    default
                </a>
            </td>
            <td>
                Default extension provides default viewer layout, a study/series
                browser, and a datasource that maps to a DICOMWeb compliant backend
            </td>
            <td>commandsModule, ContextModule, DataSourceModule, HangingProtocolModule, LayoutTemplateModule, PanelModule, SOPClassHandlerModule, ToolbarModule</td>
        </tr>
        <tr>
            <td>
                <a href="">
                    cornerstone
                </a>
            </td>
            <td>
                Provides 2d and 3d rendering functionalities
            </td>
            <td>ViewportModule, CommandsModule, UtilityModule</td>
        </tr>
        <tr>
            <td>
                <a href="">dicom-pdf</a>
            </td>
            <td>
                Renders PDFs for a <a href="https://github.com/OHIF/Viewers/blob/master/extensions/dicom-pdf/src/OHIFDicomPDFSopClassHandler.js#L4-L6">specific SopClassUID</a>.
            </td>
            <td>Viewport, SopClassHandler</td>
        </tr>
        <tr>
            <td>
                <a href="">dicom-video</a>
            </td>
            <td>
                Renders DICOM Video files.
            </td>
            <td>Viewport, SopClassHandler</td>
        </tr>
        <tr>
            <td>
                <a href="">cornerstone-dicom-sr</a>
            </td>
            <td>
                Maintained extensions for cornerstone and visualization of DICOM Structured Reports
            </td>
           <td>ViewportModule, CommandsModule, SOPClassHandlerModule</td>
        </tr>
        <tr>
            <td>
                <a href="">measurement-tracking</a>
            </td>
            <td>
                Tracking measurements in the measurement panel
            </td>
            <td> ContextModule,PanelModule,ViewportModule,CommandsModule</td>
        </tr>
    </tbody>
</table>

## Registering of Extensions

`viewer` starts by registering all the extensions specified inside the
`pluginConfig.json`, by default we register all extensions in the repo.


```js title=platform/app/pluginConfig.json
// Simplified version of the `pluginConfig.json` file
{
  "extensions": [
    {
      "packageName": "@ohif/extension-cornerstone",
      "version": "3.4.0"
    },
    {
      "packageName": "@ohif/extension-measurement-tracking",
      "version": "3.4.0"
    },
    // ...
  ],
  "modes": [
    {
      "packageName": "@ohif/mode-longitudinal",
      "version": "3.4.0"
    }
  ]
}
```

:::note Important
You SHOULD NOT directly register extensions in the `pluginConfig.json` file.
Use the provided `cli` to add/remove/install/uninstall extensions. Read more [here](../../development/ohif-cli.md)
:::

The final registration and import of the extensions happen inside a non-tracked file `pluginImport.js` (this file is also for internal use only).

After an extension gets registered within the `viewer`,
each [module](#modules) defined by the extension becomes available to the modes
via the `ExtensionManager` by requesting it via its id.
[Read more about Extension Manager](#extension-manager)

## Lifecycle Hooks

Currently, there are three lifecycle hook for extensions:

[`preRegistration`](./lifecycle/#preRegistration) This hook is called once on
initialization of the entire viewer application, used to initialize the
extensions state, and consume user defined extension configuration. If an
extension defines the [`preRegistration`](./lifecycle/#preRegistration)
lifecycle hook, it is called before any modules are registered in the
`ExtensionManager`. It's most commonly used to wire up extensions to
[services](./../services/index.md) and [commands](./modules/commands.md), and to
bootstrap 3rd party libraries.

[`onModeEnter`](./lifecycle#onModeEnter): This hook is called whenever a new
mode is entered, or a mode’s data or datasource is switched. This hook can be
used to initialize data.

[`onModeExit`](./lifecycle#onModeExit): Similarly to onModeEnter, this hook is
called when navigating away from a mode, or before a mode’s data or datasource
is changed. This can be used to cache data for reuse later, but since it
isn't known which mode will be entered next, the state after exiting should be
clean, that is, the same as the state on a clean start.  This is called BEFORE
service clean up, and after mode specific onModeExit handling.

## Modules

Modules are the meat of extensions, the `blocks` that we have been talking about
a lot. They provide "definitions", components, and filtering/mapping logic that
are then made available to modes and services.

Each module type has a special purpose, and is consumed by our viewer
differently.

<table>
  <thead>
    <tr>
      <th align="left" width="30%">
        Types
      </th>
      <th align="left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="left">
        <a href="./modules/layout-template">
          LayoutTemplate
        </a>
      </td>
      <td align="left">Control Layout of a route</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/data-source">
          DataSource
        </a>
      </td>
      <td align="left">Control the mapping from DICOM metadata to OHIF-metadata</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/sop-class-handler">
          SOPClassHandler
        </a>
      </td>
      <td align="left">Determines how retrieved study data is split into "DisplaySets"</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/panel">
          Panel
        </a>
      </td>
      <td align="left">Adds left or right hand side panels</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/viewport">
          Viewport
        </a>
      </td>
      <td align="left">Adds a component responsible for rendering a "DisplaySet"</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/commands">
          Commands
        </a>
      </td>
      <td align="left">Adds named commands, scoped to a context, to the CommandsManager</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/toolbar">
          Toolbar
        </a>
      </td>
      <td align="left">Adds buttons or custom components to the toolbar</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/contextModule">
          Context
        </a>
      </td>
      <td align="left">Shared state for a workflow or set of extension module definitions</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/hpModule">
          HangingProtocol
        </a>
      </td>
      <td align="left">Adds hanging protocol rules</td>
    </tr>
    <tr>
      <td align="left">
        <a href="./modules/hpModule">
          Utility
        </a>
      </td>
      <td align="left">Expose utility functions to the outside of extensions</td>
    </tr>
  </tbody>
</table>

<span style={{"textAlign": 'center', 'fontStyle': 'italic'}}>Tbl. Module types
with abridged descriptions and examples. Each module links to a dedicated
documentation page.</span>

### Contexts

The `@ohif/app` tracks "active contexts" that extensions can use to scope
their functionality. Some example contexts being:

- Route: `ROUTE:VIEWER`, `ROUTE:STUDY_LIST`
- Active Viewport: `ACTIVE_VIEWPORT:CORNERSTONE`, `ACTIVE_VIEWPORT:VTK`

An extension module can use these to say "Only show this Toolbar Button if the
active viewport is a Cornerstone viewport." This helps us use the appropriate UI
and behaviors depending on the current contexts.

For example, if we have hotkey that "rotates the active viewport", each Viewport
module that supports this behavior can add a command with the same name, scoped
to the appropriate context. When the `command` is fired, the "active contexts"
are used to determine the appropriate implementation of the rotation behavior.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[viewers-repo]: https://github.com/OHIF/Viewers
[ext-source]: https://github.com/OHIF/Viewers/tree/master/extensions
[module-types]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/extensions/MODULE_TYPES.js
<!-- prettier-ignore-end -->
