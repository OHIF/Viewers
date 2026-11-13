---
sidebar_position: 1
sidebar_label: Requirements
title: Segmentation of a 4D series — requirements
summary: What a user must be able to do, and must be able to determine, when the user segments a 4D (dynamic) series such as a dynamic PET or a cardiac cine.
---

# Segmentation of a 4D series — requirements

**Prefix:** `SEG4D`. User requirements have the form `SEG4D-U-n`.
**Source:** [OHIF/Viewers#6411](https://github.com/OHIF/Viewers/pull/6411) and
[cornerstonejs/cornerstone3D#3067](https://github.com/cornerstonejs/cornerstone3D/pull/3067).
**Status:** Draft, under review. This document holds the user requirements. The
[implementation specification](./implementation.md) holds the implementation requirements.

---

## 1. Purpose

A 4D series has the same slices at several time points, for example the frames of a dynamic PET
or the phases of a cardiac cine. A user segments such a series for two different reasons:

- to define one region, and to measure that region at every time point (a time-activity curve);
- to outline a structure that moves or changes, separately at each time point.

The two reasons need different segmentations. The user must choose, and must be able to see
which choice applies.

## 2. Scope

### 2.1 How to read this specification

This document states the **user requirements**: what the user must be able to do, or must be
able to determine, to work safely. A user requirement names no class, file, event, or algorithm.
The [implementation specification](./implementation.md) states how the work is done. Each
implementation requirement cites the user requirements that it satisfies.

You can change the implementation specification freely when a better approach appears. You
change this document in two cases only: a requirement describes the behaviour wrongly, or the
intended user-facing behaviour changes. An implementation that is inconvenient is never a reason
to change this document.

### 2.2 In scope

- Labelmap and contour segmentations that reference a 4D series.
- Creation, edit, display, undo and redo, statistics, and navigation.

### 2.3 Out of scope

- Different time points of one segmentation in different viewports at the same time. All
  viewports show the same time point of a segmentation (`SEG4D-U-6`). A later change can allow
  this, when viewports can be grouped by time point.

## 3. Definitions

- **4D series**: a series whose images form the same slices at two or more time points.
- **Time point**: one complete set of slices of a 4D series.
- **All time points segmentation**: one set of voxels that applies to every time point.
- **Each time point segmentation**: a separate set of voxels for each time point.

## 4. User requirements

**SEG4D-U-1 — Choice at creation**
When the user adds a labelmap segmentation to a 4D series, the viewer shall ask the user to
choose "All time points" or "Each time point". The viewer shall not ask this question for a 3D
series.

**SEG4D-U-2 — Cancel**
When the user cancels the choice of `SEG4D-U-1`, the viewer shall create no segmentation.

**SEG4D-U-3 — All time points**
An edit of an "All time points" segmentation shall show at every time point.

**SEG4D-U-4 — Each time point**
An edit of an "Each time point" segmentation shall change only the time point on which the user
makes the edit. The other time points shall not change.

**SEG4D-U-5 — Default without a choice**
When a workflow creates a labelmap segmentation of a 4D series without the question of
`SEG4D-U-1`, the segmentation shall be "All time points". A contour segmentation shall show at
every time point, and the viewer shall not ask the question for it.

**SEG4D-U-6 — One time point on display**
All viewports that show a segmentation of a 4D series shall show the same time point of that
segmentation. The time point of the segmentation shall be the time point of the image on
display.

**SEG4D-U-7 — Edit in any viewport**
An edit shall apply to the time point of the image on which the user makes the edit, in a
volume viewport and in a stack viewport.

**SEG4D-U-8 — Undo and redo**
An undo or a redo shall restore the time point of the edit, also when a different time point is
on display. An undo shall not change a different time point.

**SEG4D-U-9 — Statistics**
The statistics of a segment shall use the image values of the time point on display, for an
"All time points" and for an "Each time point" segmentation. When the time point changes, the
statistics shall change to the new time point.

**SEG4D-U-10 — Navigation**
When the user navigates to an item on a 4D series, for example a segment or a measurement, the
viewer shall show the time point of that item. A viewport shall not report that it shows the
item when it shows a different time point.

**SEG4D-U-11 — Save and load**
When the user saves a segmentation of a 4D series and loads it again, the segmentation shall keep
its choice of "All time points" or "Each time point". *Not implemented yet.*
