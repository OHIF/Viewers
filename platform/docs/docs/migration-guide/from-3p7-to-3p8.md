---
sidebar_position: 2
sidebar_label: 3.7 -> 3.8
title: Migration Guide from 3.7 to 3.8
summary: Migration guide for upgrading from OHIF 3.7 to 3.8, covering changes to toolbar button definitions, active tool handling, button evaluators, tool listeners, leftPanel/rightPanel naming, URL parameters, UI components, and refactoring of enums.
---

# Migration Guide

There are two main things that need to be taken care of.


## New Toolbar Button definitions

### Update Active Tool Handling
The concept of `activeTool` and its associated getter and setter has been removed. The active tool should now be derived from the toolGroup and the viewport.


**Action Needed**

Remove any code that sets the default tool using `toolbarService.setDefaultTool()` and activates the tool using
`toolbarService.recordInteraction()`. For example, the following code should be removed:

```javascript
let unsubscribe;
toolbarService.setDefaultTool({
  groupId: "WindowLevel",
  itemId: "WindowLevel",
  interactionType: "tool",
  commands: [
    {
      commandName: "setToolActive",
      commandOptions: {
        toolName: "WindowLevel",
      },
      context: "CORNERSTONE",
    },
  ],
});

const activateTool = () => {
  toolbarService.recordInteraction(toolbarService.getDefaultTool());

  unsubscribe();
};

({ unsubscribe } = toolGroupService.subscribe(
  toolGroupService.EVENTS.VIEWPORT_ADDED,
  activateTool
));
```



Instead, focus on defining the buttons and their placement in the toolbar using `toolbarService.addButtons()` and `toolbarService.createButtonSection()`. For example:

```javascript
toolbarService.addButtons([...toolbarButtons, ...moreTools]);
toolbarService.createButtonSection("primary", [
  "MeasurementTools",
  "Zoom",
  "WindowLevel",
  "Pan",
  "Capture",
  "Layout",
  "MPR",
  "Crosshairs",
  "MoreTools",
]);
```


### Update Button Definitions
The concept of button types (toggle, action, tool) has been removed. Buttons are now defined using a simplified object-based definition.

**Action Needed**

Update your button definitions to use the new object-based format and remove the `type` property. Use the `uiType` property for the top-level UI type definition. For example:

```javascript
// Old Implementation
{
  id: 'Capture',
  type: 'ohif.action',
  props: {
    icon: 'tool-capture',
    label: 'Capture',
    type: 'action',
    commands: [
      {
        commandName: 'showDownloadViewportModal',
        commandOptions: {},
        context: 'CORNERSTONE',
      },
    ],
  },
},
```

is now

```javascript
// New Implementation
{
  id: 'Capture',
  uiType: 'ohif.radioGroup',
  props: {
    icon: 'tool-capture',
    label: 'Capture',
    commands: [
      {
        commandName: 'showDownloadViewportModal',
        context: 'CORNERSTONE',
      },
    ],
    evaluate: 'evaluate.action',
  },
},
```

### Add Evaluators to Button Definitions
Introduce the ﻿evaluate property in your button definitions to determine the state of the button based on the app context.

**Action Needed**

Add the appropriate `evaluate` property to each button definition. For example:
   - Use `evaluate.cornerstoneTool` if the button should be highlighted only when it is the active primary tool (left mouse).
	- Use `evaluate.cornerstoneTool.toggle` if the tool is a toggle tool (like reference lines or image overlay).

Refer to the `modes/longitudinal/src/toolbarButtons.ts` file for examples of using the `evaluate` property.

Additional Resources

  - For more information on the new toolbar module and its usage, refer to the [Toolbar documentation](../platform/extensions/modules/toolbar.md).
  - Consult the updated button definitions in `modes/longitudinal/src/toolbarButtons.ts` for examples of the new object-based button definition format and the usage of evaluators.

### Tool listeners

Some tools can be configured to listen to events to trigger, for example

```ts
createButton({
  id: 'ReferenceLines',
  icon: 'tool-referenceLines',
  label: 'Reference Lines',
  tooltip: 'Show Reference Lines',
  commands: 'toggleEnabledDisabledToolbar',
  listeners: {
      [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]:
          ReferenceLinesListeners,
      [ViewportGridService.EVENTS.VIEWPORTS_READY]:
          ReferenceLinesListeners,
  },
  evaluate: 'evaluate.cornerstoneTool.toggle',
  }),
```

If you have a custom viewport component, and you are overriding the ```onElementEnabled``` handler, than ensure to call ```viewportGridService.setViewportIsReady(viewportId, true)``` in your own handler so that eventually the ```VIEWPORTS_READY``` event fires as expected, if you are not modifying the handler, then an existing handler that is automatically passed down via the props will call that for you, it is passed down from ```ViewportGrid.tsx```

```ts
<ViewportComponent
   displaySets={displaySets}
   viewportLabel={viewports.size > 1 ? viewportLabel : ''}
   viewportId={viewportId}
   dataSource={dataSource}
   viewportOptions={viewportOptions}
   displaySetOptions={displaySetOptions}
   needsRerendering={displaySetsNeedsRerendering}
   isHangingProtocolLayout={isHangingProtocolLayout}
   onElementEnabled={() => {
          viewportGridService.setViewportIsReady(viewportId, true);
   }}
/>

```

## Toolbar Service

toolbarService.init is not a function.

**Action Needed**
remove the call to toolbarService.init() from your codebase.



## leftPanelDefaultClosed and rightPanelDefaultClosed

Now they are renamed to `leftPanelClosed` and `rightPanelClosed` respectively.


## StudyInstanceUID in the URL param

Previously there were two params that you could choose: seriesInstanceUID and seriesInstanceUIDs, they have been replaced with seriesInstanceUIDs so even if you would like to filter one series use ``seriesInstanceUIDs`


## UI

### Header
Header in @ohif/ui now needs servicesManager and appConfig as input.


### Panels
Left and right panel lists are no longer injected into the LayoutTemplate, and have been moved to a PanelService where you have to fetch them from.

If you're using the main layout, you're fine. However, if you have a custom layout, you'll need to update it. To get the panels, see the

`extensions/default/src/ViewerLayout/index.tsx`




## Refactoring

- TimingEnum (and I guess all enums exported from OHIF core have now moved from Types to Enums export).
