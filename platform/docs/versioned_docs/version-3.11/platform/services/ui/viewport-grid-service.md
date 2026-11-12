---
sidebar_position: 6
sidebar_label: Viewport Grid Service
title: Viewport Grid Service
summary: Documentation for OHIF's Viewport Grid Service, which manages the layout and configuration of the viewer's viewport grid, handling active viewport selection, display set assignment, and layout changes with event broadcasting capabilities.
---

# Viewport Grid Service

## Overview

This is a new UI service, that handles the grid layout of the viewer.

## Events

There are seven events that get publish in `ViewportGridService `:

| Event                         | Description                                       |
| ----------------------------- | --------------------------------------------------|
| ACTIVE_VIEWPORT_ID_CHANGED | Fires the Id of the active viewport is changed |
| LAYOUT_CHANGED                | Fires the layout is changed                       |
| GRID_STATE_CHANGED            | Fires when the entire grid state is changed       |
| VIEWPORTS_READY            | Fires when the viewports are ready in the grid      |

## Interface

For a more detailed look on the options and return values each of these methods
is expected to support, [check out it's interface in `@ohif/core`][interface]

| API Member                                                            | Description                                         |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| `setActiveViewportId(viewportId)`                                       | Sets the active viewport Id in the app           |
| `getState()`                                                          | Gets the states of the viewport (see below)         |
| `setDisplaySetsForViewport({ viewportId, displaySetInstanceUID })` | Sets displaySet for viewport based on displaySet Id |
| `setLayout({numCols, numRows, keepExtraViewports})`                   | Sets rows and columns. When the total number of viewports decreases, optionally keep the extra/offscreen viewports. |
| `reset()`                                                             | Resets the default states                           |
| `getNumViewportPanes()`                                               | Gets the number of visible viewport panes           |
| `getLayoutOptionsFromState(gridState)`                                | Utility method that produces a `ViewportLayoutOptions` based on the passed in state|
| `getActiveViewportId()`                                | Returns the viewport Id of the active viewport in the grid|
| `getActiveViewportOptionByKey(key)`                             | Gets the specified viewport option field (key) for the active viewport |

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
  activeViewportId: null,
};
```
