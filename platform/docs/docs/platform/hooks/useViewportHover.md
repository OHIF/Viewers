---
title: useViewportHover
summary: A React hook that tracks mouse hover state and active status for a specific viewport.
---

# useViewportHover

The `useViewportHover` hook provides information about whether the mouse is currently hovering over a specific viewport and whether that viewport is active.

## Overview

This hook monitors mouse movement to track hover state over a viewport element by its ID. It also checks whether the viewport is currently active (selected) in the viewer. This is useful for implementing conditional UI elements or behaviors that depend on user interaction with viewports.

## Import

```js
import { useViewportHover } from '@ohif/extension-cornerstone';
```

## Usage

```jsx
function ViewportOverlay({ viewportId }) {
  const { isHovered, isActive } = useViewportHover(viewportId);

  return (
    <div className={`overlay ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}>
      {isHovered && !isActive && (
        <button>Click to activate</button>
      )}
      {isActive && (
        <div>Active viewport controls</div>
      )}
    </div>
  );
}
```

## Parameters

- `viewportId` (required): The ID of the viewport to track hover state for

## Returns

An object containing the following properties:

- `isHovered`: Boolean indicating if the mouse is currently hovering over the viewport
- `isActive`: Boolean indicating if the viewport is currently the active viewport in the grid

## Implementation Details

- The hook uses the DOM to find the viewport element by its `data-viewportid` attribute.
- It calculates and maintains the viewport's bounding rectangle to efficiently determine if the mouse is within the viewport's bounds.
- The viewport element's rectangle is updated when the window is resized.
- Global mouse movement is tracked to determine hover state, rather than relying on traditional mouseenter/mouseleave events.
- The hook automatically cleans up event listeners when the component unmounts or the viewport ID changes.
- Active viewport state is derived from the viewport grid state using the `useViewportGrid` hook.
