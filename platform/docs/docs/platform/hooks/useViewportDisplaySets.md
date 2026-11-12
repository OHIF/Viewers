---
title: useViewportDisplaySets
summary: A React hook that provides access to display sets associated with a viewport, including background, foreground, overlay, and potential display sets.
---

# useViewportDisplaySets

The `useViewportDisplaySets` hook provides access to display sets associated with a viewport, organized into categories based on their role and potential usage.

## Overview

This hook retrieves all display sets associated with a specific viewport and categorizes them into background, foreground, overlays, and potential display sets that could be added to the viewport in different roles. It allows components to efficiently access and manage viewport display sets for various UI interactions like layer menus and display set selectors.

## Import

```js
import { useViewportDisplaySets } from '@ohif/extension-cornerstone';
```

## Usage

```jsx
function ViewportLayerControls({ viewportId }) {
  const {
    backgroundDisplaySet,
    foregroundDisplaySets,
    overlayDisplaySets,
    potentialOverlayDisplaySets,
    potentialForegroundDisplaySets,
    potentialBackgroundDisplaySets,
  } = useViewportDisplaySets(viewportId);

  return (
    <div>
      <div>
        <h3>Background</h3>
        <div>{backgroundDisplaySet?.SeriesDescription}</div>
      </div>

      <div>
        <h3>Foreground ({foregroundDisplaySets.length})</h3>
        {foregroundDisplaySets.map(ds => (
          <div key={ds.displaySetInstanceUID}>{ds.SeriesDescription}</div>
        ))}
      </div>

      <div>
        <h3>Overlays ({overlayDisplaySets.length})</h3>
        {overlayDisplaySets.map(ds => (
          <div key={ds.displaySetInstanceUID}>{ds.SeriesDescription}</div>
        ))}
      </div>

      <div>
        <h3>Available Overlays ({potentialOverlayDisplaySets.length})</h3>
        {potentialOverlayDisplaySets.map(ds => (
          <div key={ds.displaySetInstanceUID}>{ds.SeriesDescription}</div>
        ))}
      </div>
    </div>
  );
}
```

## Parameters

- `viewportId` (optional): The ID of the viewport to get display sets for. If not provided, uses the active viewport.
- `options` (optional): Configuration options to control which display sets to include:
  - `includeBackground`: Whether to include the background display set (default: true)
  - `includeForeground`: Whether to include foreground display sets (default: true)
  - `includeOverlay`: Whether to include overlay display sets (default: true)
  - `includePotentialOverlay`: Whether to include potential overlay display sets (default: true)
  - `includePotentialForeground`: Whether to include potential foreground display sets (default: true)
  - `includePotentialBackground`: Whether to include potential background display sets (default: true)

## Returns

An object containing requested display set collections based on options:

- `allDisplaySets`: All display sets in the viewer (only if requested)
- `viewportDisplaySets`: The display sets currently in the viewport
- `backgroundDisplaySet`: The primary display set for the viewport (base image)
- `foregroundDisplaySets`: Display sets currently shown with background (non-overlay layers)
- `overlayDisplaySets`: Segmentation display sets currently applied as overlays
- `potentialOverlayDisplaySets`: Display sets that could be toggled on as overlays (derived modalities)
- `potentialForegroundDisplaySets`: Display sets that could be added as foreground layers
- `potentialBackgroundDisplaySets`: Display sets that could replace the current background

Each property is only included if the corresponding option is true.

## Implementation Details

- The hook automatically adapts to viewport changes through the `useViewportGrid` hook.
- It only fetches and processes display sets that are needed based on the provided options.
- Display sets are categorized based on their modality and properties.
- Potential display sets are sorted by priority to present the most relevant options first.
- Derived overlay modalities (like SEG, SR) are treated differently than other display sets.
- The hook uses memoization extensively to optimize performance and prevent unnecessary recalculations.
