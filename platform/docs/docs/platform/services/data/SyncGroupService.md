---
sidebar_position: 8
sidebar_label: SyncGroup Service
---

# Sync Group Service

## Overview

The `SyncGroupService` is responsible for managing synchronization groups in the OHIF Viewer. Synchronization groups allow multiple viewports to be synchronized based on various criteria, such as camera position, window level, zoom/pan, and image slice position. This service provides a centralized way to create, update, and manage synchronization groups.

Right now, synchronization groups can be defined in the hanging protocols or manually assigning buttons.




## API

- `getSyncCreatorForType(type)`: Returns the synchronizer creator function for the specified type.
- `addSynchronizerType(type, creator)`: Adds a new synchronizer type with a custom creator function.
- `getSynchronizer(id)`: Retrieves a synchronizer by its ID.
- `getSynchronizersOfType(type)`: Retrieves an array of synchronizers of the specified type.
- `addViewportToSyncGroup(viewportId, renderingEngineId, syncGroups)`: Adds a viewport to one or more synchronization groups.
- `destroy()`: Destroys all synchronizers.
- `getSynchronizersForViewport(viewportId)`: Retrieves an array of synchronizers associated with the specified viewport.
- `removeViewportFromSyncGroup(viewportId, renderingEngineId, syncGroupId?)`: Removes a viewport from a specific synchronization group or all synchronization groups if no group ID is provided.

## Usage
### Via hanging protocols
You can set up different types of synchronization groups for your viewports. For example, in the TMTV hanging protocol (`extensions/tmtv/src/getHangingProtocolModule.js`), we can see how different synchronization groups are defined for various viewports:

```javascript
const ptAXIAL = {
  viewportOptions: {
    // ...
    syncGroups: [
      {
        type: 'cameraPosition',
        id: 'axialSync',
        source: true,
        target: true,
      },
      {
        type: 'voi',
        id: 'ptWLSync',
        source: true,
        target: true,
      },
      {
        type: 'voi',
        id: 'ptFusionWLSync',
        source: true,
        target: false,
        options: {
          syncInvertState: false,
        },
      },
    ],
  },
  // ...
};
```



In this example, the `ptAXIAL` viewport is part of three synchronization groups:

1. `cameraPosition` group with the ID `'axialSync'`: This group synchronizes the camera position across viewports that are both source and target.
2. `voi` (Window Level) group with the ID `'ptWLSync'`: This group synchronizes the window level settings across viewports that are both source and target.
3. `voi` group with the ID `'ptFusionWLSync'`: This group synchronizes the window level settings, but the `ptAXIAL` viewport is only a source, not a target.


:::tip
You can control the state of the synchronizer via a toolbar button after you define the synchronization group in the hanging protocol.

```js
{
  id: 'SyncToggle',
  uiType: 'ohif.radioGroup',
  props: {
    icon: 'tool-info',
    label: 'toggle',
    commands: {
      commandName: 'toggleSynchronizer',
      commandOptions: {
        syncId: 'axialSync'
      }
    }
  },
},
```

as you can see by using the `toggleSynchronizer` command you can toggle the state of the synchronizer for the specified syncId.

:::

### Manually through a button
You can create a button on the toolbar that you provice the synchronization group type,
and it applys it to all viewports.

:::note
Currently we don't have a proper way to select viewports to apply the synchronization group to. It is applied to all applicable viewports
:::

For instance look at `imageSliceSync` button in the longitudinal mode (`modes/longitudinal/src/moreTools.ts`) and how it runs a command

```js
ToolbarService.createButton({
  id: 'ImageSliceSync',
  icon: 'link',
  label: 'Image Slice Sync',
  tooltip: 'Enable position synchronization on stack viewports',
  commands: [
    {
      commandName: 'toggleSynchronizer',
      commandOptions: {
        type: 'imageSlice',
      },
    },
  ],
})
```

You can create another button to toggle 'voi' synchronization. Currently we group
viewports by modality and apply the voi synchronization to all viewports of the same modality.

```js
ToolbarService.createButton({
  id: 'VoiSync',
  icon: 'link',
  label: 'VOI Sync',
  tooltip: 'Enable VOI synchronization on viewports',
  commands: [
    {
      commandName: 'toggleSynchronizer',
      commandOptions: {
        type: 'voi',
      },
    },
  ],
})
```

:::tip
For your custom synchronization groups, you can create a new synchronizer type and follow the
same pattern as the existing synchronizers.
:::
