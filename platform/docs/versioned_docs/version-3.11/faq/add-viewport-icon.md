---
id: add-viewport-icon
title: How to add a custom icon to the viewport corners
summary: Learn how to add a custom icon or dropdown to one of the viewport corners in OHIF.
---

# How to add a custom icon to the viewport corners

## Question
How can I add a custom icon or dropdown to one of the viewport corners in OHIF?

## Answer
OHIF provides a customizable viewport action menu system that allows you to add icons, buttons, or dropdowns to any of the four corners of a viewport (topLeft, topRight, bottomLeft, bottomRight). This is done through the `customizationService` and the viewport action corners API.

Here's a complete example that shows how to add a mode switch dropdown to the top-left corner of the viewport:

```tsx
import React from 'react';
import { Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  Button,
} from '@ohif/ui-next';

// This is a complete, self-contained component that shows a dropdown menu
// for switching modes when clicked
function getModeSwitchMenu({ viewportId, element, location }) {
  const ModeSwitchMenu = () => {
    const { servicesManager } = useSystem();
    const { router } = servicesManager.services;
    const { viewportActionCornersService } = servicesManager.services;

    const handleModeSwitch = (mode) => {
      const currentStudyInstanceUID = router.query.StudyInstanceUIDs;
      // Navigate to the selected mode with the current study
      router.navigate(`/${mode}?StudyInstanceUIDs=${currentStudyInstanceUID}`);
    };

    // Get proper alignment based on the location
    let align = 'center';
    let side = 'bottom';

    if (location !== undefined) {
      const positioning = viewportActionCornersService.getAlignAndSide(location);
      align = positioning.align;
      side = positioning.side;
    }

    return (
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-highlight"
            >
              <Icons.Tool />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-[160px]"
            align={align}
            side={side}
            sideOffset={5}
          >
            <DropdownMenuLabel className="-ml-1">Mode</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleModeSwitch('longitudinal')}>
              Longitudinal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeSwitch('segmentation')}>
              Segmentation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeSwitch('tmtv')}>
              TMTV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeSwitch('microscopy')}>
              Microscopy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return <ModeSwitchMenu />;
}

// In your mode or extension, add this to the customizations
// This example shows how to add it in the onModeEnter lifecycle hook
function onModeEnter({ servicesManager }) {
  const { customizationService } = servicesManager.services;

  // Add the mode switch icon to the top-left corner of the viewport
  customizationService.setCustomizations({
    'viewportActionMenu.topLeft': {
      // Use $push to add to existing items or $set to replace all items
      $push: [
        {
          id: 'modeSwitch',
          enabled: true,
          component: getModeSwitchMenu,
        },
      ],
    },
  });
}
```

## Key Concepts

1. **Location-based customization**: The viewport is divided into four corners identified by:
   - `viewportActionMenu.topLeft`
   - `viewportActionMenu.topRight`
   - `viewportActionMenu.bottomLeft`
   - `viewportActionMenu.bottomRight`

2. **Component structure**:
   - `id` - A unique identifier for your component
   - `enabled` - Boolean to control if the component should be displayed
   - `component` - A function that returns a React component to render

3. **Component positioning**: The component's position within a corner is determined by its order in the array. Components are rendered in the order they appear.

4. **Dropdown positioning**: Use the `viewportActionCornersService.getAlignAndSide()` method to get the correct alignment for your dropdown menu based on its location.

## Adding Multiple Components

If you want to add multiple components to the same corner or different corners, you can do it in a single customization:

```js
customizationService.setCustomizations({
  'viewportActionMenu.topLeft': {
    $push: [
      {
        id: 'modeSwitch',
        enabled: true,
        component: getModeSwitchMenu,
      },
    ],
  },
  'viewportActionMenu.topRight': {
    $push: [
      {
        id: 'anotherComponent',
        enabled: true,
        component: getAnotherComponent,
      },
    ],
  },
});
```

## Replacing Existing Components

If you want to replace all components in a corner instead of adding to them, use `$set` instead of `$push`:

```js
customizationService.setCustomizations({
  'viewportActionMenu.topLeft': {
    $set: [
      {
        id: 'modeSwitch',
        enabled: true,
        component: getModeSwitchMenu,
      },
      // This will be the only components in the top-left corner
    ],
  },
});
```

Remember that this customization will affect all viewports in the active mode. If you need different behavior for different viewports, you should check the `viewportId` parameter in your component's logic.
