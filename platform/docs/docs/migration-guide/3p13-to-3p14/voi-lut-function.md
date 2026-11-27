---
sidebar_position: 17
sidebar_label: VOI LUT Function
title: VOI LUT Function in the window level readout
---

# VOI LUT Function in the window level readout

OHIF 3.14 uses the VOI LUT Function (0028,1056) of the image when it converts
between a VOI range and a window. This change needs the VOI LUT Function support
of Cornerstone3D ([cornerstonejs/cornerstone3D#2856](https://github.com/cornerstonejs/cornerstone3D/pull/2856)).

## What a user sees

- The window level overlay item (`ohif.overlayItem.windowLevel`) shows a label
  before `W:` when the function in effect is not LINEAR:
  - `Exact W: 400 L: 40` for LINEAR_EXACT.
  - `Sigmoid W: 400 L: 40` for SIGMOID.
- When a VOI LUT Sequence maps the display, the label is `VOI LUT`. The W/L
  values then do not describe the display.
- A LINEAR_EXACT image with a window of W 400 / C 40 now reads `W: 400 L: 40`.
  Before 3.14, the overlay showed `W: 401 L: 41`.
- The overlay no longer rounds the W/L values to an integer. It uses
  `utilities.roundNumberTrim(value, 5)` of Cornerstone3D. That function keeps up
  to 3 decimals for a value of 100 or more, and more decimals for a smaller
  value. It removes trailing zeros. W 400.5 / L 40.25 reads
  `W: 400.5 L: 40.25`, and W 400 / L 40 reads `W: 400 L: 40`.
- A typed W/L preset on a LINEAR_EXACT image gives the exact range. For example,
  W 400 / C 40 gives -160..240, not -160..239.

## What code must change

Code that converts between a VOI range and a window must pass the VOI LUT
Function of the viewport as the third parameter:

```ts
import { utilities } from '@cornerstonejs/core';

const { VOILUTFunction } = viewport.getProperties();
const { windowWidth, windowCenter } = utilities.windowLevel.toWindowLevel(
  lower,
  upper,
  VOILUTFunction
);
const range = utilities.windowLevel.toLowHighRange(windowWidth, windowCenter, VOILUTFunction);
```

Without the function, both conversions use LINEAR. A LINEAR_EXACT image then
reads W 401 / C 40.5, and a typed window gives a range that is one unit short.

OHIF code that already passes the function:

- `useViewportRendering` (the readout, `setWindowLevel` and `setVOIRange`).
- The `setWindowLevel` viewport operation of the legacy and the native viewports.
- The hanging protocol `voi` option of a stack and of a volume.
- The default VOI range of a native viewport from the `voiLutModule` metadata.

## New values of `useViewportRendering`

- `VOILUTFunction`: the VOI LUT Function in effect (`'LINEAR'`, `'LINEAR_EXACT'`
  or `'SIGMOID'`), or `undefined` when the viewport does not report it.
  `undefined` converts as LINEAR.
- `voiLUTSequenceApplied`: `true` when a VOI LUT Sequence maps the display.
  A native viewport reports the value when the display set changes. A legacy
  viewport reports the value only in the `VOI_MODIFIED` event.

The `voi` property that the overlay items get also has the two values. A custom
overlay item that inherits from `ohif.overlayItem.windowLevel` keeps its
customization contract.
