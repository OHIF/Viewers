---
sidebar_position: 2
sidebar_label: CP-TOOLCREATE — tools create what they need
title: 'CP-TOOLCREATE: tools create what they need instead of refusing to run'
summary: Change proposal replacing the "No segmentations available" and "Add segment to enable this tool" disabled states with creation of the result set, segmentation and first segment on first use.
---

# CP-TOOLCREATE — tools create what they need instead of refusing to run

**Prefix:** `CP-TOOLCREATE` — see the [specification register](../index.md#1-index-of-component-specifications).
**Status:** Proposed
**Phase:** 2 — see [result sets §2.4](../result-sets/requirements.md#24-phases)
**Satisfies:** `RS-TOOL-3`..`RS-TOOL-19`, in particular `RS-TOOL-15`..`RS-TOOL-19`
**Affects:** `@ohif/extension-cornerstone`, `@ohif/extension-cornerstone-dicom-seg`
**Depends on:** [CP-SEGTOOL](./segmentation-tool-submenu.md) — the tools have to be in the toolbar before "the panel is closed" stops being a reason they cannot run

---

## 1. Summary

A segmentation, contour, or annotation tool currently disables itself when there is nothing to
draw into. Make it create what it needs and carry on.

Nothing about the tools changes. What changes is that the absence of a target is treated as work
to do rather than as a reason to refuse.

## 2. Motivation

There are **two** separate refusals, and fixing only the first moves the complaint one step later
rather than removing it.

1. **`No segmentations available`** — the viewport holds no segmentation representation.
2. **`Add segment to enable this tool`** — a segmentation exists but has no segments.

Neither says anything about whether the tool *could* work here. Both say only that nobody has
drawn anything yet, which is the normal state at the start of every piece of work. The viewer is
asking the user to perform a setup step it is perfectly capable of performing itself, and the user
has to know that the setup step exists, that it lives in a panel, and that the panel has to be
open — which is the same knowledge [CP-SEGTOOL](./segmentation-tool-submenu.md) removes the need
for on the tool-selection side.

`RS-TOOL-16` states the principle: absence of a target is a reason to create, not a reason to
disable, warn, or error.

## 3. Current state

| Concern | Today |
| --- | --- |
| Refusal 1 | `evaluate.cornerstone.segmentation` and `evaluate.cornerstone.hasSegmentationOfType` in [getToolbarModule.ts](https://github.com/OHIF/Viewers/blob/master/extensions/cornerstone-dicom-seg/src/getToolbarModule.ts) disable with `No segmentations available` when the viewport has no representation |
| Refusal 2 | The same evaluator then disables with `Add segment to enable this tool` when the active segmentation has no segments |
| Other disabled cases | No tool group for the viewport, or the tool is not in the tool group — these are genuine incapability |
| Creation already exists | `createLabelmapForViewport` and `createContourForViewport` in [commandsModule.ts](https://github.com/OHIF/Viewers/blob/master/extensions/cornerstone/src/commandsModule.ts), both delegating to [createSegmentationForViewport.ts](https://github.com/OHIF/Viewers/blob/master/extensions/cornerstone/src/utils/createSegmentationForViewport.ts) |
| How creation is reached | Only from the panel's add control, via the `panelSegmentation.onSegmentationAdd` customization |
| Why refusal 2 exists | `createSegmentationForViewport` takes a `createInitialSegment` option and creates `{}` when it is not set, so the panel's add control produces a segmentation with no segments |

**The machinery is already there.** This proposal does not add a way to create a segmentation; it
calls the existing one from tool activation instead of from a button the user has to find.

## 4. Proposed change

```
Today                                   Proposed
─────                                   ────────
select Brush                            select Brush
  → disabled                              → resolve target for the viewport
    "No segmentations available"           → none found: create result set,
                                              segmentation, and segment 1
open panel, find add control              → set becomes the viewport's active set
  → segmentation created, no segments    → tool active
  → disabled                             draw
    "Add segment to enable this tool"
add segment
  → tool active
draw
```

## 5. Requirements

**CP-TOOLCREATE-1**
The system shall resolve a target for a result-creating tool when that tool is activated, per
`RS-TOOL-3`.

**CP-TOOLCREATE-2**
The system shall not disable a result-creating tool because the viewport holds no result set, no
member, or no component.

**CP-TOOLCREATE-3**
WHEN target resolution finds nothing suitable, the system shall create the result set, the member,
and the member's first component, using the existing creation path rather than a parallel one.

**CP-TOOLCREATE-4**
The system shall create the first component as part of creating the member, so that no second
refusal can occur between the two.

> **Note (CP-TOOLCREATE-4):** Concretely, the tool-driven path sets `createInitialSegment`. The
> panel's add control may keep its current behaviour; this requirement is about the path a tool
> takes.

**CP-TOOLCREATE-5**
WHEN a result set is created by tool activation, the system shall make it the active result set
for that viewport, per `RS-TOOL-18`.

**CP-TOOLCREATE-6**
WHEN a result-creating tool is activated a second time in the same viewport, the system shall
reuse the target created by the first activation and shall not create another.

**CP-TOOLCREATE-7**
The system shall continue to disable a tool where the viewport genuinely cannot support it —
no tool group, the tool absent from the tool group, or image data the tool's result type cannot
apply to — and shall state the reason.

**CP-TOOLCREATE-8**
The system shall give a tool-created result set the shared default name of `RS-TOOL-14`.

**CP-TOOLCREATE-9**
The system shall apply `CP-TOOLCREATE-1`..`CP-TOOLCREATE-8` to labelmap, contour, and annotation
tools alike.

**CP-TOOLCREATE-10**
The system shall retain the panel control that creates a result explicitly.

> **Note (CP-TOOLCREATE-10):** Automatic creation removes the *obligation* to visit the panel, not
> the ability to. A user who wants a second segmentation before drawing into it still needs a way
> to say so.

## 6. What this does not change

- The tools, their commands, their icons, and their behaviour once active.
- The panel's add control and the `panelSegmentation.onSegmentationAdd` customization.
- `createSegmentationForViewport` and its options; only the caller and the option it passes.
- The genuinely-incapable disabled cases, which stay (`CP-TOOLCREATE-7`).
- Any DICOM behaviour.

## 7. Incidental finding

While reading the evaluator: `evaluate.cornerstone.segmentation` checks `segmentations?.length`,
then dereferences `getActiveSegmentation(viewportId).segments` without a null check.
`getActiveSegmentation` can return `null`. Whether a viewport can hold representations with no
active segmentation has not been established, so this is reported rather than claimed as a live
defect — but the code path this proposal removes is the one that contains it, and it is worth a
deliberate look rather than an accidental fix.

## 8. Open items

1. **Should creation be announced?** `RS-TOOL-7` has the sidebar reveal the new member, which is
   feedback of a sort. Whether a user who did not ask for a result set should also be told one was
   made — and whether that becomes noise on every first stroke — is undecided.
2. **What the auto-created set is named.** `RS-TOOL-14` requires a shared default name but does not
   say what it is. "Untitled", the study description, the user's name, and the date all read
   differently in a saved `SeriesDescription` (`RS-SAVE-9a`).
3. **Undo of the creation.** If a user's first stroke creates a result set and they immediately
   undo, it is unclear whether the set should disappear with the stroke or persist as an empty set.
4. **Interaction with `RS-TOOL-6`.** Where more than one compatible result set exists and none is
   active, `RS-TOOL-6` prompts. That prompt on first tool use may be exactly the friction this
   proposal removes, or a necessary check — it depends on how often the ambiguous case arises once
   `CP-TOOLCREATE-5` keeps an active set assigned.

## 9. Verification

| Requirement | Verification |
| --- | --- |
| `CP-TOOLCREATE-1`..`CP-TOOLCREATE-5` | Playwright: open a study with no segmentation, select a labelmap tool, draw. Assert the tool was never disabled, and that a result set, a segmentation and segment 1 all exist afterwards. |
| `CP-TOOLCREATE-6` | The same test, second stroke: assert the count of result sets and members is unchanged. |
| `CP-TOOLCREATE-7` | Playwright: a viewport whose display set cannot carry the representation still shows the tool disabled, with a reason. |
| `CP-TOOLCREATE-8` | Draw a segmentation, a contour and an annotation without naming anything; assert one result set holds all three. |
| `CP-TOOLCREATE-9` | The first test, repeated per result type. |
| `CP-TOOLCREATE-10` | Playwright: the panel add control still creates a second result. |
| Regression | Existing segmentation end-to-end tests pass with their "add segmentation first" setup steps removed. |
