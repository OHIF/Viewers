---
sidebar_position: 2
sidebar_label: Implementation
title: Viewport fidelity indicator — implementation requirements
summary: How OHIF implements the viewport fidelity indicator — the state source, the reason vocabulary, the registration and placement in the viewport, the visual design, the Cornerstone3D scope, the documentation, and the status of each requirement.
---

# Viewport fidelity indicator — implementation requirements

**Prefix:** `VF` (viewport fidelity), implementation requirement groups `VF-STATE`, `VF-VOCAB`,
`VF-REG`, `VF-UX`, `VF-CS3D`, and `VF-DOC`.
**User requirements:** [Viewport fidelity indicator — requirements](./requirements.md).
**Status:** Draft. This is the recommended approach, and it can change. §8 records what
[OHIF/Viewers#6440](https://github.com/OHIF/Viewers/pull/6440) implements.

---

## 1. Scope

This document states the **implementation requirements** of the viewport fidelity indicator: how
the work is done, or the recommended approach. Each requirement cites the user requirements of
the [requirements specification](./requirements.md) that it satisfies. The definitions of that
document apply here.

You can change this document freely when a better approach appears. Cite the user requirements
that each change continues to satisfy. A change that needs a change of a user requirement goes
into the requirements specification first, under the change rule of that document.

The code is in `@ohif/extension-cornerstone`:

- `hooks/useViewportFidelity.ts` — the state source and the lossiness history.
- `components/FidelityIndicator/` — the indicator and its tooltip (Tailwind classes, no CSS file).
- `components/OHIFViewportActionCorners.tsx` — the placement in the top-right action corner.

## 2. State source and update — `VF-STATE`

**VF-STATE-1**
The system shall derive presented fidelity from the per-viewport fidelity state provided by
Cornerstone3D under T3, and shall not infer it independently from display-set metadata.
Satisfies `VF-INFO-1`, `VF-VIS-4`.

**VF-STATE-2**
WHEN the per-viewport fidelity state changes, the system shall update the indicator and any
open detail view without requiring a study reload. Satisfies `VF-VIS-1`, `VF-DET-8`.

**VF-STATE-3**
The system shall subscribe to viewport fidelity events (`VIEWPORT_FIDELITY_CHANGED`) rather than
polling the viewport, and shall read `getFidelityState()` once when it subscribes.
Satisfies `VF-VIS-1`.

> House convention: services publish, consumers subscribe.

**VF-STATE-4**
IF the fidelity state reports a dimension or cause the running OHIF build does not recognise,
THEN the system shall present the difference generically rather than suppressing it or failing
to render. Satisfies `VF-VIS-1`, `VF-INFO-4`.

> A Cornerstone3D version carrying a new fidelity reason must not be able to blank the
> indicator or throw inside an overlay. Unknown means "something reduced fidelity here, details
> unavailable".

**VF-STATE-5**
The system shall render transient interaction differences from live state without debouncing,
relying on the visual register of §5 rather than on suppression to keep them unobtrusive.
Satisfies `VF-INFO-5`, `VF-INFO-9`.

> T14 degrades fidelity every frame during rotate, zoom and pan, by design. T11 and T18 read
> the same state programmatically. Debouncing in the presentation layer would hide exactly the
> signal `VF-INFO-9` exists to close out.

**VF-STATE-6**
The system shall keep the lossiness history (never lossy, formerly lossy) per viewport in OHIF,
and shall reset it WHEN the background display set of the viewport changes.
Satisfies `VF-VIS-1a`, `VF-VIS-7`.

**VF-STATE-7**
The system shall hold the recovered presentation for about one second
(`FIDELITY_RECOVERED_HOLD_MS`), and shall then keep an invisible hover target that re-reveals it.
Satisfies `VF-VIS-1c`, `VF-VIS-1d`, `VF-VIS-1e`.

## 3. Fidelity reason vocabulary — `VF-VOCAB`

**VF-VOCAB-1**
The system shall represent each fidelity reason as a member of an extensible, type-safe set of
string keys rather than as a closed enumeration. Satisfies `VF-INFO-4`, `VF-LANG-4`.

**VF-VOCAB-2**
The system shall associate each fidelity reason key with a parameterised translation string and
with the typed arguments that string interpolates. Satisfies `VF-INFO-3`, `VF-LANG-4`.

**VF-VOCAB-3**
The system shall allow an extension to register a new fidelity reason key, its arguments, and
its translation without modification to core. Satisfies `VF-INFO-4`.

**VF-VOCAB-4**
The system shall follow the `AppTypes` declaration-merged registry idiom established by
`AppTypes.Customizations` rather than introducing a new one.

> The precedent is the trio of `platform/core/src/types/AppTypes.ts` (seeded, documented
> registry interface), `CustomizationService.ts` (a
> `<K extends keyof AppTypes.Customizations>` lookup overload with a loose-string fallback
> signature), and `CustomizationService/types.ts` (a mapped write type with an index-signature
> escape hatch). `AppTypes.CustomizationUpdateCommands` is the smaller "key → typed argument
> object" variant and the closer structural match; note its load-bearing `Partial`.
> Applied here the shape falls out as an `AppTypes.FidelityIssues` registry of
> `key → argument object`, with the renderer calling `t(key, args)`.

**VF-VOCAB-5**
The system shall forward each fidelity reason's arguments to the translation call that renders
it. Satisfies `VF-INFO-3`.

> `DisplaySetMessage` is the existing untyped version of this same pattern — a closed set of
> numeric codes with an `args: Record<string, any>` bag — and `DisplaySetMessageListTooltip.tsx`
> renders `t(message.id)` without forwarding `message.args`. `VF-VOCAB-1` through `VF-VOCAB-5`
> exist to not repeat that. Migrating `DisplaySetMessage` onto the same registry is not in
> scope (requirements §6 item 2).

**VF-VOCAB-6**
The system shall obtain argument type safety from the registry rather than from the translation
layer.

> There is no i18n type safety in the repository: no `declare module 'i18next'`, no
> `CustomTypeOptions`, no typed `resources`.

> The existing per-image `ImageQualityStatus` enum is internal to progressive image loading and
> is **not** this vocabulary.

## 4. Registration and placement — `VF-REG`

**VF-REG-1**
The system shall render the indicator as the last item of the top-right viewport action corner
(`ViewportActionCorners.TopRight` in `OHIFViewportActionCorners.tsx`). The indicator shall render
independently of hover and active state; only the toolbar buttons of each corner render while
the viewport is hovered or active. Satisfies `VF-VIS-2`, `VF-VIS-3`, `VF-VIS-9`.

**VF-REG-2**
The indicator shall be the rightmost item of the flex row of the corner, so that the toolbar
buttons of the corner sit to its left and never cover it or its hover target. Satisfies
`VF-VIS-10`.

> The indicator draws nothing in a never-lossy viewport, so it takes no space there
> (`VF-VIS-11`). In a viewport that is or was lossy, the glyph (24px) or the idle hover target
> (12px) keeps its place in the row.

**VF-REG-3**
The system shall not require a mode to enumerate the indicator in order to receive it.
Satisfies `VF-VIS-6`, `VF-VIS-8`.

> The indicator is not a toolbar button: modes replace the `viewportActionMenu.*` lists, and a
> button would also render only on hover.

**VF-REG-4**
The indicator shall obtain the image identity it reports on from the viewport rather than from
component props. Satisfies `VF-VIS-4a`.

**VF-REG-5**
After OHIF/Viewers#6452 (`Replaceable`) merges, the system shall make the indicator replaceable
as `components.fidelityIndicator`: removal, the display mode, and a different design. Until then,
no configuration changes the indicator. Satisfies `VF-CFG-1`, `VF-CFG-3`, `VF-UX-1`.

> A move to a different corner needs a small replacement component at first. A later
> `Replaceable` feature (add children to an existing component by reference) makes the move
> configuration only. That feature also needs `ViewportActionCorners` to accept more than one
> registration for each corner; today the last registration wins.

**VF-REG-6**
The action corners render for every viewport, also with `customViewportProps.hideOverlays` (the
3D viewport of `main3D` and `fourUp`), so the indicator needs no special path there.
Satisfies `VF-VIS-6`, `VF-VIS-8`.

**VF-REG-7**
The top-right action corner shall keep the `right-viewport-scrollbar` offset (24px), which is
wider than the navigation bar (11px track and 5px padding on each side, 21px in total).
Satisfies `VF-VIS-12`.

> Measured on OHIF/Viewers#6440 in a 424px MPR viewport: indicator right edge 24px from the
> viewport edge, navigation bar 21px wide, 3px clear.

**VF-REG-8**
The system shall turn off the Cornerstone3D built-in indicator
(`dangerouslyDisableFidelityIndicator: true`), so that only one indicator shows, and so that its
z-index does not cover the OHIF menus. Satisfies `VF-VIS-5`, `VF-VIS-8`.

## 5. Visual design — `VF-UX`

> Design owner: @dan-rukas. This group records what is built and the open design latitude.
> Requirements §6 items 6 and 7 hold the open design questions.

**VF-UX-1**
The indicator shall support three display modes with its `display` prop: `icon` (default),
`text`, and `both`. The tooltip and the accessible name always carry the words.
Satisfies `VF-LANG-1`, `VF-LANG-4`.

**VF-UX-2**
In the `icon` and `both` modes, the system shall show the yellow `StatusWarning` glyph while the
viewport is transiently or terminally lossy, and the green `StatusSuccess` glyph
(`text-green-500`) for the recovered hold and its hover reveal. Satisfies `VF-VIS-1`,
`VF-VIS-1c`, `VF-VIS-1d`, `VF-INFO-9`.

> The first design suggested yellow for transiently lossy and red for terminally lossy. The
> build uses one yellow glyph for both, and the label, the accessible name, and the tooltip
> carry the difference. Requirements §6 item 7 holds the question.

**VF-UX-3**
The labels shall be `Transient Low Fidelity`, `Low Fidelity`, and `Full Fidelity`, through the
`FidelityIndicator` i18n namespace. Satisfies `VF-LANG-1`, `VF-LANG-4`.

**VF-UX-4**
The detail view shall present, in this order: the amount of degradation (`VF-DET-2`), the
reason (`VF-DET-3`, `VF-DET-10`), and the interactive performance (`VF-DET-4`, `VF-DET-7`).

> Examples: `Decimated volume x/2, y/2, z/4`; `This GPU only supports textures up to <n>`;
> `Output resolution 50% to maintain 30 fps`.

**Open design latitude:** the exact colours and their accessibility treatment, the
detail-view container (popover versus dialog), behaviour at small viewport sizes, the length of
the recovered hold, and the grouping of causes into user-facing language.

## 6. Cornerstone3D scope — `VF-CS3D`

> Cornerstone3D implements these in `@cornerstonejs/core` (the viewport fidelity specification
> `packages/docs/docs/specs/core/viewport-fidelity.md` of that repository).

**VF-CS3D-1**
Cornerstone3D shall provide a defined interface representing viewport fidelity information
(`ViewportFidelityState`, `getFidelityState()`). Satisfies `VF-INFO-1`.

**VF-CS3D-2**
Cornerstone3D shall emit viewport events when fidelity information changes
(`VIEWPORT_FIDELITY_CHANGED`). Satisfies `VF-VIS-1`.

**VF-CS3D-3**
The fidelity information shall carry, separately, the cause, the quantified magnitude, and
whether the difference is transient or standing. Satisfies `VF-INFO-2` to `VF-INFO-5`.

> "Transient or standing" maps onto the user-facing model as transient → transiently lossy,
> standing → terminally lossy. The formerly-lossy and never-lossy states are OHIF-side
> derivations (`VF-STATE-6`).

**VF-CS3D-4**
The fidelity information shall list each display issue (`issues`, with a `code` and a message),
and shall report the cause `displayIssue` when no other cause applies. Satisfies `VF-INFO-11`.

> Cornerstone3D added this in cornerstonejs/cornerstone3D#3008 (FIDELITY-STATE-13), released in
> `@cornerstonejs/core` 5.19.7.

**VF-CS3D-5**
The fidelity information shall be readable programmatically without going through a user
interface. Satisfies `VF-INFO-1`.

**VF-CS3D-6**
Cornerstone3D shall retain the existing `ImageQualityStatus` enum and its consumers unchanged.

## 7. Documentation — `VF-DOC`

**VF-DOC-1**
The delivered work shall update these two specifications to describe what was actually built.

**VF-DOC-2**
The public API surface introduced by `VF-VOCAB` shall be documented, including how an extension
registers a new fidelity reason, its arguments, and its translation.

**VF-DOC-3**
The configuration surface shall be documented, covering the display mode, moving the indicator,
and removing it, in `specificCustomizations.md`, when `VF-REG-5` adds the configuration. Satisfies `VF-CFG-1`, `VF-CFG-3`.

**VF-DOC-4**
The documentation for the configuration that removes the indicator shall state the consequence
of removing it. Satisfies `VF-CFG-2`.

**VF-DOC-5**
The user-visible behaviour shall be documented, including the lossiness states and the
transitions between them.

**VF-DOC-6**
The known limitations shall be documented:

- The recovered state is announced for about a second and then withdrawn, so a user not
  looking at that viewport will not see it (`VF-VIS-1c`).
- The state reported is that of the image currently displayed, not the worst across the display
  set, so scrolling past a terminally lossy slice can be missed (`VF-VIS-4a`).
- Fidelity of overlay layers, including segmentation labelmaps, is not reported.
- Fidelity is not disclosed in the series panel, the study list, or exported artifacts.
- The DICOM source's own lossy compression is not reported, by design.

## 8. Status of the implementation

OHIF/Viewers#6440 implements the indicator. This table lists the requirements that it does not
meet yet.

| Requirement | Status in #6440 |
|---|---|
| `VF-DET-1` to `VF-DET-10`, `VF-UX-4` | Not met. The indicator has a hover tooltip with the state, one cause line, and the display issue messages. Activation opens no detail view. The magnitude, the operating point, and the "still loading" note of `VF-VIS-5a` are not shown. |
| `VF-INFO-2`, `VF-INFO-3`, `VF-INFO-7`, `VF-INFO-8` | Not met. They depend on the detail view. |
| `VF-VOCAB-1` to `VF-VOCAB-6`, `VF-DOC-2` | Not met. The causes map to fixed i18n keys in `FidelityIndicator.tsx`, and an unknown cause shows a generic text (`VF-STATE-4`). |
| `VF-LANG-2` | Not met. No help text for each cause. |
| `VF-LANG-4` | Partly met. The display issue messages come from Cornerstone3D in English, and do not pass through the translation layer. |
| `VF-VIS-1d` in the `text` mode | Not met. The `text` mode keeps no hover target after the recovered hold. |
| `VF-CFG-1`, `VF-CFG-2`, `VF-DOC-3`, `VF-DOC-4` | Not met. No configuration removes the indicator. `VF-REG-5` adds removal with `Replaceable` (OHIF/Viewers#6452). |
| `VF-CFG-3` | Not met. `VF-REG-5`: first a small replacement component, then configuration only. |
| `VF-UX-1` (`text` and `both` modes) | Partly met. The modes exist as the `display` prop, and no configuration sets the prop until `VF-REG-5`. |
| `VF-UX-2` (red for terminally lossy) | Changed by design: one yellow glyph. Requirements §6 item 7. |
