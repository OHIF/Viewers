---
sidebar_position: 7
sidebar_label: Segmentation Service
title: Segmentation Service
summary: Documentation for OHIF's SegmentationService, which provides tools for creating, managing, and interacting with image segmentations, including labelmap creation, segment operations, and visualization controls.
---

# Segmentation Service


## Events

```typescript
SEGMENTATION_MODIFIED          // When a segmentation is updated
SEGMENTATION_DATA_MODIFIED     // When segmentation data changes
SEGMENTATION_ADDED            // When new segmentation is added
SEGMENTATION_REMOVED          // When segmentation is removed
SEGMENT_LOADING_COMPLETE      // When segment group adds pixel data to volume
SEGMENTATION_LOADING_COMPLETE // When full segmentation volume is filled
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
```

### Segmentation Management

```typescript
setActiveSegmentation(viewportId, segmentationId)
getSegmentations()
getSegmentation(segmentationId)
jumpToSegmentCenter(segmentationId, segmentIndex, viewportId)
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

### Creating a Segmentation

```typescript
const displaySet = displaySetService.getDisplaySetByUID(displaySetUID);
const segmentationId = await segmentationService.createLabelmapForDisplaySet(
  displaySet,
  {
    label: 'New Segmentation',
    segments: {
      1: {
        label: 'First Segment',
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
