# Viewport Grid Service


## Overview
This is a new UI service, that handles the grid layout of the viewer.



<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/549261939?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Viewport Modal"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>


## Interface

For a more detailed look on the options and return values each of these methods
is expected to support, [check out it's interface in `@ohif/core`][interface]

| API Member                                                           | Description                                         |
| -------------------------------------------------------------------- | --------------------------------------------------- |
| `setActiveViewportIndex(index)`                                      | Sets the active viewport index in the app           |
| `getState()`                                                         | Gets the states of the viewport (see below)         |
| `setDisplaysetForViewport({ viewportIndex, displaySetInstanceUID })` | Sets displaySet for viewport based on displaySet Id |
| `setLayout({numCols, numRows})`                                      | Sets rows and columns                               |
| `reset()`                                                            | Resets the default states                           |

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
}
```
