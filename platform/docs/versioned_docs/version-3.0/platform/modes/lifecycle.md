---
sidebar_position: 2
sidebar_label: Lifecycle Hooks
---

# Modes: Lifecycle Hooks

## Overview

Currently, there are two hooks that are called for modes:

- onModeEnter
- onModeExit

## onModeEnter

This hook gets run after the defined route has been entered by the mode. This
hook can be used to initialize the data, services and appearance of the viewer
upon the first render.

For instance, in `longitudinal` mode we are using this hook to initialize the
`ToolBarService` and set the window level/width tool to be active and add
buttons to the toolbar.

```js
function modeFactory() {
  return {
    id: '',
    version: '',
    displayName: '',
    onModeEnter: ({ servicesManager, extensionManager }) => {
      const { ToolBarService } = servicesManager.services;

      const interaction = {
        groupId: 'primary',
        itemId: 'WindowLevel',
        interactionType: 'tool',
        commandOptions: undefined,
      };

      ToolBarService.recordInteraction(interaction);

      ToolBarService.init(extensionManager);
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

This hook is called when the viewer navigate away from the route in the url.
This is the place for cleaning up data, and services by unsubscribing to the
events.

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
