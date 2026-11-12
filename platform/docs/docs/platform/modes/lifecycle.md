---
sidebar_position: 2
sidebar_label: Lifecycle Hooks
title: Mode Lifecycle Hooks
summary: Documentation for OHIF Mode's lifecycle hooks (onModeInit, onModeEnter, onModeExit, and validateModeEntry), which allow customization of initialization, resource setup, validation, and cleanup when entering or exiting viewer modes.
---

# Modes: Lifecycle Hooks

## Overview

The mode route calls these hooks for modes:

- onModeInit
- onModeEnter
- validateModeEntry
- onModeExit

## onModeInit

This hook gets run before the defined route has been entered by the mode. This
hook can be used for initialization before the first render.

This is called before `onModeEnter` calls. This allows modes to add or activate their own
data sources and configuration before entering the mode (pre registrations).

## onModeEnter

This hook gets run after the defined route has been entered by the mode. This
hook can be used to initialize the data, services and appearance of the viewer
upon the first render, in any way that is custom to the mode.

This is called after service `onModeEnter` calls so that the entry into a mode
is done in a predefined/fixed state.  That allows any restoring of existing state
to be performed.

For instance, in `longitudinal` mode we are using this hook to initialize the
`ToolBarService` and set the window level/width tool to be active and add
buttons to the toolbar.

:::note Tip

In OHIF Version 3.1, there is a new service `ToolGroupService` that is used to
define and manage tools for the group of viewports. This is a new concept
borrowed from the Cornerstone ToolGroup, and you can read more
[here](https://www.cornerstonejs.org/docs/concepts/cornerstone-tools/toolgroups/)

:::

```js
function modeFactory() {
  return {
    id: '',
    version: '',
    displayName: '',
    onModeEnter: ({ servicesManager, extensionManager }) => {
      const { ToolBarService, ToolGroupService } = servicesManager.services;

      // Init Default and SR ToolGroups
      initToolGroups(extensionManager, ToolGroupService);

      ToolBarService.addButtons(toolbarButtons);
      ToolBarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Capture',
        'Layout',
        'MoreTools',
      ]);
    },
    /*
    ...
    */
  };
}
```

## validateModeEntry

This hook checks that the mode can run with the data that the URL asks for. The
mode route calls this hook after `onModeInit`, after the `onModeEnter` of the
extensions, after the `onModeEnter` of the mode, and after `route.init`. A mode
that sets a custom authentication token in one of those hooks has set that token
before this hook runs.

The mode route does not wait for this hook. The hook runs at the same time as
the retrieve of the metadata, so the hook adds no delay to the retrieve.

The hook can be an async function. The hook receives `navigate`, and the hook
navigates away on its own when the data is not valid. A `navigate` call after
the user leaves the route does nothing.

The mode route calls this hook with these properties:

| Property | Description |
| --- | --- |
| `studyInstanceUIDs` | The studies that the URL asks for. |
| `dataSource` | The active data source. |
| `navigate` | Navigates to another route. |
| `servicesManager` | The services manager. |
| `extensionManager` | The extension manager. |
| `commandsManager` | The commands manager. |
| `appConfig` | The application configuration. |
| `query` | The URL query parameters. |

A mode that does not declare this hook gets the default hook. The default hook
queries the data source for each StudyInstanceUID in the URL, and the default
hook navigates to `/notfoundstudy` when a study is absent or when the query
fails.

A mode that does not load its data by StudyInstanceUID must declare this hook.
Such a mode either runs its own check, or the mode gives an empty function to
skip the check.

```js
function modeFactory() {
  return {
    id: '',
    displayName: '',
    // This mode loads the data from a URL parameter, and not from a study,
    // so the default study check does not apply.
    validateModeEntry: async ({ query, navigate }) => {
      if (!query.get('datasetId')) {
        navigate('/notfoundstudy');
      }
    },
    /*
    ...
    */
  };
}
```

The retrieve of the metadata starts before this hook completes, and the mode
route does not wait for this hook before the mode route calls
`onSetupRouteComplete`. Put the work that must complete before the viewer
renders in `onModeEnter` instead.

:::note

`validateModeEntry` runs when the user enters the mode. `isValidMode` runs in
the work list, when the work list decides which modes to offer for a study. The
two hooks are separate. See [Validity](./validity.md).

:::

## onModeExit

This hook is called when the viewer navigates away from the route in the url.
It is called BEFORE the service specific onModeExit calls are performed, and
thus still has access to stateful data which can be cached or stored before
the services clean themselves up.
This is the place for cleaning up NON-service specific data, and services
by unsubscribing to the events.  The cleanup of the service itself is intended
to occur in the service `onModeEnter`.

For instance, it can be used to reset the `ToolBarService` which reset the
toggled buttons.

```js
function modeFactory() {
  return {
    id: '',
    displayName: '',
    onModeExit: ({ servicesManager, extensionManager }) => {
      // Turn of the toggled states on exit
      const { ToolBarService } = servicesManager.services;
      ToolBarService.reset();
    },
    /*
    ...
    */
  };
}
```
