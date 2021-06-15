# Mode: LifeCycle


- [Mode: LifeCycle](#mode-lifecycle)
  - [Overview](#overview)
  - [onModeEnter](#onmodeenter)
  - [onModeExit](#onmodeexit)

## Overview
Currently there are two hooks that are called for modes.

## onModeEnter
This hook gets run after the defined route has been entered by the mode.
This hook can be used to initialize the data, services and appearance of the viewer upon the first render.

For instance, in `longitudinal` mode we are using this hook to initialize the `ToolBarService` and
set the window level/width tool to be active and add buttons to the toolbar.


```js
export default function mode() {
  return {
    id: '',
    displayName: '',
    onModeEnter: ({ servicesManager, extensionManager }) => {
      const { ToolBarService } = servicesManager.services

      const interaction = {
        groupId: 'primary',
        itemId: 'Wwwc',
        interactionType: 'tool',
        commandOptions: undefined,
      }

      ToolBarService.recordInteraction(interaction)

      ToolBarService.init(extensionManager)
      ToolBarService.addButtons(toolbarButtons)
      ToolBarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Capture',
        'Layout',
        'MoreTools',
      ])
    },
    /*
    ...
    */
  }
}
```

## onModeExit
This hook is called when the viewer navigate away from the route in the url. This is the place
for cleaning up data, and services by unsubscribing to the events.


For instance, it can be used to reset the `ToolbarService` which reset the toggled buttons.


```js
export default function mode() {
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
  }
}
```
