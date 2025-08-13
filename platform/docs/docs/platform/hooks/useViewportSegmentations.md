---
title: useViewportSegmentations
summary: A React hook that provides segmentation data and representations for the active viewport with automatic updates when segmentations change.
---

# useViewportSegmentations

The `useViewportSegmentations` hook provides access to segmentation data and their representations for a specific viewport, with automatic updates when segmentations are modified, removed, or representations change.

## Overview

This hook retrieves all segmentations and their representations for a given viewport from the segmentation service. It maps the segmentation data to a display-friendly format, including readable text for statistics. The hook monitors various segmentation and viewport events to update automatically when changes occur.

## Import

```js
import { useViewportSegmentations } from '@ohif/extension-cornerstone';
```

## Usage

```jsx
function SegmentationPanel({ viewportId }) {
  const { segmentationsWithRepresentations, disabled } = useViewportSegmentations({
    viewportId,
    subscribeToDataModified: true,
    debounceTime: 100,
  });

  if (disabled) {
    return <div>Segmentations not available for this modality</div>;
  }

  if (!segmentationsWithRepresentations.length) {
    return <div>No segmentations available</div>;
  }

  return (
    <div>
      {segmentationsWithRepresentations.map(({ segmentation, representation }) => (
        <div key={segmentation.id}>
          <h3>{segmentation.label}</h3>
          {Object.entries(segmentation.segments).map(([segmentIndex, segment]) => (
            <div key={segmentIndex}>
              <h4>{segment.label}</h4>
              {segment.displayText.primary.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Parameters

- `options` - Configuration options:
  - `viewportId` (required): The ID of the viewport to get segmentations for
  - `subscribeToDataModified` (optional): Whether to subscribe to segmentation data modifications (default: false)
  - `debounceTime` (optional): Debounce time in milliseconds for updates (default: 0)

## Returns

An object with the following properties:

- `segmentationsWithRepresentations`: An array of objects with each containing:
  - `representation`: The segmentation representation in the viewport
  - `segmentation`: The mapped segmentation data with display-friendly properties:
    - `label`: The segmentation label
    - `segments`: Object mapping segment indices to segment data:
      - `label`: Segment label
      - `color`: Segment color
      - `displayText`: Organized text for display with `primary` and `secondary` arrays

- `disabled`: Boolean indicating if segmentations are disabled for the current modality

## Events

The hook automatically updates when any of these events occur:
- `SEGMENTATION_MODIFIED`
- `SEGMENTATION_REMOVED`
- `SEGMENTATION_REPRESENTATION_MODIFIED`
- `ACTIVE_VIEWPORT_ID_CHANGED`
- `GRID_STATE_CHANGED`
- `SEGMENTATION_DATA_MODIFIED` (only if `subscribeToDataModified` is true)

## Implementation Details

- The hook excludes certain modalities from segmentation display: 'SM', 'OT', 'DOC', 'ECG'.
- It uses debouncing to prevent excessive re-renders when multiple segmentation events occur in rapid succession.
- Segmentation statistics are automatically mapped to readable text using the customization service.
- Nested statistics are displayed with indentation to maintain hierarchy.
