---
sidebar_position: 2
sidebar_label: Viewport Action Menu
summary: Migration guide for OHIF 3.11's viewport action menu customization changes, including the transition from individual item configurations to location-based arrays and the removal of index priorities.
---

# Viewport Action Menu Customization

In OHIF 3.11, we've redesigned how viewport action menu customizations are defined to make them more intuitive and organized by location.

## Changes

Previously, viewport action menu customizations were defined with individual item configurations that specified location and priority:

```ts
export default {
  'viewportActionMenu.orientationMenu': {
    enabled: true,
    location: viewportActionCornersService.LOCATIONS.topLeft,
    indexPriority: 1,
  },
  'viewportActionMenu.dataOverlay': {
    enabled: true,
    location: viewportActionCornersService.LOCATIONS.topLeft,
    indexPriority: 2,
  },
  // ...
};
```

Now, viewport action menu customizations are organized by location, with each location having its own customization ID:

```ts
export default {
  'viewportActionMenu.topLeft': [
    {
      id: 'orientationMenu',
      enabled: true,
    },
    {
      id: 'dataOverlay',
      enabled: true,
    },
    {
      id: 'windowLevelActionMenu',
      enabled: true,
    },
  ],
  'viewportActionMenu.topRight': [],
  'viewportActionMenu.bottomLeft': [],
  'viewportActionMenu.bottomRight': [],
};
```

## Migration Steps

1. Reorganize your viewport action menu customizations by using location-based customization IDs (`viewportActionMenu.topLeft`, `viewportActionMenu.topRight`, etc.).
2. For each component, move it into the appropriate location array.
3. Replace the component key with an `id` property that doesn't include the prefix (just use `orientationMenu` instead of `viewportActionMenu.orientationMenu`).
4. Remove the `location` property (since it's now implied by the customization ID).
5. Remove the `indexPriority` property (order in the array now determines display order).
6. For each component, provide a `component` function that returns the component instance.

## Component Rendering

Component rendering logic is now included directly in the item configuration via a `component` function:

```ts
const createOrientationMenu = ({ viewportId, element, location }) => {
  return getViewportOrientationMenu({
    viewportId,
    element,
    location,
  });
};

const createDataOverlay = ({ viewportId, element, displaySets, location }) => {
  return getViewportDataOverlaySettingsMenu({
    viewportId,
    element,
    displaySets,
    location,
  });
};

export default {
  'viewportActionMenu.topLeft': [
    {
      id: 'orientationMenu',
      enabled: true,
      component: createOrientationMenu,
    },
    {
      id: 'dataOverlay',
      enabled: true,
      component: createDataOverlay,
    },
    // other components...
  ],
  // other locations...
};
```
