---
sidebar_position: 2
sidebar_label: Lifecycle Hooks
---

# Modes: Lifecycle Hooks

## Overview

Currently, there are two hooks that are called for modes:

- onModeInit
- onModeEnter
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
