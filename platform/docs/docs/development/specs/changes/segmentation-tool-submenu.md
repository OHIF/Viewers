---
sidebar_position: 1
sidebar_label: CP-SEGTOOL — segmentation tools to a toolbar sub-menu
title: 'CP-SEGTOOL: move segmentation and contour tools into a toolbar sub-menu'
summary: Change proposal moving the labelmap and contour segmentation tool sections out of the segmentation side panel and into grouped sub-menus in the top menu bar.
---

# CP-SEGTOOL — segmentation and contour tools into a toolbar sub-menu

**Prefix:** `CP-SEGTOOL` — see the [specification register](../index.md#1-index-of-component-specifications).
**Status:** Proposed
**Phase:** 1 — see [result sets §2.4](../result-sets/requirements.md#24-phases)
**Satisfies:** `EM-SID-6` *(proposed)*, `EM-TOP-1`, `EM-TOP-8`..`EM-TOP-19`, `RS-VIEW-2`, `RS-TOOL-1`, `RS-TOOL-2`, `SB-TOOL-1`
**Affects:** `@ohif/extension-cornerstone`, `@ohif/mode-segmentation`, `@ohif/mode-basic`

---

## 1. Summary

Move the labelmap segmentation tools and the contour segmentation tools out of the segmentation
side panel and into grouped sub-menus in the top menu bar.

The tools themselves do not change. What changes is where they are selected from, and that they
become reachable when the segmentation panel is closed or absent.

## 2. Motivation

[`EM-SID-6`](../extensions-and-modes/requirements.md) says a side panel region shall not host tool
selection, and is marked *(proposed)* precisely because of this case. The current placement
produces three symptoms, all of which are described in
[OHIF/Viewers#6193](https://github.com/OHIF/Viewers/issues/6193):

1. **A tool cannot be used until a panel is open.** Brush is a drawing tool like any other, but
   unlike every other drawing tool it requires the right side panel to be expanded and the right
   tab selected. This violates `EM-LAY-7` and `SB-OWN-3`.
2. **The tool's target is whatever the panel has selected.** Because selection and drawing share a
   surface, the user cannot tell whether they are choosing what to draw *with* or what to draw
   *into*. `RS-TOOL-3`..`RS-TOOL-12` resolve the target from viewport applicability instead, which
   only works once the two are separated.
3. **Segmentation tools look like a different kind of thing from measurement tools.** They are not.
   A user who has learned that tools live in the top menu bar has to learn a second rule.

Moving them also removes the need for the panel variants that exist only to carry a toolbox
(§6.2).

## 3. Current state

| Concern | Today |
| --- | --- |
| Rendering | `wrappedPanelSegmentationWithTools` in [getPanelModule.tsx](https://github.com/OHIF/Viewers/blob/master/extensions/cornerstone/src/getPanelModule.tsx) renders a `Toolbox` above `PanelSegmentation` |
| Panels | `panelSegmentationWithToolsLabelMap`, `panelSegmentationWithToolsContour` |
| Toolbox sections | `labelMapSegmentationToolbox` → `['LabelMapTools']`, `contourSegmentationToolbox` → `['ContourTools']` |
| Group definitions | `LabelMapTools` and `ContourTools`, both `uiType: 'ohif.toolBoxButtonGroup'` with `buttonSection: true` |
| Labelmap members | `LabelmapSlicePropagation`, `BrushTools` (`Brush`, `Eraser`, `Threshold`), `MarkerLabelmap`, `ClickSegment`, `Shapes`, `LabelMapEditWithContour` |
| Contour members | `PlanarFreehandContourSegmentationTool`, `SculptorTool`, `SplineContourSegmentationTool`, `LivewireContourSegmentationTool` |
| Utilities sections | `labelMapSegmentationUtilities` → `LabelMapUtilities`, `contourSegmentationUtilities` → `ContourUtilities`, rendered inside `PanelSegmentation` |
| Consumers | `modes/segmentation` right panels; `setUpAutoTabSwitchHandler.ts` switches between the two panels by id |
| Existing sub-menu mechanism | `uiType: 'ohif.toolButtonList'` with `buttonSection: true`, already used for `MeasurementTools` and `MoreTools` |

The membership is already expressed as groups. What is missing is that those groups are rendered
by a panel-hosted `Toolbox` rather than by the top menu bar.

## 4. Proposed change

Present `LabelMapTools` and `ContourTools` as top-menu-bar groups, using the same sub-menu
mechanism `MeasurementTools` already uses, and delete the panel-hosted toolbox.

```
Top menu bar
  … WindowLevel · Pan · Zoom · Layout · Crosshairs
  Segmentation ▾     ← LabelMapTools: Brush · Eraser · Threshold · Shapes · …
  Contour ▾          ← ContourTools: Freehand · Spline · Livewire · Sculptor
  MoreTools ▾

Right panel — segmentation sidebar
  (no toolbox)
  Utilities: Interpolate · Bidirectional · Simplify · Smooth   ← unchanged, these are actions
  Segment list
```

## 5. Requirements

**CP-SEGTOOL-1**
The system shall present the labelmap segmentation tools as a group in the top menu bar.

**CP-SEGTOOL-2**
The system shall present the contour segmentation tools as a group in the top menu bar.

**CP-SEGTOOL-3**
The system shall present the labelmap group and the contour group as two distinct groups.

> **Note (CP-SEGTOOL-3):** They produce different representations, are enabled independently by
> modes, and share no members, so `EM-TOP-9` groups them separately. See §8 item 1 for the
> single-combined-group alternative.

**CP-SEGTOOL-4**
Both groups shall satisfy `EM-TOP-8`..`EM-TOP-19`, including last-selected promotion
(`EM-TOP-14`, `EM-TOP-15`) and session retention (`EM-TOP-17`, `EM-TOP-18`).

**CP-SEGTOOL-5**
The system shall not render tool selection in the segmentation sidebar.

**CP-SEGTOOL-6**
The system shall continue to render the labelmap and contour **utilities** in the segmentation
sidebar.

> **Note (CP-SEGTOOL-6):** Interpolate, bidirectional, simplify, and smooth act on an already
> selected segment rather than changing what the next interaction does. `EM-PLC-4` makes them
> actions, and `EM-PLC-1` keeps them with the selection they act on.

**CP-SEGTOOL-7**
WHERE a mode enables only one of the two representations, the system shall present only that
representation's group.

**CP-SEGTOOL-8**
The system shall present a group only while at least one of its tools is applicable to the active
viewport.

**CP-SEGTOOL-9**
WHILE the segmentation sidebar is closed or absent, the system shall keep every tool in both groups
selectable.

**CP-SEGTOOL-10**
WHEN a tool from either group is activated and no suitable result set exists, the system shall
resolve or create one per `RS-TOOL-3`..`RS-TOOL-12`.

**CP-SEGTOOL-11**
The system shall allow a mode to determine the membership, order, and default of both groups,
without restating the tool definitions.

**CP-SEGTOOL-12**
The system shall not change which tools exist, what they do, or the commands they run.

## 6. Migration

### 6.1 What moves

The section membership already exists and does not need rewriting. The change is which surface
renders it: the two toolbox sections are added to the primary toolbar section list, and
`wrappedPanelSegmentationWithTools` loses its `Toolbox`.

### 6.2 Panel variants become redundant

**CP-SEGTOOL-13**
WHEN the toolbox is removed, `panelSegmentationWithToolsLabelMap` and
`panelSegmentationWithToolsContour` shall become equivalent to `panelSegmentation` differing only
in their representation filter, and the system shall retire the duplicated variants.

**CP-SEGTOOL-14**
IF a mode or deployment references a retired panel id, THEN the system shall continue to resolve it
to the equivalent panel for one release, and shall warn.

> `setUpAutoTabSwitchHandler.ts` in `modes/segmentation` switches panels by these ids and is
> updated with them.

### 6.3 Modes

**CP-SEGTOOL-15**
The system shall update the shipped modes that enable segmentation editing to include the groups in
their primary toolbar section.

## 7. What this does not change

- The tools, their commands, their icons, and their behaviour.
- The utilities and where they appear.
- The segment list, its statistics, and every other part of the segmentation sidebar.
- The tool groups and their cornerstone bindings.
- Any DICOM behaviour.

## 8. Open items

1. **One group or two.** `CP-SEGTOOL-3` proposes two. The alternative — a single *Segmentation*
   group containing both representations' tools — is defensible: a user who wants to outline a
   region may not be thinking in terms of labelmap versus contour, and one group is one place to
   look. It was not chosen because the two sets share no members, modes commonly enable only one,
   and a combined group's top-level item would silently switch the representation being produced.
   Worth deciding before implementation.
2. **Group labels.** "Segmentation" and "Contour" are placeholders. "Contour" is a representation
   name rather than a user-facing verb, and both groups produce segmentations.
3. **Where the groups sit in the primary section.** Adjacent to the measurement tools, or after
   them, or in a segmentation-specific area — undecided, and `EM-TOP-4` leaves it to the mode.
4. **Interaction with `EM-TOP-15`.** With two groups, alternating between a labelmap tool and a
   contour tool leaves both groups showing their own last selection, which is the intent. With one
   combined group it would not, which is a further argument for item 1's answer being "two".

## 9. Verification

| Requirement | Verification |
| --- | --- |
| `CP-SEGTOOL-1`..`CP-SEGTOOL-3` | Playwright: both groups present in the top menu bar in `modes/segmentation`, with the expected members. |
| `CP-SEGTOOL-4` | The `EM-TOP-8`..`EM-TOP-19` suite, pointed at these two groups. |
| `CP-SEGTOOL-5`, `CP-SEGTOOL-6` | Playwright: no tool selection in the segmentation sidebar; utilities still present and functional. |
| `CP-SEGTOOL-7`, `CP-SEGTOOL-8` | Playwright per mode: a mode enabling only labelmap shows only that group; a group is absent when no member applies to the active viewport. |
| `CP-SEGTOOL-9` | Playwright: collapse the right panel, select brush, draw. |
| `CP-SEGTOOL-10` | Covered by the `RS-TOOL` suite. |
| `CP-SEGTOOL-12` | Existing segmentation end-to-end tests pass with only their tool-selection steps updated. |
| `CP-SEGTOOL-13`, `CP-SEGTOOL-14` | Unit test asserting a retired panel id resolves and warns. |
