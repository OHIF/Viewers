---
title: useDynamicMaxHeight
summary: A React hook that calculates the maximum height for an element based on its position in the viewport, with automatic recalculation on window resize or data changes.
---

# useDynamicMaxHeight

The `useDynamicMaxHeight` hook calculates the maximum height an element can have based on its position relative to the bottom of the viewport, ensuring it doesn't overflow or get cut off by the viewport edge.

## Overview

This hook is useful for creating responsive UI elements that need to fit within the visible area of the screen without causing scrolling or content overflow. It automatically recalculates the maximum height when the window is resized or when specified data changes, ensuring the element always fits properly.

## Import

```js
import { useDynamicMaxHeight } from '@ohif/ui-next';
```

## Usage

```jsx
function DynamicHeightPanel({ data, children }) {
  const { ref, maxHeight } = useDynamicMaxHeight(data, 30, 200);
  
  return (
    <div 
      ref={ref} 
      style={{ 
        maxHeight, 
        overflow: 'auto',
        border: '1px solid gray'
      }}
    >
      {children}
    </div>
  );
}
```

## Parameters

- `data` (required): Any data that, when changed, should trigger a recalculation of the maximum height. This can be an array, object, or primitive value.
- `buffer` (optional): Additional space (in pixels) to leave below the element. Defaults to 20px.
- `minHeight` (optional): Minimum height (in pixels) for the element. Defaults to 100px.

## Returns

An object containing:

- `ref`: A React ref object that must be attached to the target DOM element
- `maxHeight`: A CSS-compatible string value for the calculated maximum height (e.g., "500px")

## Implementation Details

- The hook uses `window.innerHeight` and the element's position to calculate the available space between the element's top edge and the bottom of the viewport.
- It subtracts the specified buffer from the available height to ensure there's space below the element.
- The calculated height is constrained by the specified minimum height to prevent the element from becoming too small.
- The hook uses `requestAnimationFrame` to ensure the initial calculation happens after the component has been rendered and positioned in the DOM.
- It automatically recalculates the maximum height when:
  - The window is resized
  - The `data`, `buffer`, or `minHeight` dependencies change
- The hook properly cleans up event listeners and animation frame requests when the component unmounts.

This hook is particularly useful for panels, menus, and content areas that need to dynamically adjust their height based on their position in the viewport, ensuring a good user experience without unexpected scrolling or content clipping.