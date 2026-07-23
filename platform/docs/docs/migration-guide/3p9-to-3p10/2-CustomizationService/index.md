---
sidebar_position: 2
title: Customization Service
summary: Migration guide for OHIF's Customization Service from 3.9 to 3.10, covering unified customization getters, simplified registration, new commands, renamed customizations, and updated patterns for modifying UI components.
---

# CustomizationService



**Key Changes:**


1. **Unified Customization Getter:**
   - The `getCustomization` method now uniformly retrieves customizations, prioritizing `global`, then `mode`, and finally `default` customizations.
   - The `defaultValue` parameter in `getCustomization` is no longer used for setting defaults. It simply returns if no customization is found.
   - The methods `getModeCustomization` and `getGlobalCustomization` are deprecated.

2. **Simplified Customization Registration:**
   - The `customizationType` property in customization definitions is renamed to `inheritsFrom`.
   - The `merge` property in customization definitions is removed. Instead, a customization is merged using the helper methods. The basic update commands are listed in the table below, and you can learn more about the helper methods [here](../../../platform/services/customization-service/customizationService.md).

     | Command  | Description                               | Example                                           |
     | :------- | :---------------------------------------- | :------------------------------------------------ |
     | `$set`   | Replace a value entirely                 | Replace a list or object                        |
     | `$push`  | Append items to an array                 | Add to the end of a list                        |
     | `$unshift` | Prepend items to an array                | Add to the start of a list                      |
     | `$splice` | Insert, remove, or replace at specific index | Modify specific indices in a list                 |
     | `$merge` | Update specific fields in an object      | Change a subset of fields                       |
     | `$apply` | Compute the new value dynamically        | Apply a function to transform values              |
     | `$filter` | Find and update specific items in arrays | Target nested structures based on matching criteria |


3. **New `$transform` command:**
   - If you were using the `transform` command, you should now use the `$transform` command. Just a simple rename to make it more consistent with the other commands.


5. **Renamed `CornerstoneOverlay` customizations:**
   - The `cornerstoneOverlay` customizations (`cornerstoneOverlayTopLeft`, `cornerstoneOverlayTopRight`, `cornerstoneOverlayBottomLeft`, `cornerstoneOverlayBottomRight`) have been renamed to `viewportOverlay.topLeft`, `viewportOverlay.topRight`, `viewportOverlay.bottomLeft`, and `viewportOverlay.bottomRight`. See dedicated page for customizing viewport overlays [here](../../../platform/services/customization-service/viewportOverlay.md).

6. **Renamed `customRoutes`:**
   - The `customRoutes` customization is renamed to `routes.customRoutes`.

7.  **`contextMenu` customization:**
    - The `contextMenu` customization now uses the `inheritsFrom` property to inherit from other context menus, previously it was called `customizationType`

8. **New `immutability-helper` dependency:**
   The `immutability-helper` library is now used for merging customizations. If you encounter an error related to it, you'll need to install it - though OHIF should really handle the installation for you, so this is pretty much just a heads up.

**Migration Steps:**

1. **Replace `getModeCustomization` and `getGlobalCustomization` with `getCustomization`:**

   - **Before:**

     ```javascript
     const tools = customizationService.getModeCustomization(
       'cornerstone.overlayViewportTools'
     )?.tools;
     const globalValue = customizationService.getGlobalCustomization('someGlobalKey');
     ```

   - **After:**

     ```javascript
     const tools = customizationService.getCustomization('cornerstone.overlayViewportTools');
     const globalValue = customizationService.getCustomization('someGlobalKey');
     ```


     :::note
     The returned value is the actual customization value, not an object that needs to be broken down.
     :::

2. **Update Customization Definitions:**
   - We've moved away from using random items in the customization definition, and now we use the `id` property to identify the customization as a value. Previously, it was referred to as `value`, `values`, and so on, but now an `id` is used to reference the customization. This approach really simplifies things - when you need to grab the customization, you can just use the `id` to get it, and you don't have to bother with destructuring the value from the object.




**Example: Customizing a Panel**

**Before (v3.9):**

```javascript
// the default value was hardcoded inside the panel itself - bad idea!
// default was given in the panel itself

// PanelSegmentation.tsx

// Retrieve the onSegmentationAdd customization
const { onSegmentationAdd } = customizationService.getCustomization(
  'PanelSegmentation.onSegmentationAdd',
  {
    id: 'segmentation.onSegmentationAdd',
    onSegmentationAdd: handlers.onSegmentationAdd,
  }
);

// Retrieve the disableEditing customization
const { disableEditing } = customizationService.getCustomization(
  'PanelSegmentation.disableEditing',
  {
    id: 'default.disableEditing',
    disableEditing: false,
  }
);



// mode was customizing it via
customizationService.addModeCustomizations([
  {
    id: 'PanelSegmentation.tableMode',
    mode: 'expanded',
  },
  {
    id: 'PanelSegmentation.showAddSegment',
    showAddSegment: false,
  },
]);

```

**After (v3.10):**

```javascript
// cornerstone extension getCustomizationModule
// centralized customization location for all extensions - good!
function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        'panelSegmentation.disableEditing': false,
        'panelSegmentation.showAddSegment': true,
      },
    },
  ];
}


// inside panelSegmentation.tsx
const disableEditing = customizationService.getCustomization('panelSegmentation.disableEditing');
const showAddSegment = customizationService.getCustomization('panelSegmentation.showAddSegment');


// mode can customize it via $ operators for mode customizations
customizationService.setCustomizations({
  'panelSegmentation.disableEditing': { $set: true },
  'panelSegmentation.showAddSegment': { $set: false },
});


//or via configuration for global customizations
window.config = {
  // rest of config
  customizationService: [
    {
      'panelSegmentation.disableEditing': {
        $set: true, // Disables editing of segmentations in the panel
      },
    },
  ],
  // rest of config
};
```



**Example: Updating a Customization**

Let's say you have a customization in v3.9 that adds a custom overlay item to the top-left corner:

**Before (v3.9):**

```javascript
// In your mode's onModeEnter
customizationService.addModeCustomizations([
  {
    id: 'cornerstoneOverlayTopLeft',
    items: [
      {
        id: 'myCustomOverlay',
        customizationType: 'ohif.overlayItem',
        attribute: 'PatientName',
        label: 'Patient:',
      },
    ],
  },
]);
```

**After (v3.10):**

```javascript
// In your mode's onModeEnter or elsewhere
customizationService.setCustomizations({
  'viewportOverlay.topLeft': {
    $push: [
      {
        id: 'myCustomOverlay',
        inheritsFrom: 'ohif.overlayItem',
        attribute: 'PatientName',
        label: 'Patient:',
      },
    ],
  },
});
```
```
**Example: Customizing viewport action Menu**

**Before (v3.9):**

```javascript
// In your configuration for global customizations
window.config = {
    // rest of config
    addWindowLevelActionMenu: true,
};
```

**After (v3.10):**

```javascript
// you can now handle each action menu item (windowLevelActionMenu and segmentationOverlay) separately

// cornerstone extension getCustomizationModule
function getCustomizationModule() {
    return [
        {
            name: 'default',
            value: {
                'viewportActionMenu.windowLevelActionMenu': {
                    enabled: true,
                    location: viewportActionCornersService.LOCATIONS.topRight,
                },
                'viewportActionMenu.segmentationOverlay': {
                    enabled: true,
                    location: viewportActionCornersService.LOCATIONS.topRight,
                },
            },
        },
    ];
}


// Accessing customizations within your component (e.g., OHIFCornerstoneViewport.tsx)
const windowLevelActionMenu = customizationService.getCustomization('viewportActionMenu.windowLevelActionMenu');
const segmentationOverlay = customizationService.getCustomization('viewportActionMenu.segmentationOverlay');

// Modifying customizations at runtime, for example, in your mode's onModeEnter
customizationService.setCustomizations({
    'viewportActionMenu.windowLevelActionMenu': {
        $set: {
            enabled: false,
            location: viewportActionCornersService.LOCATIONS.bottomLeft,
        },
    },
    'viewportActionMenu.segmentationOverlay': {
        $set: {
            enabled: true,
            location: viewportActionCornersService.LOCATIONS.topLeft,
        },
    },
});

// Alternatively, setting global customizations via configuration
window.config = {
    // rest of config
    customizationService: [
        {
            'viewportActionMenu.windowLevelActionMenu': {
                $set: {
                    enabled: false,
                    location: 1,
                },
            },
            'viewportActionMenu.segmentationOverlay': {
                $set: {
                    enabled: true,
                    location: 1,
                },
            },
        },
    ],
    // rest of config
};
```

**Note:**

- The `customizationType` is replaced with `inheritsFrom`.





## Renaming

To keep our customization system consistent, you should be aware of a few key renaming conventions. We now follow a straightforward naming convention for customizations: `scopeName.customizationItem`.



| Customization Key (Old)                     | Customization Key (New)                      | Description                                                                 |
| :------------------------------------------ | :------------------------------------------- | :-------------------------------------------------------------------------- |
| `PanelMeasurement.disableEditing`             | `panelMeasurement.disableEditing`              | Disables editing measurements in the Measurement Panel and after SR hydration. |
| `PanelSegmentation.CustomDropdownMenuContent` | `panelSegmentation.customDropdownMenuContent`  | Custom content for the dropdown menu in the Segmentation Panel.             |
| `PanelSegmentation.disableEditing`             | `panelSegmentation.disableEditing`              | Disables editing segmentations in the Segmentation Panel.                    |
| `PanelSegmentation.showAddSegment`             | `panelSegmentation.showAddSegment`              | Controls visibility of the "Add Segment" button in the Segmentation Panel.    |
| `PanelSegmentation.onSegmentationAdd`          | `panelSegmentation.onSegmentationAdd`           | Custom function to execute when a new segmentation is added.                 |
| `PanelSegmentation.tableMode`                | `panelSegmentation.tableMode`                 | Controls the table mode (collapsed/expanded) in the Segmentation Panel.       |
| `PanelSegmentation.readableText`             | `panelSegmentation.readableText`              | Custom readable text labels for the Segmentation Panel.                       |
| `PanelStudyBrowser.studyMode`                | `studyBrowser.studyMode`                     | Controls the study mode (all/primary/recent) in the Study Browser Panel.      |
| `customRoutes`                                | `routes.customRoutes`                         | Defines custom routes for the application.                                  |
| `cornerstoneOverlayTopLeft`                   | `viewportOverlay.topLeft`                    | Custom overlay items for the top-left corner of the viewport.                  |
| `cornerstoneOverlayTopRight`                  | `viewportOverlay.topRight`                   | Custom overlay items for the top-right corner of the viewport.                 |
| `cornerstoneOverlayBottomLeft`                | `viewportOverlay.bottomLeft`                 | Custom overlay items for the bottom-left corner of the viewport.              |
| `cornerstoneOverlayBottomRight`               | `viewportOverlay.bottomRight`                | Custom overlay items for the bottom-right corner of the viewport.             |
| (New)                                         | `viewportActionMenu.windowLevelActionMenu`   | Controls the display and the location of the window level action menu in the viewport.      |
| (New)                                         | `viewportActionMenu.segmentationOverlay`     | Controls the display and the location of segmentation overlays in the viewport.      |
