# Segmentation and Contour Display — Behaviour Specification

**Baseline:** `origin/master` (3.14.0-beta.18, commit `179f04da02`)
**Scope:** How DICOM SEG (labelmaps) and RTSTRUCT (contours) get onto the screen, when their data is
fetched, and what the various ways of taking them off the screen actually mean. Editing, statistics
and export are out of scope. Rules SEG-1 to SEG-39 describe the baseline; the work on this branch is
kept separate in *Changes on this branch* below, which says which of them it supersedes.

Throughout, "segmentation" covers both SEG and RTSTRUCT: they differ mainly in how they are drawn
(labelmap versus contour, or a surface in a 3D view), not in how they are loaded and displayed.

---

## The short version

1. **The framing fact** — a segmentation is never a viewport's picture, always an overlay drawn on
   its referenced series. Everything else follows from it.
2. **Automatic display** — two cases: the segmentation the user has just opened, and
   propagation/restoration once it is already being shown. Plus the explicit non-case — nothing
   appears at study open unless a hanging protocol asks for it.
3. **Manual display** — "show me this" (thumbnail) versus "add this to what I'm looking at" (Add as
   Layer, or the viewport's overlay menu), with the LOAD badge as the fallback for a dismissed
   prompt.
4. **Loading** — on first arrival in a viewport, once, with defined failure and timeout behaviour.
5. **Remove versus delete** — remove affects one viewport and sticks; delete destroys the
   segmentation everywhere, and takes the display set with it only for segmentations created in the
   client. A SEG from the server can simply be loaded again.

---

## How it works, in prose

**A segmentation is never a viewport's picture — it is always drawn on top of something else.**
SEG and RTSTRUCT display sets are marked as *overlay* display sets, which means they have no
primary pixels of their own to show; they carry a reference to the series they were derived from.
So whenever OHIF is asked to display a segmentation, what it really does is display the *referenced*
series and add the segmentation on top of it. That single fact explains most of the behaviour below,
including why dropping a SEG into a viewport visibly changes what that viewport is showing.

**Automatic display happens in two situations, and neither of them is "at study open".** The first
is the segmentation the user has just chosen to look at. When a SEG or RTSTRUCT is placed into a
viewport, OHIF renders a dedicated SEG/RT viewport that shows the referenced series with the
segmentation drawn over it, and — once its data has finished loading, and only if that viewport is
the active one — asks whether to *hydrate* it. Hydrating means "stop treating this as a preview of a
derived object and start treating it as a segmentation of the referenced series": the viewport
switches to the referenced series proper, the segmentation appears in the segmentation panel, and it
becomes editable and exportable. The question is a dialog by default, but an installation can set
`disableConfirmationPrompts` and hydration then happens silently. The second situation is
propagation and restoration: once a segmentation is being rendered somewhere, OHIF spreads it to
other viewports showing the same volume or the same Frame of Reference (the `hydrateseg` sync group
that most hanging protocols declare), and it remembers, per viewport, which segmentations were being
rendered. That memory is keyed by the *underlying series*, so changing layout, switching hanging
protocol stage, re-orienting an MPR view or dragging the referenced series into another pane all
bring the segmentation back automatically. What does **not** happen automatically is initial
display: a study containing a SEG opens with the SEG sitting in the study panel, untouched, unless a
hanging protocol explicitly asks for it.

**Manual display is either "show me this segmentation" or "add this segmentation to what I'm already
looking at".** The first is the thumbnail: double-clicking or dragging a SEG/RTSTRUCT into a viewport
takes over that viewport and leads into the flow above. The second keeps the current background and
layers the segmentation onto it — available from the thumbnail's **Add as Layer** menu item and from
the viewport's data-overlay menu, which lists the other display sets and marks which ones can
legitimately be overlaid (matching Frame of Reference, reconstructable background; derived
modalities like SEG and RTSTRUCT are exempt from the volume-shaped constraints applied to image
overlays). Layered segmentations get their representation added as soon as the viewport is mounted —
there is no prompt, because the user has already said what they want. Finally, if a viewport is
showing an unhydrated segmentation, a small **SEG**/**RTSTRUCT** badge with a **LOAD** button sits in
the corner; that button is the same hydration action the dialog offers, for the user who dismissed
the dialog or was never shown one.

**Data is fetched when the segmentation first reaches a viewport, not before and not again
afterwards.** Opening a study creates the SEG/RTSTRUCT display sets from metadata alone — enough for
a thumbnail and a panel entry — and nothing is downloaded or decoded. The moment the display set is
put into a viewport, by any of the routes above, OHIF loads it: it fetches the frames, unpacks the
segment data, and registers the result with the segmentation service, reporting progress as a
percentage and a segment count while the viewport shows a loading indicator. Hydration cannot be
offered until that finishes, and a segmentation placed as a layer waits for it before being drawn.
Loading is done once per segmentation: subsequent displays, propagation to other viewports and
restoration after a layout change all reuse the already-decoded data. If a load fails, or takes more
than two minutes, OHIF gives up on drawing that segmentation but lets the viewport finish rendering
rather than hanging.

**Removing from display and deleting are different operations with different scopes.** *Remove from
Viewport* — from the segmentation panel's menu, or by removing the layer — takes the segmentation
off one viewport: its representation is dropped, the panel stops listing it for that viewport, and
because the removal happens before the viewport's state is stored, it stays gone across later layout
changes rather than being restored. The segmentation itself is untouched: still loaded, still
rendered in any other viewport that has it, and free to be added back. *Delete*, by contrast,
destroys the segmentation everywhere — it is removed from every viewport that lists it, and if it
was created in the client (a labelmap or contour the user drew) its display set is deleted too, so
it disappears from the study panel and is genuinely gone unless it was exported first. A segmentation
that came from the server survives its own deletion in one respect: the SEG series is still in the
study panel and can simply be loaded again, since deleting only discards the decoded working copy.

---

## The rules, in EARS form

**Display sets and data**

- **SEG-1** — The system shall create SEG and RTSTRUCT display sets as overlay display sets, which
  are never rendered as a viewport's own content.
- **SEG-2** — The system shall not fetch or decode segmentation data until the display set is placed
  in a viewport.
- **SEG-3** — When a segmentation display set is placed in a viewport, the system shall load it,
  report loading progress, and register it with the segmentation service.
- **SEG-4** — Once loaded, the system shall reuse the decoded segmentation for all subsequent
  displays.

**Automatic display**

- **SEG-5** — The system shall not display a segmentation on study open unless a hanging protocol
  explicitly selects it.
- **SEG-6** — When a segmentation display set is placed in a viewport, the system shall show the
  referenced series with the segmentation drawn over it.
- **SEG-7** — When a segmentation has finished loading in the active viewport, the system shall offer
  to hydrate it.
- **SEG-8** — While the viewport holding the segmentation is not active, the system shall not offer
  hydration.
- **SEG-9** — Where `disableConfirmationPrompts` is set, the system shall hydrate without asking.
- **SEG-10** — When hydration occurs, the system shall replace the viewport's content with the
  referenced series, list the segmentation in the segmentation panel, and record that the
  segmentation is displayed for that series.
- **SEG-11** — When a segmentation is rendered in a viewport, the system shall render it in the other
  viewports of the same sync group that are eligible per SEG-27 to SEG-29.
- **SEG-12** — When a viewport's content changes, the system shall re-display the segmentations
  recorded against that viewport's presentation identity, per SEG-30.
- **SEG-13** — Where `panelSegmentation.disableEditing` is configured, when hydration completes the
  system shall lock every segment.

**Manual display**

- **SEG-14** — When the user double-clicks or drags a segmentation thumbnail onto a viewport, the
  system shall place it in that viewport, per SEG-6.
- **SEG-15** — When the user adds a segmentation as a layer, the system shall keep the viewport's
  existing background and draw the segmentation over it, without prompting.
- **SEG-16** — The system shall offer a display set in a viewport's overlay menu only when it is
  eligible per SEG-31 to SEG-33.
- **SEG-17** — While a viewport shows an unhydrated segmentation, the system shall present a LOAD
  action that performs hydration.
- **SEG-18** — When the user creates a segmentation in the viewer, the system shall give it a
  client-side display set so it behaves like a loaded one.

**Eligibility for automatic display**

Eligibility is not one predicate. A segmentation passes through up to four independent gates —
which viewports hydration updates, which viewports it propagates to, which viewports restore it,
and whether the representation may finally be mounted — and they do not use the same test.

- **SEG-25** — A segmentation shall be eligible for automatic display in a viewport only when that
  viewport is selected by the hydration fan-out: a viewport the hanging protocol matches for the
  referenced display set, or, in a hanging-protocol layout, a grid pane whose display sets already
  include the referenced display set.
- **SEG-26** — When selecting those viewports, the system shall match the referenced display set by
  exact `displaySetInstanceUID` and shall not infer eligibility from a shared Frame of Reference,
  because forcing a different UID onto a volume viewport can leave it blank.
- **SEG-27** — When a segmentation is rendered in a source viewport, it shall be eligible for
  propagation to a target viewport in the same sync group when the target either shares a display
  set with the source viewport or reports the same `FrameOfReferenceUID` as the source viewport.
- **SEG-28** — While a target viewport shares no display set with the source and either reports no
  `FrameOfReferenceUID` or reports a differing one, the system shall not propagate to it.
- **SEG-29** — While a target viewport already holds a representation of that segmentation, the
  system shall not add a second one.
- **SEG-30** — A segmentation shall be eligible for restoration into a viewport when the viewport's
  presentation identity — the joined `displaySetInstanceUID`s of its non-overlay display sets —
  equals the identity the segmentation was recorded under. Viewport orientation shall not
  participate in that identity.

**Eligibility for manual display**

- **SEG-31** — The system shall offer a display set as a manual overlay only when the viewport's
  background display set is reconstructable and the candidate is not marked unsupported.
- **SEG-32** — Where a candidate declares a `FrameOfReferenceUID`, the system shall offer it only
  when that equals the background's; where a candidate declares none, the Frame of Reference shall
  not restrict the offer.
- **SEG-33** — SEG and RTSTRUCT shall be exempt from the volume-shape constraints applied to image
  overlays, namely that the background be a valid volume and the candidate be multiframe or a valid
  volume.
- **SEG-34** — Manual placement from a thumbnail shall not be subject to SEG-31 to SEG-33; it
  replaces the viewport's content per SEG-6 rather than layering onto it.

**Compatibility of a representation with a viewport**

- **SEG-35** — The system shall decide in one place whether a segmentation representation may be
  mounted in a viewport, so that every caller applies the same rule.
- **SEG-36** — Contour, surface and untyped representations shall have no viewport compatibility
  constraints, so an RTSTRUCT shall never be suppressed by this gate.
- **SEG-37** — A labelmap shall be mounted in a stack viewport only when that viewport displays at
  least one of the labelmap's source images.
- **SEG-38** — A labelmap shall be mounted in a volume viewport unless the labelmap reports a
  `FrameOfReferenceUID` differing from the viewport's; a labelmap derived from a series the viewport
  does not display shall remain compatible, because volume viewports resample by geometry.
- **SEG-39** — If compatibility cannot be determined — the segmentation is unknown, its source
  images or Frame of Reference are not yet derivable, the viewport is not yet set up, or the query
  throws — then the system shall treat the representation as compatible.

**Removal**

- **SEG-19** — When the user removes a segmentation from a viewport, the system shall stop rendering
  and listing it for that viewport only, shall leave it loaded and available elsewhere, and shall not
  restore it to that viewport on a later content change.
- **SEG-20** — When the user deletes a segmentation, the system shall remove it from every viewport,
  and shall delete its display set if it was created in the client.
- **SEG-21** — When a segmentation loaded from the server is deleted, the system shall retain its
  series in the study panel so it can be loaded again.

**Failure handling**

- **SEG-22** — If a segmentation has no referenced series, then the system shall defer to the
  `missingReferenceDisplaySetHandler` customization and otherwise skip rendering it.
- **SEG-23** — If a segmentation fails to load or does not finish within two minutes, then the system
  shall skip drawing it and allow the viewport to finish rendering.
- **SEG-24** — If a requested display set cannot be placed by the hanging protocol, then the system
  shall notify the user and leave the viewport unchanged.

---

## Where the eligibility rules disagree

These are observations about the baseline, not proposed changes. They matter because a redesign has
to decide which rule is the intended one.

- **Frame of Reference is both rejected and relied upon.** SEG-26 refuses to infer eligibility from
  a shared Frame of Reference, on the grounds that it can blank a volume viewport. SEG-27 propagates
  on exactly that inference, and SEG-38 permits mounting on exactly that basis. So the same
  relationship is unsafe when choosing viewports to update and sufficient when spreading to them.
- **Manual and render-time compatibility use different tests.** The overlay menu (SEG-31 to SEG-33)
  tests display-set metadata — reconstructable background, declared Frame of Reference, volume
  shape. The mount gate (SEG-36 to SEG-38) tests viewport state — displayed imageIds, viewport Frame
  of Reference — and branches on representation type, which the menu never considers. A display set
  can therefore be offered and then not mount, or be mounted by a path that never consulted the menu.
- **An absent Frame of Reference widens eligibility instead of narrowing it.** Under SEG-32 a
  candidate declaring no `FrameOfReferenceUID` is offered against any background, and under SEG-39
  an undeterminable one is treated as compatible. Missing information is permissive throughout,
  which is deliberate but means eligibility cannot be used as a correctness guarantee.
- **Contours are not checked at mount time.** SEG-36 exempts every non-labelmap representation, so an
  RTSTRUCT reaches a viewport whenever any of the earlier gates lets it through.

## Changes on this branch (PR #5996)

The rules above describe `origin/master`. This branch changes several of them. The organising idea is
that **hydration is a statement about a display set, not about a viewport** — "show this segmentation
wherever it logically belongs" — which splits the baseline's single notion of "remove/add" into a
per-viewport action and a global one, and makes the eligibility question answerable with no viewport
in existence at all.

**Per-viewport display versus hydration**

- **SEG-40** — The system shall treat adding or removing a segmentation layer in a viewport as
  affecting that viewport only: it shall not change the display set's hydration, so a viewport
  re-created later re-applies whatever hydration says rather than inheriting the per-viewport action.
  This is the viewport data-overlay menu's Add and Remove. *(Supersedes the second clause of SEG-19:
  a per-viewport removal no longer sticks across a content change — the global one does.)*
- **SEG-41** — The system shall treat removal from the segmentation panel's *Remove from Viewport* as
  the global statement, un-hydrating the display set as well as clearing it from the active viewport,
  so it is not restored into any viewport created later. Deletion (SEG-20) does the same.
- **SEG-42** — The system shall record a global removal as hydration *false* rather than as the
  absence of a record, and a viewport shall converge on that value — actively removing the
  representation — rather than only ever adding. Otherwise a stale *true* silently restores a
  segmentation the user dismissed.
- **SEG-43** — Where a caller means the global statement it shall say so explicitly:
  `removeDisplaySetLayer` takes `unhydrate`, `addDisplaySetAsLayer` takes `hydrate`, both defaulting
  to the per-viewport behaviour of SEG-40. A layer *replacement* is a remove followed by an add, so
  an unconditional clear would silently un-hydrate on every replacement.
- **SEG-44** — The system shall not infer hydration from what a viewport happens to be rendering.
  Storing a viewport's presentation shall keep the hydration already recorded for each segmentation
  and refresh only its representation type, and shall not drop the record for a segmentation the
  viewport is not rendering — the presentation identity is shared by every pane over the same
  background, so a pane that was gated out, or one the user removed the overlay from, must not erase
  what the others resolve against.
- **SEG-45** — Where a segmentation has no hydration record of its own — one drawn in the client, or
  one whose display set is not registered yet — the viewport it lives in shall be its authority and
  storing that viewport's presentation shall record it as displayed. This is the case the store keys
  cannot cover: hydration is keyed by the referenced display set and a client-created segmentation
  has none.

**Eligibility, restated**

- **SEG-46** — A segmentation shall be eligible for automatic display in a viewport when the
  viewport's background display set is one the segmentation may be drawn over, decided by a single
  rule (`isDisplaySetOverlayable`) shared with the manual overlay menu and answerable from display
  sets alone. *(Replaces SEG-25 and relaxes SEG-26: a shared Frame of Reference does now confer
  eligibility, resolving the first disagreement noted above.)*
- **SEG-47** — When a pane is eligible only by Frame of Reference, the system shall leave the display
  sets it already has; only an exact `displaySetInstanceUID` match shall force the referenced display
  set onto a pane. This is what SEG-26 was protecting — forcing a different UID onto a volume
  viewport can blank it — separated from the eligibility question.
- **SEG-48** — Beyond the display set it was made against, a derived display set shall reach another
  background only when both are reconstructable volumes. Two display sets can share a Frame of
  Reference while being unrelated series, and a stack's data is bound to specific images, so a
  non-reconstructable side gets no reach past its own reference.
- **SEG-49** — The system shall be able to hydrate with no viewport to match against — the target may
  never have existed (hydration driven from the study panel) or may have gone while the prompt was
  open — and shall fall through to eligibility matching rather than failing.
- **SEG-50** — Where the `cornerstone.segmentation.autoHydrateViewportTypes` customization lists
  viewport types, the system shall automatically display a hydrated segmentation only in viewports of
  those types; it shall not prevent a user from adding it to another type by hand. This is how
  surface generation for a 3D viewport is opted out of. Unset (the default) means every type that can
  render it.
- **SEG-51** — A segmentation's recorded representation type shall be a hint, not a requirement: the
  system shall correct it against the viewport that renders it — surface to labelmap outside a 3D
  viewport, labelmap to surface inside one — which is what lets hydration record a type without a
  live viewport.
- **SEG-52** — Restoration shall resolve which viewports a hydrated segmentation belongs in at read
  time, as a relation over the presentation store rather than a key lookup, because two display sets
  can share a Frame of Reference while being unrelated series and so the Frame of Reference cannot be
  a key. Where both a keyed entry and an eligible one exist for the same segmentation, the keyed entry
  — the segmentation's own display set — shall win. *(Extends SEG-30.)*

**Render mode**

- **SEG-53** — Where hydration pins a viewport type (RTSTRUCT contours request `stack` on the native
  viewport path, per `nextViewportPolicies`), the system shall apply it only to the pane hydration was
  invoked on, whose background is being set to the referenced image. Panes matched because they
  already show an eligible background keep their own render mode, so an MPR pane is not flipped to a
  stack.

**Still open**

- A segmentation's `isHydrated` is mutated directly with no event, so consumers that render from it —
  the study-browser thumbnail, the LOAD badge — can show it stale. There is work in progress to move
  the flag onto the display set properly.
- SEG-44 keeps a shared presentation entry from being erased, but the identity is still shared across
  orientations (SEG-30: orientation does not participate). Per-pane state that genuinely differs — a
  2D pane's labelmap versus a 3D pane's surface — has nowhere of its own to live, which is why SEG-51
  corrects the type at mount time instead.

## Where this lives

| Concern | Location |
| --- | --- |
| Hydration prompt and command | [promptHydrationDialog.ts](extensions/cornerstone/src/utils/promptHydrationDialog.ts), `hydrateSecondaryDisplaySet` in [commandsModule.ts](extensions/cornerstone/src/commandsModule.ts) |
| Which viewports hydration touches | [hydrationUtils.ts](extensions/cornerstone/src/utils/hydrationUtils.ts) |
| Manual overlay eligibility | `getEnhancedDisplaySets` in [utils.ts](extensions/cornerstone/src/components/ViewportDataOverlaySettingMenu/utils.ts) |
| Overlay eligibility, shared rule (SEG-46 to SEG-48) | [isDisplaySetOverlayable.ts](extensions/cornerstone/src/utils/isDisplaySetOverlayable.ts) |
| Which viewport types auto-hydrate (SEG-50) | [autoHydrateViewportTypes.ts](extensions/cornerstone/src/utils/autoHydrateViewportTypes.ts), [segmentationHydrationCustomization.ts](extensions/cornerstone/src/customizations/segmentationHydrationCustomization.ts) |
| Resolving recorded segmentations for a viewport (SEG-52) | [getViewportPresentations.ts](extensions/cornerstone/src/utils/presentations/getViewportPresentations.ts) |
| Pinned render mode on hydrate (SEG-53) | [nextViewportPolicies.ts](extensions/cornerstone/src/utils/nextViewportPolicies.ts), `loadSegmentationDisplaySetsForViewport` in [commandsModule.ts](extensions/cornerstone/src/commandsModule.ts) |
| Representation/viewport compatibility | [isSegmentationOverlayCompatible.ts](libs/@cornerstonejs/packages/tools/src/stateManagement/segmentation/helpers/isSegmentationOverlayCompatible.ts) |
| Remembering what was displayed | [useSegmentationPresentationStore.ts](extensions/cornerstone/src/stores/useSegmentationPresentationStore.ts), [CornerstoneViewportService.ts](extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts) |
| Spreading to other viewports | [createHydrateSegmentationSynchronizer.ts](extensions/cornerstone/src/services/SyncGroupService/createHydrateSegmentationSynchronizer.ts) |
| Layers, add and remove | [commandsModule.ts](extensions/default/src/commandsModule.ts), [layerConfigurationUtils.ts](extensions/default/src/utils/layerConfigurationUtils.ts) |
| Loading | [CornerstoneCacheService.ts](extensions/cornerstone/src/services/CornerstoneCacheService/CornerstoneCacheService.ts), the SEG/RT SOP class handlers |
| Preview viewports | [OHIFCornerstoneSEGViewport.tsx](extensions/cornerstone-dicom-seg/src/viewports/OHIFCornerstoneSEGViewport.tsx), [OHIFCornerstoneRTViewport.tsx](extensions/cornerstone-dicom-rt/src/viewports/OHIFCornerstoneRTViewport.tsx) |
| Delete and client-created segmentations | [setUpSegmentationEventHandlers.ts](extensions/cornerstone/src/utils/setUpSegmentationEventHandlers.ts) |
