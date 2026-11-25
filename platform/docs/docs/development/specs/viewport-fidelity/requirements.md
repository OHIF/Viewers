---
sidebar_position: 1
sidebar_label: Requirements (EARS)
title: Viewport fidelity indicator — requirements
summary: A per-viewport indicator and detail view telling the user when the displayed image is not a faithful rendering of the stored pixel data, why, and whether it will improve.
---

# Viewport fidelity indicator — requirements

**Prefix:** `VF` (viewport fidelity), user requirement groups `VF-AUTO`, `VF-INFO`, `VF-VIS`,
`VF-DET`, `VF-CFG`, and `VF-LANG`.
**Source:** OHIF / FU Berlin Set-Aside — the funded task list, task **T6** (Aim 2.3, required).
**Depends on:** **T3** viewport fidelity state (Cornerstone3D), **T4** GPU class taxonomy, **T9**
capability-bound level binding, **T15** automatic level-selection policy, **T14** interactive
fidelity degradation.
**Design owner:** @dan-rukas — visual and UX design, and review of the user-facing wording. The
design notes are in [OHIF/Viewers#6255](https://github.com/OHIF/Viewers/issues/6255).
**Implementation owner:** @mbellehumeur.
**Status:** Draft. [OHIF/Viewers#6440](https://github.com/OHIF/Viewers/pull/6440) implements a
part of it. The [implementation specification](./implementation.md) holds the implementation
requirements, and its §8 lists which requirements are met.
**Affects:** `@ohif/extension-cornerstone`, `@cornerstonejs/core` (T3).

---

## 1. Purpose

When OHIF cannot render stored pixel data exactly as requested, it renders something else
instead: a decimated volume, a partially decoded image, a reduced output resolution, a coarser
sampling density, an approximated transform. Without an indicator, none of that is visible to
the user. The image simply looks the way it looks, and there is no way to tell a faithful
rendering from a substituted one.

This specification defines what the user must be able to determine about the fidelity of what
they are looking at, and requires a single consistent per-viewport affordance that lets them
determine it.

The choice of *what* to render is the system's, not the user's. An indicator exists precisely so
that the system can decide automatically and continuously without the user having to know or
configure anything — disclosing the cost when a decision had one. That premise is stated as
requirements in §4.1, because it is the constraint the previous decimated-views attempt
violated and the reason it failed.

> The motivating consequence is diagnostic, not aesthetic. A user who cannot distinguish
> "this lesion is small" from "this rendering discarded three quarters of the z-axis" is being
> asked to trust a picture whose provenance is hidden from them.

## 2. Scope

### 2.1 How to read this specification

This document states the **user requirements** (§4): what the user must be able to do,
determine, and rely on in order to work safely. A user requirement names no endpoint, class,
file, or algorithm. The [implementation specification](./implementation.md) states the
**implementation requirements**: how the work is done, or the recommended approach. Each
implementation requirement cites the user requirements that it satisfies.

You can change the implementation specification freely when a better approach appears. You
change this document in two cases only: a requirement describes the behaviour wrongly, or the
intended user-facing behaviour changes. An implementation that is inconvenient is never a reason
to change a user requirement.

### 2.2 In scope

- A per-viewport fidelity indicator, available whenever a fidelity difference exists.
- A detail view, reached from that indicator, answering the questions in §4.2.
- The position of the indicator relative to the other controls of the viewport.
- Configuration of the indicator's position, and of its removal.

### 2.3 Out of scope

- **DICOM source lossy compression.** The stored pixel data is the reference against which
  fidelity is judged, whatever its provenance. A lossy-compressed source rendered faithfully
  is full fidelity for this specification's purposes. `LossyImageCompression` (0028,2110) is
  therefore not an input.
- **Any user control that changes fidelity from the indicator.** The indicator is read-only.
  A separate settings surface (T5) may later be reachable from it; see §6 item 1.
- The GPU taxonomy, the level-binding, and the selection policy themselves — T4, T9, T15.
- Detection, prevention, or recovery from insufficient browser memory (excluded by T9).
- Study-list, series-thumbnail, and exported-artifact fidelity disclosure. See §6 item 3.
- **Fidelity of overlay layers** — a reduced-resolution segmentation labelmap, or an overlay
  rendered coarser than its reference image. Unfunded, and not achievable with the state
  available from T3. See §6 item 4.
- Brick formats and loaders, reduced-resolution loading from the original series, and
  vtk-wasm / WebGPU rendering paths — all excluded by the funded task list.

## 3. Definitions

**Fidelity.** The degree to which the pixels presented in a viewport faithfully render the
stored pixel data and the transforms declared for it. Reduced fidelity means the display
pipeline — retrieval, decode, resampling, GPU representation, transform application —
introduced a loss between the stored data and the screen.

> Concretely, fidelity here concerns losses in *pixel values and LUT transforms as displayed*.
> It is a property of the display, not of the DICOM. See §2.3 first bullet.

**Requested fidelity.** The representation the viewport would present if no capability,
performance, or loading constraint applied.

**Displayed fidelity.** The representation actually presented in the current frame.

**Fidelity difference.** Any case where displayed fidelity is below requested fidelity.

**Fidelity dimension.** The axis along which the loss was introduced: data resolution, display
(output) resolution, sampling density, decoded extent, pixel value quantisation, transform
approximation, or rendering path.

**Cause.** Why the loss was introduced: a device capability limit, a performance target, an
incomplete load, an irreversibly lossy decode, or a display issue.

**Display issue.** A case where the system cannot apply the metadata of an image, so the image
does not show as its metadata specifies. Examples: the metadata gives a VOI LUT function that the
system does not know, so the system uses a linear function; the rows or the columns of the
decoded image do not agree with the metadata. Waiting does not fix a display issue.

**Lossy display.** A viewport state in which a fidelity difference exists. Every fidelity
difference is a lossy display, whatever its dimension or cause.

**Transiently lossy.** Lossy now, and expected to stop being lossy without anything outside
the viewport changing — mid-load, or mid-interaction.

**Terminally lossy.** Lossy now, and not expected ever to stop being lossy for this data,
viewport and device. A load that completes without reaching full resolution is terminally
lossy, as is a representation decimated to fit a device limit, and an image with a display
issue.

**Formerly lossy.** Not lossy now, but lossy at some earlier point since the viewport began
displaying this data.

**Never lossy.** A viewport that has displayed data and has not been lossy at any point since.

**No data.** A viewport with nothing yet displayed. This is neither lossy nor lossless and
does not enter the fidelity state machine at all.

> The four lossiness states — transiently, terminally, formerly, never — are the whole model.
> They are defined by *lossiness over time*, not by severity and not by dimension. A volume
> decimated to fit a GPU texture limit and an image whose decode stopped at a lossy stage are
> both terminally lossy, and the user needs the same thing from both: the knowledge that this
> is as good as it will get.

**Viewport controls.** The buttons and menus drawn in the corners of a viewport, for example the
orientation menu and the window-level menu. They show only on the active viewport and on the
viewport under the pointer.

**Navigation bar.** The bar at the side of a viewport that shows the position in the stack and
the load progress, and that the user drags to move through the images.

---

## 4. User requirements

> Change these only if wrongly described, or if the intended user-facing behaviour is changing.

> **Altitude.** §4.2 states what the user must be able to *determine*. It deliberately does not
> say through which surface, in what order, or with what visual encoding — that is the
> implementation specification.

### 4.1 The system decides, not the user — `VF-AUTO`

> This group is the premise of the whole feature and is why the deliverable is an *indicator*
> rather than a control panel. It is a requirement, not a design preference.

**VF-AUTO-1**
WHERE the deployment enables lossy downsampling, the system shall select the fidelity at which a
viewport renders without requiring input from the user.

**VF-AUTO-2**
The system shall not require the user to understand resolution levels, texture limits, sampling
density, GPU classes, or any other low-level rendering parameter in order to view a study at
usable speed and quality.

**VF-AUTO-3**
The system shall not require the user to interact with the fidelity indicator in order to
obtain the best rendering feasible for their data, viewport and device.

**VF-AUTO-4**
WHERE the deployment enables lossy downsampling, IF full fidelity cannot be achieved, THEN the
system shall present the best feasible rendering without user intervention.

> Lossy downsampling is off by default (`config/default.js`). A deployment turns it on with
> `lossyDownsampling: { final: true }`, or with a GPU settings preset. Without it, a volume that
> exceeds the device limit is not reduced, and it can fail to render.

**VF-AUTO-5**
WHERE the user wishes to influence the trade-off between fidelity and speed, the system shall
accept a small number of high-level inputs rather than per-viewport low-level parameters.

> A performance target is a high-level input. A per-viewport resolution level is not.
> `VF-AUTO-5` is why the settings surface is a separate, deliberately small piece of work
> (T5) and why it lives in general settings rather than in this indicator — see §6 item 1.

**VF-AUTO-6**
The system shall not present the user with a choice they need renderer knowledge to answer.

> **Rationale for this group, and the reason it sits first.** The previous decimated-views
> implementation failed for exactly this reason: it made the user dictate the settings needed to
> view certain things quickly, which burdened them with detail they should never have had to
> hold. Users do not want to configure a renderer; they want to read a study. Any solution that
> answers "the image might be degraded" by handing the user controls has reproduced the
> original failure with more steps.
>
> The indicator is what makes automatic decision-making *acceptable* rather than opaque. The
> system decides, silently and continuously, and the indicator discloses when a decision cost
> the user something — so that trust does not depend on the user having configured anything.
> This is also the substantive reason the indicator is read-only (`VF-DET-9`): a detail view
> that offered fixes would drag the low-level detail back into the user's lap through the one
> affordance built to keep it out.

### 4.2 Information the user must be able to determine — `VF-INFO`

**VF-INFO-1**
The system shall enable the user to determine whether the image currently displayed in a
viewport is a faithful rendering of the stored pixel data.

**VF-INFO-2**
WHERE a fidelity difference exists, the system shall enable the user to determine each
fidelity dimension along which the displayed rendering differs from the requested one.

**VF-INFO-3**
WHERE a fidelity difference exists, the system shall enable the user to determine the
magnitude of the difference in each affected dimension, quantified rather than described.

> Quantified means a figure the user can reason about: per-axis decimation factors, a decoded
> byte or slice count, an output resolution percentage, a sampling-density ratio. "Reduced
> quality" does not satisfy this requirement.

**VF-INFO-4**
WHERE a fidelity difference exists, the system shall enable the user to determine the cause of
the difference.

**VF-INFO-5**
WHERE a fidelity difference exists, the system shall enable the user to determine whether the
display is transiently lossy or terminally lossy.

**VF-INFO-5a**
WHEN loading completes without the display having reached full fidelity, the system shall
enable the user to determine that the rendering is final and lossy.

> This is the case most likely to mislead. A progressive load that stalls at a lossy stage
> looks exactly like one that is still arriving, and the user's natural inference — "it will
> sharpen up in a moment" — is wrong. The transition from transiently to terminally lossy is
> therefore itself information the user needs, not merely a change of internal state.

**VF-INFO-6**
WHERE a fidelity difference exists, the system shall enable the user to determine whether
waiting is expected to improve the displayed rendering.

**VF-INFO-7**
WHERE a fidelity difference exists, the system shall enable the user to determine whether a
faithful rendering is reachable at all for the current data, viewport, and device.

> `VF-INFO-6` and `VF-INFO-7` are distinct. Waiting will not help a volume decimated to fit a
> GPU texture limit, but a faithful rendering may still be reachable on other hardware.
> Waiting will not help an irreversibly lossy decode either, and there a faithful rendering is
> not reachable at all. The user needs to tell those two apart.

**VF-INFO-8**
WHERE the displayed rendering is bound by a performance target, the system shall enable the
user to determine the operating point being held — the fidelity being given up and the
performance being bought with it.

> For example: output resolution at 50% in order to sustain 30 fps. This is the one piece of
> information that explains the trade-off as a choice rather than as a defect, and it is what
> makes the settings surface (T5) comprehensible if that stretch item is delivered.

**VF-INFO-9**
WHERE the display is formerly lossy, the system shall enable the user to determine that the
rendering they are now looking at is no longer lossy.

> Without this, a user who saw a warning during interaction or loading has no way to learn
> that it went away, and must assume the worst about every subsequent frame.

**VF-INFO-10**
The system shall express every item in this group in terms the user can act on without
knowledge of renderer implementation, GPU architecture, or retrieval-stage terminology.

**VF-INFO-11**
WHERE an image in a viewport has a display issue, the system shall present that viewport as
terminally lossy, and shall enable the user to determine each display issue, also WHILE another
cause makes the viewport lossy.

> Example: the metadata of an image gives an unknown VOI LUT function. The system shows the
> image with a linear function and the window of the metadata. The window is then not the
> window that the metadata specifies, and the user must be able to learn that. Cornerstone3D
> states the same rule as FIDELITY-STATE-13.

### 4.3 Availability and position of the indicator — `VF-VIS`

**VF-VIS-1**
WHILE a fidelity difference exists in a viewport, the system shall present a fidelity indicator
for that viewport.

**VF-VIS-1a**
WHILE a viewport has never been lossy, the system shall present no fidelity indicator for that
viewport.

**VF-VIS-1b**
The system shall not treat a viewport with no data displayed as lossy.

> Together with `VF-VIS-1a`, this means an unloaded or empty viewport shows nothing, and a
> viewport that loads straight to full fidelity shows nothing ever. The indicator's presence is
> itself information: it means something was, or is, lossy here.

**VF-VIS-1c**
WHEN a viewport ceases to be lossy, the system shall announce the recovered state for a brief
interval and then withdraw it.

**VF-VIS-1d**
WHILE a viewport is formerly lossy, the system shall keep the recovered state re-revealable on
demand at the indicator's location.

**VF-VIS-1e**
WHILE a viewport is formerly lossy, the system shall not persistently occupy image area to
report that state.

> `VF-VIS-1e` is a user requirement, not a cosmetic preference. Anything drawn over the image
> can hide a finding, and in mammography — and any study where the corners of the image carry
> diagnostic content — a permanently resident glyph is a real cost paid on every image to
> report something that is no longer wrong. The recovered state is therefore transient by
> requirement, and `VF-VIS-1d` is what keeps `VF-INFO-9` satisfiable after it withdraws.

> The consequence, accepted deliberately: a user not looking at that viewport during the
> announcement interval will not learn that it recovered unless they go looking. That is the
> right trade against occluding every image in every viewport for the life of the session.

**VF-VIS-2**
The system shall present the fidelity indicator without requiring the viewport to be the active
viewport.

**VF-VIS-3**
The system shall present the fidelity indicator without requiring pointer hover over the
viewport.

> `VF-VIS-2` and `VF-VIS-3` exist because the viewport controls show only on the active or
> hovered viewport. A fidelity indicator that is invisible unless hovered fails `VF-VIS-1` in
> precisely the steady state that matters.

**VF-VIS-4**
The system shall present fidelity per viewport, and shall not present it as a property of the
source volume or display set.

**VF-VIS-4a**
The system shall present the lossiness state of the image currently displayed in the viewport,
and shall not present the worst state observed across the display set.

> Lossiness history gates whether the indicator exists at all (`VF-VIS-1a`); it does not set
> the state shown. In a stack where early slices finished lossy, scrolling to a full-resolution
> slice reports recovered, and scrolling back reports terminally lossy again. A viewport-wide
> worst case would pin a large stack to red for the rest of the session after one bad slice —
> true, but useless, and it would make the indicator ignorable.

**VF-VIS-5**
WHERE more than one fidelity difference applies to a viewport simultaneously, the system shall
present a single indicator for that viewport.

**VF-VIS-5a**
WHERE a viewport shows more than one display set, the system shall present the lossiness state
of the worst display set. IF any display set is terminally lossy, THEN the system shall present
the terminally lossy state, also while another display set still loads. IF the system presents
that state WHILE another display set still loads, THEN the detail view shall state that other
data still loads.

> Example: a CT that loads next to a decimated PET shows the terminally lossy state.
> Cornerstone3D states the same rule as FIDELITY-STATE-12, and uses "data set" for a display
> set. The maintainer decided this rule on 2026-10-30.

**VF-VIS-6**
The system shall enable the indicator by default wherever Cornerstone viewports are rendered.

**VF-VIS-7**
The system shall reset a viewport's lossiness history WHEN the viewport begins displaying a
different display set.

> Zoom, pan, window/level, scrolling and layout changes do not reset it. A viewport that once
> showed a degraded series must not keep reporting on data it no longer displays.

**VF-VIS-8**
The system shall not require the user to discover the indicator in more than one place or form
across viewports, modes, or view kinds.

**VF-VIS-9**
The system shall present the indicator at the same position in a viewport whether or not the
viewport controls show.

> The indicator is a status, not a viewport control. The viewport controls come and go with the
> active and hovered viewport; a status stays where it is while it applies. An indicator that
> sits next to controls that are not there floats away from the corner in every inactive
> viewport.

**VF-VIS-10**
The system shall not let a viewport control cover the indicator, or the location that
re-reveals the recovered state (`VF-VIS-1d`), whatever number of viewport controls a mode or a
deployment adds.

**VF-VIS-11**
WHILE a viewport has never been lossy, the indicator shall take no space from the viewport
controls.

> The viewport controls move aside for the indicator only in a viewport that is or was lossy.
> In a viewport that was lossy, the space stays after the recovered state withdraws, so that
> `VF-VIS-10` holds for the location that re-reveals it.

**VF-VIS-12**
The system shall not let the indicator cover the navigation bar of the viewport.

> The user drags the navigation bar to move through the images. An indicator over the bar
> would hide the load progress and take the pointer from the bar.

### 4.4 The detail view — `VF-DET`

**VF-DET-1**
WHEN the user activates the fidelity indicator, the system shall present a detail view.

**VF-DET-2**
The detail view shall present the magnitude of the difference in each affected fidelity
dimension, satisfying `VF-INFO-3`.

**VF-DET-3**
The detail view shall present the cause of the difference, satisfying `VF-INFO-4`.

**VF-DET-4**
WHERE the displayed rendering is bound by a performance target, the detail view shall present
the operating point, satisfying `VF-INFO-8`.

**VF-DET-5**
The detail view shall distinguish a transiently lossy display from a terminally lossy one,
satisfying `VF-INFO-5`.

**VF-DET-6**
The detail view shall state whether waiting is expected to improve the rendering, satisfying
`VF-INFO-6`.

**VF-DET-7**
WHERE the operating point presented under `VF-DET-4` derives from a previous measurement rather
than the current frame, the detail view shall indicate that it is a previous measurement.

> Interactive performance figures are most useful when interaction has stopped, which is
> exactly when they are no longer being measured. Presenting a stale figure as live invites the
> user to chase a number that will not move.

**VF-DET-8**
The detail view shall remain open and continue to update WHILE the underlying fidelity state
changes.

**VF-DET-9**
The detail view shall be read-only with respect to fidelity.

> See §6 item 1 for the separate settings surface it may later link to.

**VF-DET-10**
WHERE a viewport has a display issue, the detail view shall present each display issue,
satisfying `VF-INFO-11`.

### 4.5 Removal and its consequence — `VF-CFG`

**VF-CFG-1**
The system shall allow a deployment to remove the indicator by configuration.

**VF-CFG-2**
The documentation for the configuration that removes the indicator shall state the consequence
of removing it.

> Removal is permitted because T6 is a product requirement rather than a regulatory one, and
> deployments own their own risk posture. It is documented as a warning because a deployment
> that removes it is choosing to show users substituted pixels with no disclosure, and whoever
> writes that config line should have to read that sentence first.

**VF-CFG-3**
The system shall allow a deployment to move the indicator to another position by configuration,
alongside the other overlay text of the viewport.

### 4.6 Language — `VF-LANG`

**VF-LANG-1**
The system shall label the indicator and every element of the detail view in user-oriented
terms, satisfying `VF-INFO-10`.

**VF-LANG-2**
The system shall provide help text for each fidelity dimension and cause it presents.

**VF-LANG-3**
The system shall not require the user to distinguish "data resolution" from "display
resolution" in order to understand whether the image can be trusted.

> The distinction matters to the renderer and to the settings surface. It should not be the
> first thing the user has to learn in order to answer `VF-INFO-1`.

**VF-LANG-4**
The system shall present all user-facing fidelity text through the translation layer.

---

## 5. What this does not change

- Existing loading and progress affordances keep their present responsibilities. The
  navigation bar and the loading indicators continue to answer "how far along is this load".
  The fidelity indicator answers "can I trust what I am seeing yet". The detail view is the
  single place the two are reconciled, per `VF-DET-6`.
- Hanging protocols, measurement, and segmentation behaviour.

---

## 6. Open items

1. **Settings surface reachable from the indicator.** The indicator is read-only
   (`VF-DET-9`). Quality and GPU settings are a separate piece of the overall work — T5 — and
   may later be reachable by click-through from the detail view. Not part of the fidelity
   indicator now. Whatever that surface becomes, `VF-AUTO-5` binds it: a small number of
   high-level inputs, not per-viewport low-level parameters. **Deferred by decision.**

2. **Whether `DisplaySetMessage` migrates onto the same registry.** See the implementation
   specification, `VF-VOCAB`. **Closed — not now, deliberately.**

3. **Series-panel and study-list disclosure.** Out of scope per §2.3, and noted as a known gap:
   a user cannot currently learn that a series will render degraded before opening it.
   **Deferred, not planned.**

4. **Fidelity of overlay layers.** A reduced-resolution segmentation labelmap is arguably the
   most consequential case, since a labelmap boundary is read as a measurement. Unfunded, and
   not achievable with the state T3 delivers. **Closed — acknowledged gap.**

5. **Companion design document.** The design rationale from @dan-rukas (OHIF/Viewers#6255, and
   the placement review of OHIF/Viewers#6440) goes into a `design.md` next to this document.
   **Open — action, not a decision.**

6. **How the recovered state is discovered.** The recovered state is a one-second announcement
   over an otherwise unmarked image, re-revealable by hovering a location that is invisible
   while nothing is drawn. Whether one second is long enough to notice, and how a user learns
   the location exists, are unresolved. **Unresolved — @dan-rukas.**

7. **Are the transiently lossy and terminally lossy states distinguishable enough?** They
   differ only in whether waiting helps, and the image gives the user no independent clue.
   **Unresolved — @dan-rukas.**

---

## 7. Traceability

| Requirement group | Anchored in |
|---|---|
| `VF-AUTO` | T15 (automatic, deterministic selection policy); T6 bullet 5; prior failure of the decimated-views approach |
| `VF-INFO` | T6 bullets 2 and 5; T3 bullets 2 and 3; Cornerstone3D FIDELITY-STATE-13 (`VF-INFO-11`) |
| `VF-VIS` | T6 bullets 1 and 4; T3 bullet 4; the placement review of OHIF/Viewers#6440 (`VF-VIS-9` to `VF-VIS-12`) |
| `VF-DET` | T6 bullet 2; T9 final bullet; T14 final bullet |
| `VF-CFG` | T6 bullet 1 |
| `VF-LANG` | T6 bullet 5 |

The funded task list stays the authority for task inclusion, priority, and effort.

## 8. Verification approach

| Requirement group | Primary verification |
|---|---|
| `VF-AUTO` | E2E: a study on a capability-constrained fixture renders usably with no user input and no settings visited; review that no user-facing choice requires renderer knowledge |
| `VF-INFO` | Detail-view content assertions against fixture fidelity states, one per dimension and cause, and one per display issue |
| `VF-VIS` | E2E: indicator present in a non-active, non-hovered viewport with a degraded fixture; default-on across modes; not covered by an added viewport control; clear of the navigation bar |
| `VF-DET` | E2E: activate indicator, assert all sections; assert live update while open |
| `VF-CFG` | Unit: removal and move by configuration; documentation review for the consequence statement |
| `VF-LANG` | Review against `VF-INFO-10`; no renderer terms in user-visible strings; all strings translated |
