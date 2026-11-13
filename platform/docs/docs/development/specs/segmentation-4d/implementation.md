---
sidebar_position: 2
sidebar_label: Implementation
title: Segmentation of a 4D series — implementation requirements
summary: How OHIF and Cornerstone3D implement the segmentation of a 4D series — the creation options, the dynamic labelmap volume, the events, and the view references.
---

# Segmentation of a 4D series — implementation requirements

**Prefix:** `SEG4D`. Implementation requirements have the form `SEG4D-I-n`.
**User requirements:** [Segmentation of a 4D series — requirements](./requirements.md).
**Status:** Draft. This is the recommended approach, and it can change.

---

## 1. Scope

This document states how the work is done. Each requirement cites the user requirements of the
[requirements specification](./requirements.md) that it satisfies. You can change this document
freely when a better approach appears. A change that needs a change of a user requirement goes
into the requirements specification first.

## 2. Implementation requirements

**SEG4D-I-1 — The dialog**
`createSegmentationForViewport` shall show `promptTimePointScope` for a labelmap on a display set
with `isDynamicVolume`. The command option `timePointScope: 'all' | 'each'` shall skip the
dialog. A cancel shall return `undefined`. *Satisfies `SEG4D-U-1`, `SEG4D-U-2`.*

**SEG4D-I-2 — Service options**
`SegmentationService.createLabelmapForDisplaySet` shall take `timePointScope` (default `'all'`)
and `timePointIndex` (default: the middle time point). `'all'` shall make one 3D labelmap of the
images of one time point. `'each'` shall make one labelmap image for each image of every time
point, with the RLE voxel representation. A contour shall use one time point. *Satisfies
`SEG4D-U-3`, `SEG4D-U-4`, `SEG4D-U-5`.*

**SEG4D-I-3 — The dynamic labelmap volume**
Cornerstone3D shall make one labelmap volume of one time point for an "each" labelmap
(`createDynamicLabelmapVolume`). The volume shall hold the labelmap images of every time point,
and it shall follow `DYNAMIC_VOLUME_DIMENSION_GROUP_CHANGED` of the image volume. A 3D labelmap
shall get no extra volume. *Satisfies `SEG4D-U-4`, `SEG4D-U-6`.*

**SEG4D-I-4 — Stack edits**
An edit in a stack viewport shall first select the time point of `viewport.getCurrentImageId()`
in the dynamic labelmap volume. *Satisfies `SEG4D-U-6`, `SEG4D-U-7`.*

**SEG4D-I-5 — Undo memo**
An edit of a dynamic labelmap volume shall use the voxel manager of one time point
(`getDynamicLabelmapTimePoint`), so that the memo writes to that time point. *Satisfies
`SEG4D-U-8`.*

**SEG4D-I-6 — The event**
`SEGMENTATION_DATA_MODIFIED` shall give `dimensionGroupNumber` for a segmentation of a 4D
series. A change of time point shall fire the event for each 4D labelmap, and with
`voxelsUnchanged: true` for each 3D labelmap over the images of the dynamic volume. *Satisfies
`SEG4D-U-9`.*

**SEG4D-I-7 — Statistics**
The statistics of a 3D labelmap over a dynamic volume shall read the image values from the
dynamic volume, which gives the time point on display. *Satisfies `SEG4D-U-9`.*

**SEG4D-I-8 — View references**
The view reference of a volume viewport that shows a dynamic volume shall have
`dimensionGroupNumber`. `isReferenceViewable` without navigation shall return false for a
different time point. `setViewReference` shall select the time point. *Satisfies `SEG4D-U-10`.*

**SEG4D-I-9 — Volume to stack**
`convertVolumeToStackLabelmap` shall keep the labelmap images of every time point. *Satisfies
`SEG4D-U-4`.*
