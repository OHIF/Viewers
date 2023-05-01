---
sidebar_position: 6
sidebar_label: Viewport Grid Service
---

# Viewport Grid Service

## Overview

This is a new UI service, that handles the grid layout of the viewer.

## Interface

For a more detailed look on the options and return values each of these methods
is expected to support, [check out it's interface in `@ohif/core`][interface]

| API Member                                                            | Description                                         |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| `setActiveViewportIndex(index)`                                       | Sets the active viewport index in the app           |
| `getState()`                                                          | Gets the states of the viewport (see below)         |
| `setDisplaySetsForViewport({ viewportIndex, displaySetInstanceUID })` | Sets displaySet for viewport based on displaySet Id |
| `setLayout({numCols, numRows, keepExtraViewports})`                   | Sets rows and columns. When the total number of viewports decreases, optionally keep the extra/offscreen viewports.                               |
| `reset()`                                                             | Resets the default states                           |
| `getNumViewportPanes()`                                               | Gets the number of visible viewport panes           |

## Implementations

| Implementation         | Consumer                   |
| ---------------------- | -------------------------- |
| [ViewportGridProvider] | Baked into Dialog Provider |

`*` - Denotes maintained by OHIF

## State

```js
const DEFAULT_STATE = {
  // starting from null, hanging
  // protocol will defined number of rows and cols
  numRows: null,
  numCols: null,
  viewports: [
    /*
     * {
     *    displaySetInstanceUID: string,
     * }
     */
  ],
  activeViewportIndex: 0,
};
```
