---
sidebar_position: 7
sidebar_label: 4D segmentation
title: Segmentation of a 4D series
---

# Segmentation of a 4D series

OHIF 3.14 with Cornerstone3D 5.x changes how a labelmap segmentation of a 4D (dynamic) series
works. See the [requirements](../../development/specs/segmentation-4d/requirements.md).

## New options

- The `createLabelmapForViewport` command takes `options.timePointScope: 'all' | 'each'`. Without
  the option, a 4D display set shows a dialog. When the user cancels the dialog, the command
  returns `undefined` and creates no segmentation.
- `SegmentationService.createLabelmapForDisplaySet` takes `timePointScope` (default `'all'`) and
  `timePointIndex` (default: the middle time point). A caller that gives neither option gets the
  same result as in 3.13.

## `SEGMENTATION_DATA_MODIFIED` has the time point

The Cornerstone3D event `SEGMENTATION_DATA_MODIFIED` changes:

- The event detail has `dimensionGroupNumber` for a segmentation of a 4D series: the time point
  (starting at 1) of the modified data. An undo or a redo gives the time point of the edit, which
  can be different from the time point on display.
- A change of time point fires the event for each segmentation of the 4D series. For a labelmap
  that all time points share, the event also has `voxelsUnchanged: true`, because only the image
  values under the labelmap change.

**What to do:**

- A subscriber that does slow work, for example statistics, now runs on each change of time point.
  Debounce the work, as `SegmentationService` does.
- A subscriber that keeps data for each time point must read `dimensionGroupNumber`, and not the
  time point on display.
- A subscriber that only needs a change of voxels can skip an event with `voxelsUnchanged`.
