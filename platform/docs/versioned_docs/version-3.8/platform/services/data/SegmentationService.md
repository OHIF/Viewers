---
sidebar_position: 7
sidebar_label: Segmentation Service
---

# Segmentation Service

## Overview

Using Segmentation Service you can create, edit and delete segmentation data, and
change appearance of the segmentation including color, opacity and visibility.

Segmentations in OHIF are based on the Segmentations in Cornerstone3D. You can
read more about it in the [Cornerstone Segmentation](https://www.cornerstonejs.org/docs/concepts/cornerstone-tools/segmentation/). OHIF currently only supports
one representation of the segmentation data.

## Events

There are seven events that get publish in `MeasurementService`:

| Event                 | Description                                            |
| --------------------- | ------------------------------------------------------ |
| SEGMENTATION_UPDATED   | Fires when a segmentation is updated e.g., segment added, removed etc.|
| SEGMENTATION_DATA_MODIFIED     | Fires when the segmentation data changes  |
| SEGMENTATION_ADDED | Fires when a new segmentation is added to OHIF |
| SEGMENTATION_REMOVED   | Fires when a segmentation is removed from OHIF                 |
| SEGMENTATION_CONFIGURATION_CHANGED  | Fires when a segmentation configuration is changed                |
| SEGMENT_LOADING_COMPLETE   | Fires when a segment group adds its pixel data to the volume    |
| SEGMENTATION_LOADING_COMPLETE   | Fires when the full segmentation volume is filled with its segments   |


## API

### Segmentation Creation

- `createSegmentationForDisplaySet`: based on a reference displaySet, create a new segmentation. E.g., create a new segmentation based on a CT series
- `createSegmentationForSEGDisplaySet`: given a segDisplaySet loaded by a sopClassHandler, create a new segmentation
- `addSegmentationRepresentationToToolGroup`: given the toolGroupId, add the given segmentationId to the toolGroup.


### Segmentation Behavior

- setActiveSegmentationForToolGroup, getSegmentations, getSegmentation, jumpToSegmentCenter, highlightSegment


### Segment Behavior

- setSegmentLocked, removeSegment, addSegment, setSegmentLocked, setSegmentLabel, setActiveSegment,
setSegmentRGBAColor

### Segmentation Configuration

Setters

- setSegmentVisibility, setSegmentColor, setSegmentRGBA, setSegmentOpacity, toggleSegmentationVisibility,
