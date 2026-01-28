---
sidebar_position: 7
sidebar_label: Segmentation Service
title: Segmentation Service
summary: Documentation for OHIF's SegmentationService, which provides tools for creating, managing, and interacting with image segmentations, including labelmap creation, segment operations, and visualization controls.
---

# Segmentation Service


## Events

```typescript
SEGMENTATION_MODIFIED                               // When a segmentation is updated
SEGMENTATION_DATA_MODIFIED                          // When segmentation data changes
SEGMENTATION_ADDED                                  // When new segmentation is added
SEGMENTATION_REMOVED                                // When segmentation is removed
SEGMENT_LOADING_COMPLETE                            // When segment group adds pixel data to volume
SEGMENTATION_LOADING_COMPLETE                       // When full segmentation volume is filled
SEGMENTATION_ANNOTATION_CUT_MERGE_PROCESS_COMPLETED // When a segmentation's annotation cut merge process is completed.
SEGMENTATION_STYLE_MODIFIED                         // When a segmentation style is modified.
```

## Core APIs

### Creation Methods

```typescript
createLabelmapForDisplaySet(
  displaySet,
  {
    segmentationId?: string,
    label: string,
    segments?: {
      [segmentIndex: number]: Partial<Segment>
    }
  }
)

createContourForDisplaySet(
  displaySet,
  {
    segmentationId?: string,
    label: string,
    segments?: {
      [segmentIndex: number]: Partial<Segment>
    }
  }
)
```

### Segmentation Management

```typescript
setActiveSegmentation(viewportId, segmentationId)
getSegmentations()
getSegmentation(segmentationId)
jumpToSegmentCenter(segmentationId, segmentIndex, viewportId)
jumpToSegmentNext(segmentationId, segmentIndex, forViewportId?, direction?, highlightAlpha?, highlightSegment?, animationLength?, highlightHideOthers?, animationFunctionType?)
highlightSegment(segmentationId, segmentIndex, viewportId)
```

### Segment Operations

```typescript
addSegment(segmentationId, {
  segmentIndex?: number,
  label?: string,
  color?: [number, number, number, number], // RGBA
  visibility?: boolean,
  isLocked?: boolean,
  active?: boolean
})

setSegmentColor(viewportId, segmentationId, segmentIndex, color)
setSegmentVisibility(viewportId, segmentationId, segmentIndex, visibility)
```

## Data Structures

### Segmentation Object

```typescript
interface Segmentation {
  segmentationId: string;
  label: string;
  segments: {
    [segmentIndex: number]: {
      segmentIndex: number;
      label: string;
      locked: boolean;
      cachedStats: { [key: string]: unknown };
      active: boolean;
    }
  };
  representationData: RepresentationsData;
}
```

## Code Examples

### Creating a Label Map Segmentation

```typescript
const displaySet = displaySetService.getDisplaySetByUID(displaySetUID);
const segmentationId = await segmentationService.createLabelmapForDisplaySet(
  displaySet,
  {
    label: 'New Label Map Segmentation',
    segments: {
      1: {
        label: 'First Label Map Segment',
        active: true
      }
    }
  }
);

### Creating a Label Map Segmentation

const displaySet = displaySetService.getDisplaySetByUID(displaySetUID);
const segmentationId = await segmentationService.createContourForDisplaySet(
  displaySet,
  {
    label: 'New Contour Segmentation',
    segments: {
      1: {
        label: 'First Contour Segment',
        active: true
      }
    }
  }
);
```

### Managing Active Segmentations

```typescript
segmentationService.setActiveSegmentation('viewport-1', segmentationId);
```

### Adding Segments

```typescript
segmentationService.addSegment(segmentationId, {
  label: 'Tumor',
  color: [255, 0, 0, 255], // RGBA format
  active: true
});
```

### Visibility Management

```typescript
// Set segment visibility
segmentationService.setSegmentVisibility(
  'viewport-1',
  segmentationId,
  1, // segmentIndex
  true // visible
);

// Get viewport IDs with segmentation
const viewportIds = segmentationService.getViewportIdsWithSegmentation(segmentationId);
```

### Segment Styling

```typescript
// Set segment color
segmentationService.setSegmentColor(
  'viewport-1',
  segmentationId,
  1, // segmentIndex
  [255, 0, 0, 255] // RGBA
);
```

### Navigation

#### jumpToSegmentNext

Jumps to the next or previous slice that contains the specified segment in the viewport. This method handles both labelmap and contour segmentations:
- For **labelmaps**: Jumps to the segment center
- For **contours**: Cycles through all slices that contain contour data for the segment in the specified direction

```typescript
segmentationService.jumpToSegmentNext(
  segmentationId: string,
  segmentIndex: number,
  forViewportId?: string,           // Optional viewport ID. If not provided, applies to all viewports with this segmentation
  direction?: number,                // 1 for forward (default), -1 for backward
  highlightAlpha?: number,           // Alpha value for highlighting (0-1), default: 0.9
  highlightSegment?: boolean,        // Whether to highlight the segment after jumping, default: true
  animationLength?: number,          // Length of highlight animation in milliseconds, default: 750
  highlightHideOthers?: boolean,     // Whether to hide other segments during highlight, default: false
  animationFunctionType?: EasingFunctionEnum // The easing function to use for animation, default: EASE_IN_OUT
)
```

**Navigation Behavior:**
- **Forward (direction = 1)**: Finds the next slice after the current one that contains the segment. If no slice is found after the current one, wraps around to the first slice with the segment.
- **Backward (direction = -1)**: Finds the previous slice before the current one that contains the segment. If no slice is found before the current one, wraps around to the last slice with the segment.

**Example Usage:**

```typescript
// Jump to next slice with segment 1
segmentationService.jumpToSegmentNext(
  segmentationId,
  1, // segmentIndex
  'viewport-1'
);

// Jump to previous slice with segment 2, with custom highlighting
segmentationService.jumpToSegmentNext(
  segmentationId,
  2, // segmentIndex
  'viewport-1',
  -1, // backward direction
  0.95, // highlightAlpha
  true, // highlightSegment
  1000, // animationLength in ms
  true // highlightHideOthers
);

// Apply to all viewports with this segmentation
segmentationService.jumpToSegmentNext(
  segmentationId,
  1 // segmentIndex
  // forViewportId omitted - applies to all viewports
);
```
