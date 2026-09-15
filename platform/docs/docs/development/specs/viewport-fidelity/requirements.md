---
sidebar_position: 1
sidebar_label: Requirements (EARS)
title: Viewport fidelity indicator — requirements
summary: A per-viewport indicator and detail view telling the user when the displayed image is not a faithful rendering of the stored pixel data, why, and whether it will improve.
---

# Viewport fidelity indicator — requirements

**Prefix:** `VF` (viewport fidelity) — *proposed, not yet reserved in the specification register.*
**Source:** OHIF / FU Berlin Set-Aside — Final Acceptance Criteria, task **T6** (Aim 2.3, required).
**Depends on:** **T3** viewport fidelity state (Cornerstone3D), **T4** GPU class taxonomy, **T9** capability-bound level binding, **T15** automatic level-selection policy, **T14** interactive fidelity degradation.
**Design owner:** @dan-rukas — visual and UX design (§5.4), plus review of and edits to user-facing wording.
**Implementation owner:** @mbellehumeur — OHIF implementation (§5.1–§5.3) and the Cornerstone3D work (§5.5).
**Status:** Draft. §4 under review; §5 is the recommended approach and is expected to change.
**Affects:** `@ohif/extension-cornerstone`, `@ohif/extension-default`, `@cornerstonejs/core` (T3).

---

## 1. Purpose

When OHIF cannot render stored pixel data exactly as requested, it renders something else
instead: a decimated volume, a partially decoded image, a reduced output resolution, a coarser
sampling density, an approximated transform. Today none of that is visible to the user. The
image simply looks the way it looks, and there is no way to tell a faithful rendering from a
substituted one.

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

§4 states **user requirements**: what the user must be able to do, determine, and rely on in
order to work safely. §5 states **implementation requirements**: how that is to be achieved, or
the recommended approach where latitude remains.

The distinction is deliberate and load-bearing. §5 may be changed freely as the work proceeds
and as better approaches emerge. §4 should be changed only if a requirement was described
wrongly, or if the intended user-facing behaviour itself is changing — not because §4 turned
out to be inconvenient to implement.

> This two-section split is the **preferred convention for specifications in this register**,
> not a one-off for this document. It is recorded as such in the register's own conventions and
> in the repository's agent guidance. Existing specifications written before it are not
> retrofitted as part of this work.

### 2.2 In scope

- A per-viewport fidelity indicator, available whenever a fidelity difference exists.
- A detail view, reached from that indicator, answering the questions in §4.2.
- Consumption of the Cornerstone3D per-viewport fidelity state delivered by T3.
- The Cornerstone3D fidelity interface, viewport events, and example implementations
  described in §5.5.
- Configuration of the indicator's position, and of its removal.

### 2.3 Out of scope

- **DICOM source lossy compression.** The stored pixel data is the reference against which
  fidelity is judged, whatever its provenance. A lossy-compressed source rendered faithfully
  is full fidelity for this specification's purposes. `LossyImageCompression` (0028,2110) and
  the unused `getCompression()` helper at
  `extensions/cornerstone/src/Viewport/Overlays/utils.ts:52-64` are therefore not inputs.
- **Any user control that changes fidelity from the indicator.** The indicator is read-only.
  A separate settings surface (T5) may later be reachable from it; see §7 item 1.
- The GPU taxonomy, the level-binding, and the selection policy themselves — T4, T9, T15.
- Detection, prevention, or recovery from insufficient browser memory (excluded by T9).
- Study-list, series-thumbnail, and exported-artifact fidelity disclosure. See §7 item 3.
- **Fidelity of overlay layers** — a reduced-resolution segmentation labelmap, or an overlay
  rendered coarser than its reference image. Unfunded, and not achievable with the state
  available from T3. See §7 item 4.
- Brick formats and loaders, reduced-resolution loading from the original series, and
  vtk-wasm / WebGPU rendering paths — all excluded by the acceptance criteria.

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
incomplete load, or an irreversibly lossy decode.

**Lossy display.** A viewport state in which a fidelity difference exists. Every fidelity
difference is a lossy display, whatever its dimension or cause.

**Transiently lossy.** Lossy now, and expected to stop being lossy without anything outside
the viewport changing — mid-load, or mid-interaction.

**Terminally lossy.** Lossy now, and not expected ever to stop being lossy for this data,
viewport and device. A load that completes without reaching full resolution is terminally
lossy, as is a representation decimated to fit a device limit.

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

---

## 4. User requirements

> Change these only if wrongly described, or if the intended user-facing behaviour is changing.

> **Altitude.** §4.2 states what the user must be able to *determine*. It deliberately does not
> say through which surface, in what order, or with what visual encoding — that is §5.

### 4.1 The system decides, not the user — `VF-AUTO`

> This group is the premise of the whole feature and is why the deliverable is an *indicator*
> rather than a control panel. It is a requirement, not a design preference.

**VF-AUTO-1**
The system shall select the fidelity at which a viewport renders without requiring input from
the user.

**VF-AUTO-2**
The system shall not require the user to understand resolution levels, texture limits, sampling
density, GPU classes, or any other low-level rendering parameter in order to view a study at
usable speed and quality.

**VF-AUTO-3**
The system shall not require the user to interact with the fidelity indicator in order to
obtain the best rendering feasible for their data, viewport and device.

**VF-AUTO-4**
IF full fidelity cannot be achieved, THEN the system shall present the best feasible rendering
without user intervention.

**VF-AUTO-5**
WHERE the user wishes to influence the trade-off between fidelity and speed, the system shall
accept a small number of high-level inputs rather than per-viewport low-level parameters.

> A performance target is a high-level input. A per-viewport resolution level is not.
> `VF-AUTO-5` is why the settings surface is a separate, deliberately small piece of work
> (T5) and why it lives in general settings rather than in this indicator — see §7 item 1.

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

### 4.3 Availability of the indicator — `VF-VIS`

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

> `VF-VIS-2` and `VF-VIS-3` exist because the established badge route
> (`viewportActionMenu.*`) renders only when `isHovered || isActive`. A fidelity indicator that
> is invisible unless hovered fails `VF-VIS-1` in precisely the steady state that matters.

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

> See §7 item 1 for the separate settings surface it may later link to.

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

## 5. Implementation requirements

> The recommended approach. Expected to change as the work proceeds; changing it does not
> require revisiting §4.

### 5.1 State source and update — `VF-STATE`

**VF-STATE-1**
The system shall derive presented fidelity from the per-viewport fidelity state provided by
Cornerstone3D under T3, and shall not infer it independently from display-set metadata.

**VF-STATE-2**
WHEN the per-viewport fidelity state changes, the system shall update the indicator and any
open detail view without requiring a study reload.

**VF-STATE-3**
The system shall subscribe to viewport fidelity events rather than polling the viewport.

> House convention: services publish, consumers subscribe.

**VF-STATE-4**
IF the fidelity state reports a dimension or cause the running OHIF build does not recognise,
THEN the system shall present the difference generically rather than suppressing it or failing
to render.

> A Cornerstone3D version carrying a new fidelity reason must not be able to blank the
> indicator or throw inside an overlay. Unknown means "something reduced fidelity here, details
> unavailable".

**VF-STATE-5**
The system shall render transient interaction differences from live state without debouncing,
relying on the visual register of §5.4 rather than on suppression to keep them unobtrusive.

> T14 degrades fidelity every frame during rotate, zoom and pan, by design. T11 and T18 read
> the same state programmatically. Debouncing in the presentation layer would hide exactly the
> signal `VF-INFO-9` exists to close out.

### 5.2 Fidelity reason vocabulary — `VF-VOCAB`

**VF-VOCAB-1**
The system shall represent each fidelity reason as a member of an extensible, type-safe set of
string keys rather than as a closed enumeration.

**VF-VOCAB-2**
The system shall associate each fidelity reason key with a parameterised translation string and
with the typed arguments that string interpolates.

**VF-VOCAB-3**
The system shall allow an extension to register a new fidelity reason key, its arguments, and
its translation without modification to core.

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
it.

> This is not a hypothetical failure. `DisplaySetMessage` is the existing untyped version of
> this same pattern — a closed set of codes with an `args: Record<string, any>` bag and i18n
> strings keyed by code — and it fails twice over.
> `DisplaySetMessageListTooltip.tsx:50` renders `t(message.id)` without forwarding
> `message.args`, so the one parameterised string in `Messages.json` can never interpolate; and
> no call site passes `args` at all. Its codes are also *numeric*, which closes the set by
> construction: a third-party extension has no safe value to pick. `VF-VOCAB-1` through
> `VF-VOCAB-5` exist to not repeat any of that.

**VF-VOCAB-6**
The system shall obtain argument type safety from the registry rather than from the translation
layer.

> There is no i18n type safety in the repository today: no `declare module 'i18next'`, no
> `CustomTypeOptions`, no typed `resources`. Translation keys and interpolation parameters are
> entirely unchecked, so the registry is the only place the guarantee can come from.

> Rationale for the whole group: the reason vocabulary will grow as T4, T9, T14 and T15 land,
> and each reason needs a different sentence with different numbers in it — per-axis decimation
> factors, a texture limit, a frame-rate target. A closed enum forces a combinatorial copy
> table and a core change per addition; keys carrying typed arguments into parameterised
> translations give both `VF-INFO-3` and `VF-LANG-4` for free.

> The existing per-image `ImageQualityStatus` enum (`FAR_REPLICATE`, `ADJACENT_REPLICATE`,
> `SUBRESOLUTION`, `LOSSY`, `FULL_RESOLUTION`) is internal to progressive image loading and is
> **not** this vocabulary. It continues to exist unchanged; the viewport fidelity state may draw
> on it as one input among several.

### 5.3 Registration and placement — `VF-REG`

**VF-REG-1**
The system shall register the indicator through a viewport surface that renders independently
of hover and active state, satisfying `VF-VIS-2` and `VF-VIS-3`.

> The `viewportOverlay.*` customization surface satisfies this;
> `viewportActionMenu.*` does not, being gated on `isHovered || isActive` in
> `OHIFViewportActionCorners.tsx`.

**VF-REG-2**
The system shall allow a deployment to reposition the indicator by configuration, alongside the
other overlay items.

**VF-REG-3**
The system shall not require a mode to enumerate the indicator in order to receive it.

> Six separate toolbar customisations and mode definitions currently repeat the
> `viewportActionMenu.topRight` list. An indicator that must be added to each of them will be
> missing from some of them.

**VF-REG-4**
The indicator shall obtain the image identity it reports on from the viewport rather than from
overlay item props.

> `CustomizableViewportOverlay` does not pass `imageId` to overlay items.

### 5.4 Suggested visual design — `VF-UX`

> Requester's suggestion, and @dan-rukas's to revise. Subordinate to §4 throughout.

An icon inside the demographics overlay region, registered per §5.3 so that a deployment can
move it by configuration.

**State encoding.** The colours encode lossiness over time, not severity:

| Lossiness state | Encoding | Meaning to the user |
|---|---|---|
| Never lossy | *No indicator* | Nothing has been lost here. |
| No data | *No indicator* | Nothing displayed yet; not a fidelity question. |
| Transiently lossy | Yellow | Lossy right now, and expected to improve. |
| Terminally lossy | Red | Lossy right now, and this is as good as it gets. |
| Formerly lossy | Green | Was lossy; is not any more. |

Transitions that follow from this, worked through for the default progressive configuration:

- A study opens: no data, no indicator. Pixels arrive at a sub-resolution stage: yellow.
  Loading completes at full resolution: green. Green fades per the rule below.
- Loading completes *without* reaching full resolution: yellow → **red**, satisfying
  `VF-INFO-5a`. This transition is the one the user most needs to notice.
- Interaction begins on a settled viewport: green or nothing → yellow. Interaction settles and
  the finest feasible representation is reached: → green.
- Interaction settles but the device cannot render the full representation at all: → red.

Green is never resident. It is shown for approximately one second when the display ceases to be
lossy, then withdrawn entirely, leaving no mark over the image (`VF-VIS-1c`, `VF-VIS-1e`).
Hovering the indicator's location without clicking re-reveals it, and it withdraws again a
second later (`VF-VIS-1d`).

> This makes the recovered state genuinely easy to miss, and that is the accepted trade. The
> alternative — a resident glyph, however muted — puts a permanent mark over every image in
> every viewport that ever loaded progressively, which under the default retrieval
> configuration is all of them. On a mammogram, where the corners of the image carry findings,
> that cost is paid on the diagnostic content itself. A one-second announcement over an image
> that is *no longer degraded* is the cheaper error.

> Design consequence for @dan-rukas: the hover target has to exist while nothing is drawn
> there. Where that target lives, and how a user learns it is there at all, is an open problem
> — §7 item 6.

> The consequence worth noting for design: red and yellow differ only in whether waiting will
> help, and they will often look identical on screen. The whole burden of distinguishing "still
> arriving" from "permanently degraded" falls on this one encoding, since the image itself gives
> the user no clue. That argues for making red and yellow maximally distinguishable — shape or
> glyph as well as colour, not colour alone.

**Detail view sections**, in this order:

1. **Amount of degradation** — quantified magnitude, per `VF-DET-2`.
   For example: `Decimated volume x/2, y/2, z/4`, or `Progressive decode, 32 kB initial`.

2. **Reason for the degradation** — the cause, per `VF-DET-3`.
   For example: `This GPU only supports textures up to <n>`, versus
   `The requested performance target is too slow at this size`.

3. **Interactive performance** — the operating point, per `VF-DET-4`, marked as a previous
   measurement where applicable per `VF-DET-7`.
   For example: `Output resolution 50% to maintain 30 fps`.

**Open design latitude:** icon glyph, exact colours and their accessibility treatment,
detail-view container (popover versus dialog), behaviour at small viewport sizes, the green
window duration, and the grouping of causes into user-facing language. Core wording will be
drafted alongside the implementation of each contributing task; @dan-rukas reviews and edits it
as those pieces land rather than authoring it up front.

### 5.5 Cornerstone3D scope — `VF-CS3D`

> To be filed separately against `cornerstonejs/cornerstone3D`. Recorded here so the OHIF-side
> dependency is explicit.

**VF-CS3D-1**
Cornerstone3D shall provide a defined class and interface surface representing viewport
fidelity information.

**VF-CS3D-2**
Cornerstone3D shall emit viewport events when fidelity information changes.

**VF-CS3D-3**
The fidelity information shall carry, separately, the affected dimension, the cause, the
quantified magnitude, and whether the difference is transient or standing.

> "Transient or standing" is T3's own wording and is retained here as the state field name.
> It maps onto the user-facing model of §3 as transient → transiently lossy, standing →
> terminally lossy. The formerly-lossy and never-lossy states are OHIF-side derivations over
> time and are not required of the Cornerstone3D state itself — though `VF-INFO-5a` means
> Cornerstone3D must make the *transition* observable, not merely the current value.

> Separating dimension from cause lets OHIF render "showing less detail" alongside "because
> this GPU cannot hold the full volume" without a combinatorial copy table. It is also what
> `VF-INFO-2`, `VF-INFO-4`, `VF-INFO-5` and `VF-INFO-3` respectively depend on.

**VF-CS3D-4**
Cornerstone3D shall provide an example implementation of the fidelity interface for stack
progressive loading.

**VF-CS3D-5**
Cornerstone3D shall provide an example implementation of the fidelity interface for volume
progressive loading.

**VF-CS3D-6**
The example implementations shall source their settings and values from the existing
progressive loaders.

**VF-CS3D-7**
The fidelity information shall be readable programmatically without going through a user
interface.

> T11's harness and T18's final comparison both record "current viewport fidelity state".

**VF-CS3D-8**
Cornerstone3D shall retain the existing `ImageQualityStatus` enum and its consumers unchanged.

> Notes on the existing surface, for whoever implements this:
> - `ImageQualityStatus` is per-*image*, numeric and ordered, readable via
>   `cache.getImageQuality(imageId)` and carried on `IImage.imageQualityStatus`. T3 needs state
>   per *viewport*, distinguishing requested from displayed — a different shape.
> - `Events.IMAGE_RETRIEVAL_STAGE` fires from `ProgressiveRetrieveImages` with detail
>   `{stageId, numberOfFailures, numberOfImages, stageDurationInMS, startDurationInMS}` — no
>   fidelity field — and has no OHIF subscribers today. Either its detail gains the information
>   or a new per-viewport event carries it.
> - Contributing sources: T9 records the pre-allocation downsample and its reason; T14 the
>   active interaction reduction; T15 the ordered fallback reason; T4 the device-class limits
>   that make a cause explicable. T13, if delivered, adds rendering-path substitution.

### 5.6 Documentation — `VF-DOC`

**VF-DOC-1**
The delivered work shall update this specification to describe what was actually built.

> The definition of done for a required item includes documentation, and this document is part
> of it. §5 in particular is expected to diverge from the implementation; a §5 that no longer
> describes the code is worse than no §5, because it is read as though it does. Where a §4 user
> requirement turns out to have been described wrongly, it is corrected here rather than
> quietly unimplemented.

**VF-DOC-2**
The public API surface introduced by `VF-VOCAB` shall be documented, including how an extension
registers a new fidelity reason, its arguments, and its translation.

> The existing precedent to mirror is
> `platform/docs/docs/platform/services/customization-service/typing.md`, which documents the
> `AppTypes` registry idiom this follows.

**VF-DOC-3**
The configuration surface shall be documented, covering repositioning the indicator and
removing it.

**VF-DOC-4**
The documentation for the configuration that removes the indicator shall state the consequence
of removing it, satisfying `VF-CFG-2`.

**VF-DOC-5**
The user-visible behaviour shall be documented, including the lossiness states and the
transitions between them.

**VF-DOC-6**
The known limitations shall be documented.

> At minimum, and not as a list of regrets but as things a deployer needs to know:
> - The recovered state is announced for about a second and then withdrawn, so a user not
>   looking at that viewport will not see it (`VF-VIS-1c`).
> - The state reported is that of the image currently displayed, not the worst across the
>   display set, so scrolling past a terminally lossy slice can be missed (`VF-VIS-4a`).
> - Fidelity of overlay layers, including segmentation labelmaps, is not reported at all
>   (§2.3).
> - Fidelity is not disclosed in the series panel, the study list, or exported artifacts, so a
>   user cannot learn a series will render degraded before opening it (§2.3).
> - The DICOM source's own lossy compression is not reported, by design (§2.3).

**VF-DOC-7**
The Cornerstone3D fidelity interface and its viewport events shall be documented in the
Cornerstone3D repository.

---

## 6. What this does not change

- Existing loading and progress affordances keep their present responsibilities. The
  `ViewportSliceProgressScrollbar`, `ViewportImageSliceLoadingIndicator`, and
  `LoadingIndicatorProgress` components continue to answer "how far along is this load". The
  fidelity indicator answers "can I trust what I am seeing yet". The detail view is the single
  place the two are reconciled, per `VF-DET-6`.
- The per-image `ImageQualityStatus` enum and its consumers, per `VF-CS3D-8`.
- Hanging protocols, measurement, and segmentation behaviour.
- The retrieval configuration in `extensions/cornerstone/src/index.tsx`.

---

## 7. Open items

1. **Settings surface reachable from the indicator.** The indicator is read-only
   (`VF-DET-9`). Quality and GPU settings are a separate piece of the overall work — T5 — and
   may later be reachable by click-through from the detail view. Not part of the fidelity
   indicator now. Whatever that surface becomes, `VF-AUTO-5` binds it: a small number of
   high-level inputs, not per-viewport low-level parameters. **Deferred by decision.**

2. **Whether `DisplaySetMessage` migrates onto the same registry.** `VF-VOCAB` establishes a
   typed, extensible, argument-forwarding replacement for exactly the pattern
   `DisplaySetMessage.CODES` implements badly. Converging them would fix the dropped-`args`
   bug and open the numeric code set, but it carries 13 producing call sites of regression
   surface and is not fidelity-indicator scope. `VF-VOCAB` should nonetheless be designed so
   that migration is later possible without redesign. **Closed — not now, deliberately.**

3. **Series-panel and study-list disclosure.** Out of scope per §2.3, and noted as a known gap:
   a user cannot currently learn that a series will render degraded before opening it.
   **Deferred, not planned.**

4. **Fidelity of overlay layers.** A reduced-resolution segmentation labelmap is arguably the
   most consequential case, since a labelmap boundary is read as a measurement. Unfunded, and
   not achievable with the state T3 delivers. `VF-VOCAB`'s extensibility is what would let it
   be added later without a core change. **Closed — acknowledged gap.**

5. **Register integration.** This specification is committed at its eventual location, but the
   `specs/` register tree is not on this branch — so the `VF` prefix row and the
   `specs/index.md` conventions edit for §2.1 are both pending, to be applied on whichever
   branch carries `specs/`. The companion `design.md` from @dan-rukas joins it then.
   **Open — action, not a decision.**

6. **How the recovered state is discovered.** Green is a one-second announcement over an
   otherwise unmarked image, re-revealable by hovering a target that is invisible while
   nothing is drawn. Whether one second is long enough to notice, and how a user learns the
   hover target exists, are unresolved. **Unresolved — @dan-rukas.**

7. **Are red and yellow distinguishable enough?** They differ only in whether waiting helps,
   and the image gives the user no independent clue. See the note at the end of §5.4.
   **Unresolved — @dan-rukas.**

---

## 8. Traceability

| Requirement group | Anchored in |
|---|---|
| `VF-AUTO` | T15 (automatic, deterministic selection policy); T6 bullet 5; prior failure of the decimated-views approach |
| `VF-INFO` | T6 bullets 2 and 5; T3 bullets 2 and 3 |
| `VF-VIS` | T6 bullets 1 and 4; T3 bullet 4 |
| `VF-DET` | T6 bullet 2; T9 final bullet; T14 final bullet |
| `VF-CFG` | T6 bullet 1 |
| `VF-LANG` | T6 bullet 5 |
| `VF-STATE` | T6 bullet 3; T3 bullets 1 and 3; T14 final bullet |
| `VF-VOCAB` | T6 bullets 2 and 5 |
| `VF-REG` | T6 bullet 1 ("one consistent per-viewport") |
| `VF-UX` | T6 bullets 1, 2 and 4 |
| `VF-CS3D` | T3 in full; T9 final bullet; T11 and T18 fidelity-state measurement |
| `VF-DOC` | Common definition of done — "Public APIs, configuration, user-visible behaviour, and important limitations are documented" |

Superseded material: the earlier acceptance-criteria drafts referenced by the final
acceptance-criteria document. The revised quote spreadsheet remains the authority for task
inclusion, priority, and effort.

## 9. Verification approach

| Requirement group | Primary verification |
|---|---|
| `VF-AUTO` | E2E: a study on a capability-constrained fixture renders usably with no user input and no settings visited; review that no user-facing choice requires renderer knowledge |
| `VF-INFO` | Detail-view content assertions against fixture fidelity states, one per dimension and cause |
| `VF-VIS` | E2E: indicator present in a non-active, non-hovered viewport with a degraded fixture; default-on across modes |
| `VF-DET` | E2E: activate indicator, assert all three sections; assert live update while open |
| `VF-CFG` | Unit: removal by configuration; documentation review for the consequence statement |
| `VF-LANG` | Review against `VF-INFO-10`; no renderer terms in user-visible strings; all strings translated |
| `VF-STATE` | Unit: event drives re-render; unknown dimension or cause renders generically |
| `VF-VOCAB` | Type-level test: a newly registered reason key with wrong argument types fails to compile |
| `VF-REG` | Unit: reposition by configuration; indicator received without mode enumeration |
| `VF-CS3D` | Cornerstone3D unit and example tests; fidelity state assertable without UI |
| `VF-DOC` | Review at delivery: this specification updated to match what was built; API, configuration, behaviour and limitations present |

T11's harness reads the same state programmatically (`VF-CS3D-7`); its measurements are not a
substitute for the verification above.
