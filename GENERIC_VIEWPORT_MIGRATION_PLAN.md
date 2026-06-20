# OHIF → Cornerstone3D Generic Viewport ("next") Migration Plan

Status: draft plan, grounded in `@cornerstonejs/core` 5.0.x source at
`cornerstone3d.worktrees/cornerstoneohifnextapi` (core reports `5.0.8`) and the OHIF
`extensions/cornerstone` source in this worktree. Facts marked **[VERIFIED]** were read directly
from source for this plan; items marked **[from investigation]** come from the agent sweep and
should be re-pinned to exact line numbers before any PR cites them.

---

## 1. Goal and constraints

- OHIF must run on the cornerstone3D **native Generic Viewport / "next" API directly** —
  `ViewportType.PLANAR_NEXT` / `VOLUME_3D_NEXT` / `VIDEO_NEXT` / `ECG_NEXT` / `WHOLE_SLIDE_NEXT`,
  driven by `setDisplaySets` / `addDisplaySet` / `setDisplaySetPresentation` / `setViewState` /
  `updateViewState` / `resetViewState` / `viewportProjection` / view references.
- OHIF must **not** use the legacy compatibility layer: not the
  `init({ rendering: { useGenericViewport: true } })` remap, and not the legacy adapter methods
  (`setStack` / `setVolumes` / `setProperties` / `getProperties` / `getCamera` / `setCamera` /
  `getViewPresentation` / `setViewPresentation` / `resetCamera`).
- The migration is **opt-in** behind a new OHIF `appConfig` flag. The legacy OHIF code path stays
  byte-identical until the community has migrated; no forced breaking changes.
- Where something is missing or broken in cornerstone for native-next OHIF to work, the fix
  **belongs in cornerstone3D, not OHIF** (Section 5).

---

## Implementation status (re-verified 2026-06-19 at HEAD)

This section was **re-verified against HEAD source** by a fresh multi-agent code audit plus an
adversarial verification pass (every "open" and "newly resolved" claim independently re-read in the
code). It supersedes the earlier same-day status and the `.html` companion where they disagree. HEAD:
OHIF `d5d03d888` on branch `ohifohifnextapi`; cornerstone3D `d299fb659` on branch
`cornerstoneohifnextapi` (both local-only, not pushed; both trees clean — everything called DONE is
committed).

**The headline of this re-audit: five commits landed AFTER the last full plan-prose refresh
(`05e0df0ca`), and only the last one (`d5d03d888`) updated the doc text (and only for CS-12/CS-20/M6).
So the prose below was materially stale and is corrected here.** Those five commits —
`7b61e08ee` (fusion colormap → overlay binding), `a19bd7826` (residual native-unsafe sites),
`ca746e2f0` (native video/WSI/ECG mounts), `b5784ca80` (flag-read allowlist guard), `d5d03d888`
(doc) — **closed many items the prose still calls open**: the M2 fusion-colormap keying bug, four of
the six "native-unsafe sites still open", the video/WSI/ECG mounts, and the M7 flag-read allowlist.

**Two prior-audit overclaims were refuted on verification** (details under "Corrections" below):
(1) the per-volume Window-Level panel does **not** throw on native — it is guarded (`d28202610`) and
degrades to an empty panel; (2) CS-21's stated trigger (null-orientation 3D SCOORD3D with no
planeRestriction) is **unreachable** because SR/RT hydration always attaches a planeRestriction.

What **genuinely** remains is concentrated in: **segmentation (the OHIF half of M4 — unstarted, and it
both throws and promotes to a legacy ORTHOGRAPHIC mount)**; **fusion/PMAP/tmtv OHIF integration**
(keying is now correct but rendering is unvalidated, and native fusion W/L still targets the source
binding); **native volume-appearance feature ports** (per-volume histogram/opacity/threshold are
degraded, not crashing, on native); **M5 tool residue** (crosshairs ROTATE/slab/auto-pan, 4D cine,
tmtv role-addressable targeting); **M6 validation + the VR-menu footgun**; and **M7 cleanup + the
near-total absence of native-path e2e**.

### Milestone status

- **M0 — Scaffolding & flag + backend seam: DONE.** `appConfig.useNextViewports`, `nextViewports.ts`
  accessor + `init.tsx` wiring, `getCornerstoneViewportType` `*_NEXT` mapping, `CornerstoneCacheService`
  data-shape fix, and the full backend seam (`backends/`: `IViewportBackend`,
  `IViewportServiceInternals`, `LegacyViewportBackend`, `NextViewportBackend`, ref-counted
  `DataIdRegistry`) are all **committed** (the seam first landed in `6d9e46f74`; the freeze's
  "UNCOMMITTED" status is stale). Residual M0-ish items are reclassified to M7: the literal §4.3
  mount-body relocation is still deferred (the backend delegates to unchanged service methods), and the
  presentation-snapshot CI lane + lint rule were never built.
- **M1 — Planar stack, read-only: DONE.** Native `PLANAR_NEXT` stack renders end-to-end with zero
  console errors (295-slice CT NECK; scroll + `setImageIdIndex` navigate; cache fills to 295).
  Read bridge, `CornerstoneCacheService` root-cause fix, `ImageOverlayViewerTool` guard, mount-time VOI
  seeding, toolbar evaluator. Presentation **persistence** (previously deferred to M5) now also lands —
  see M3.
- **M2 — Planar volume + MPR: PARTIAL.** Native volume/MPR renders in all 3 orientations
  (`_setNativeVolumeDisplaySets`); capability-guarded `setViewportOrientation` works; pan/zoom restore
  on mount (`93e15bd85`); native 3D VR mounts here too (`3963b57c5`). **CORRECTED — the fusion-keying
  bug the prose called "unsound" is FIXED (`7b61e08ee`):** `NextViewportOperations.setColormap` now
  **threads** `params.displaySetInstanceUID` through `setViewportProperties` to the native per-binding
  `setDisplaySetPresentation` (`NextViewportOperations.ts:120-126`), so a fusion colormap correctly
  targets the PT overlay. The `DataIdRegistry.dataIdFor(uid,'overlay')` suffix is **intentionally
  reserved for same-UID derived labelmap overlays (M4)** — fusion's overlays carry **distinct** UIDs and
  are collision-free under the bare id; the suffix still has **zero callers** (an M4 task, not an M2
  bug). **Not done (M2):** native PT/CT fusion is keyed correctly but its **rendered result is
  UNVALIDATED** end-to-end (overlay opacity-TF/blend/z-order, CS-22 multi-point opacity + threshold) —
  no fusion test exists. Minor: stale JSDoc at `IViewportOperations.ts:22` ("ignored on native") now
  contradicts the code; live `setColormap` has no `is3D` guard (mount-time path does, at
  `CornerstoneViewportService.ts:1531-1534`).
- **M3 — Presentation, VOI/colormap, synchronizers: PARTIAL (further than the prose; cleaner than the
  re-audit's first pass).** DONE: pan/zoom/rotation/flip **persistence** via the backend
  (`ddd4ccc14`/`c51fe4c1d`/`93e15bd85`); every interaction/appearance command native-safe in the
  Legacy/Next operations backend (`984e6ac95`); `ColorbarService` + WL panel guarded. **CORRECTED — four
  sites the prose still lists as open native throws are FIXED by `a19bd7826`:**
  `CornerstoneViewportDownloadForm` (native capture branch at `:133-165`; `getProperties` confined to
  the legacy branch `:170`); tmtv `commandsModule.ts:267/296` (now `getViewportFocalPoint` →
  `getViewReference().cameraFocalPoint`, `getViewportPresentation.ts:119-130` — exactly the prescribed
  fix); `CornerstoneCacheService.invalidateViewportData` (now branches on persisted `dataShapeType`,
  closing the stack-rebuilt-as-volume bug, `:91/93/108/150`); `ViewportOrientationMarkers` (now keys on
  `dataShapeType`, `:51-52`). **Genuinely remaining (all OHIF, all feature-degradation NOT crashes on
  the single-flag native path):** (a) `useViewportRendering.tsx` `setPixelValueRange`/`setOpacity`/
  `setThreshold` (`:220/574/625`) gate on `isVolumeViewportType` (false on native) so pixel-range,
  opacity and threshold **silently no-op** on a native volume; (b) the per-volume Window-Level panel is
  **guarded, not broken** — `getWindowLevelsData` returns `[]` when `getAllVolumeIds` is absent
  (`utils.ts:109-110`, `d28202610`), so the panel renders "No window level data available" and BOTH
  `handleVOIChange`/`handleOpacityChange` are unreachable; the residual is a **feature port**
  (`utils.ts:108 TODO(next)`), not a throw. Latent: read-side fusion twin defaults to `getSourceDataId()`
  (`getViewportPresentation.ts:39`); **dual-flag fragility** (if BOTH `useNextViewports` and cornerstone
  `useGenericViewport` are set, `isVolumeViewportType` flips TRUE for native MPR and these no-ops become
  throws). No committed e2e for persistence.
- **M4 — Segmentation (labelmap/contour): split — cornerstone DONE, OHIF UNSTARTED.** Cornerstone:
  contour render on native (`06605d040`), segmentation-preserving `setDisplaySets` (CS-3, `1b13aa55f`),
  labelmap-slice render (CS-13, pre-existing). **The OHIF half is untouched** (`git log master..HEAD`
  empty for `SegmentationService`; no post-refresh commit touches any seg/RT/PMAP file) and is
  **doubly broken on native**: `addSegmentationRepresentation` → `determineViewportAndSegmentationType`
  (`SegmentationService.ts:1597`) dispatches on `isVolumeViewportType` (the **OHIF-local**
  `getLegacyViewportType` util — `requestedType ?? type` — false for native `PLANAR_NEXT`, stack AND
  MPR) → `handleStackViewportCase` (`:1644`) → `convertStackToVolumeViewport` (`:1726`), which not only
  calls `getViewPresentation`/`setViewPresentation` absent on native (`:1731/:1738`) **but also sets
  `viewportType: ViewportType.ORTHOGRAPHIC` (`:1758`)** — so even a presentation-guarded version would
  **promote the native viewport to a legacy volume mount and defeat `useNextViewports`**. No
  `isGenericViewport` gate anywhere in the add path or its two ungated drivers
  (`addOverlayRepresentationForDisplaySet:1607`, `_setSegmentationPresentation:1868` — the prose's
  `~1557`/`~1818` line numbers are stale). RTSTRUCT (contour) bypasses `convertStackToVolumeViewport`
  (the cheapest M4 case, rides CS-8) — but has **zero** OHIF native e2e; its hardcoded
  `viewportType:'stack'` (`OHIFCornerstoneRTViewport.tsx:114-115`) is **cosmetically wrong but
  functionally inert** (the native backend's `setPositionPresentation` ignores that field). Remedy: add
  a native in-place labelmap render branch (no promotion) so a `PLANAR_NEXT` viewport never reaches
  `convertStackToVolumeViewport`.
- **M5 — Crosshairs / reference lines / cine: split — cornerstone DONE, OHIF + cornerstone residue.**
  Cornerstone crosshairs camera reads+writes (`9e32b3500`), `ReferenceCursors`, and cine (`7d13b013f`)
  all landed. **Residual (verified, split by repo):** *cornerstone-side* — crosshairs ROTATE
  (`CrosshairsTool.ts:2286-2288`), SLAB-thickness (`:2401-2402` drag, `:2599-2601` write) and auto-pan
  (`:1691-1693`) are explicit `isGenericViewport` early-returns awaiting native oblique-orientation /
  slab / in-plane-pan APIs; 4D dynamic cine unreachable (`playClip._getVolumeFromViewport` returns
  undefined for non-`VolumeViewport`, `:361-381`; dynamic branch gated `instanceof VolumeViewport`,
  `:585`) — breaks `preclinical-4d`. *Both-side* — `NextViewportOperations.centerOnMeasurement` returns
  false (`:104-109`) so jump positions to slice but does not in-plane re-center; tmtv fusion config
  hand-builds `cornerstoneStreamingImageVolume:${uid}` (`setFusionActiveVolume.js:35,38`) +
  `filterActorUIDsToSetSlabThickness` (`setCrosshairsConfiguration.js:25`) that native tools never
  consume. **Sharper than the prose:** native fusion W/L is not merely "unresolved config" — native
  `WindowLevelTool` resolves its target via `getSourceDataId()` (`WindowLevelTool.ts:391`, pre-existing
  5.0 base `aa68c904b`), so the PT **overlay** role is **unreachable** on native and W/L always hits the
  CT source. (Also: PT-SUV modality/preScale detection differs between lanes for the native fusion
  binding — untested.)
- **M6 — 3D / video / WSI / ECG: PARTIAL (3D done; CORRECTED — video/WSI/ECG ARE now mounted).**
  `VOLUME_3D_NEXT` renders natively (renderMode `vtkVolume3d` + `applyPreset`, OHIF `3963b57c5`;
  cornerstone `99e043c61`/`3dbcf5dc7`); all four VR ops work. **CORRECTED — `ca746e2f0` made
  `NextViewportBackend.dispatchMount` route `ECG_NEXT`→`_setEcgViewport` and
  `VIDEO_NEXT`/`WHOLE_SLIDE_NEXT`→`_setOtherViewport` by viewport type (`NextViewportBackend.ts:86-105`).**
  Their native branches register a **family-specific** dataId (`{kind:'ecg'|'video'|'wsi'}`, payload
  union widened in `dataIdRegistry.ts`) and mount via `setDisplaySets`; `_setEcgViewport` **no longer
  calls the absent native `setEcg`** (it survives only in the legacy fallback, `:899`). So
  "video/WSI/ECG NOT mounted natively" is **refuted in code**. **Not done (M6):** (1) the **VR-menu
  footgun is real and worse than the prose** — `isVolume3DViewportType` is false for native
  `VOLUME_3D_NEXT`, so `WindowLevelActionMenu` not only **hides** the VR submenus (`:92/94`) but
  **shows the 2D Colorbar/Color-LUT/Modality-WL sections** (gated on `!is3DVolume`, `:69/71/82`) on a 3D
  viewport; same root cause mis-branches a SEG dropped on a native 3D viewport to Labelmap instead of
  Surface (`commandsModule.ts:322-328`); (2) the video/WSI/ECG mounts are **code-complete but never
  live-validated** (no such study on the dev dicomweb per `ca746e2f0`); minor: WSI `webClient`
  resolution under the flag unconfirmed (`CornerstoneViewportService.ts:926`), and `_setOtherViewport`
  does not restore presentations for video/WSI (`_presentations` unused, `:903-907/937-940`).
- **M7 — Default-on & cleanup: TODO (partial; CORRECTED — the flag-read allowlist IS built).**
  `config/default.js:6` still sets `useNextViewports: true`; the in-toolbar `ToggleNextViewport` button +
  `nextViewports.ts` localStorage override + `init.tsx resolveNextViewportsEnabled` are all present
  (tracked in `TODO_BEFORE_MERGE.md`). **CORRECTED — the lint/grep allowlist the prose says was "never
  built" exists and passes (`b5784ca80`):** `.scripts/check-next-viewports-flag-reads.mjs` enforces a
  fixed **5-file** allowlist (`getCornerstoneViewportType`, `CornerstoneViewportService`, `nextViewports`,
  `init.tsx`, `getToolbarModule`); the "8 files read the flag / the rule must be redefined" premise is
  **refuted** — the backend trio only **mentions** the flag in comments, so the real runtime read
  surface is exactly those 5. **But the guard is inert** — it is wired into no CI/lint/lint-staged path,
  so it cannot stop drift yet. The destructive reverts (flip `default.js`, remove the toggle/override
  scaffolding) and dual CI lanes remain undone. **Coverage debt blocks honest sign-off** — see below.

### M0 backend system (legacyBackend / nextBackend + facade + DataIdRegistry §4.7)

**Status: COMMITTED (both lanes validated manually).** The `backends/` dir + modified
`CornerstoneViewportService` first landed in `6d9e46f74`; the presentation read/write fork was added in
`ddd4ccc14`, and a sibling Legacy/Next **operations** backend in `984e6ac95`. The freeze's
"UNCOMMITTED working-tree changes" status is stale.

- `IViewportBackend` has grown from 4 to **seven** members: `dispatchMount`, `getPositionPresentation`,
  `setPositionPresentation`, `setLutPresentation`, `registerDataId`, `onViewportDisabled`, `destroy` —
  i.e. the presentation read/write fork the freeze said "stayed in the service" was **relocated** into
  the backends (`ddd4ccc14`; the service now delegates `_getPositionPresentation`/`_setLutPresentation`/
  `_setPositionPresentation` at `:425/1783/1793`). The mount **bodies** (`_setStackViewport`,
  `_setNativeVolumeDisplaySets`, `_setEcgViewport`, `_setOtherViewport`) **still live in the service**;
  `dispatchMount` delegates to them through the `IViewportServiceInternals` facade (explicit deferral
  comment at `NextViewportBackend.ts:67-70`). A second twin, `IViewportOperations`
  (`LegacyViewportOperations`/`NextViewportOperations`, dispatched per-viewport by
  `viewportOperations.ts` on `isGenericViewport`), holds the 13 interaction/appearance command bodies
  (`984e6ac95`).
- `LegacyViewportBackend.dispatchMount` is a verbatim copy of the old legacy type-dispatch chain
  (byte-identical off-path); `NextViewportBackend.dispatchMount` routes **only by data shape**
  (`'volume' in firstData` → `_setVolumeViewport`/`_setNativeVolumeDisplaySets`, else
  `_setStackViewport`). NOTE this data-shape-only routing is exactly why video/WSI/ECG never reach their
  dedicated native mounts (M6).
- Backend selection is a **lazy first-use getter** (`private get backend()` resolving
  `isNextViewportsEnabled()` on first access), **not** the constructor read §4.2/§4.3/§6 call
  "sanctioned read #2" — see Learnings.
- `DataIdRegistry` (§4.7) shipped as designed and **is committed** (the freeze's later "uncommitted
  DataIdRegistry" reference is stale): global ref-count map + per-viewport ledger; `provider.add` only
  on 0→1, `provider.remove` only on 1→0; `releaseViewport` on disable; `destroy()` removes each dataId
  individually. `registerDataId` replaced the raw provider `.add` at both native mount sites;
  `disableElement` calls `backend.onViewportDisabled` **before** deleting bookkeeping. This is the
  OHIF-side answer to CS-18 (cornerstone's provider intentionally stays a dumb add/get/remove/clear
  store). The `dataIdFor(uid, role)` overlay-suffix is **still an unused stub** (native mounts use the
  bare uid — the M2 fusion-keying gap). GC unit tests not written.

### 5 native parity fixes (now COMMITTED in both repos)

Four landed cornerstone-side in `ac0229426`: (1) initial `CAMERA_MODIFIED` emitted on native mount
(`PlanarViewport`, role `source`) — legacy `StackViewport` emitted this for free, native did not, so
overlays/markers/initial W/L only appeared after first interaction; (3) panel-resize CPU-canvas
sizing via `_getDisplayedSize(vp)` in `ContextPoolRenderingEngine` (resize detection had measured the
**hidden** cornerstone-canvas at width 0 and early-returned); (5) W/L sigmoid `voiLUTFunction`
threaded through `planarImageRendering`/`PlanarViewportTypes`/`VtkImageMapperRenderPath` (general
parity, only changes SIGMOID studies); (2-CS) stack-prefetch capability gate
(`viewportSupportsImageSlices`) in `stackPrefetchUtils`. OHIF-side in `e164f8c5e`: (2-OHIF)
`stackContextPrefetch.enable` on the native mount; (4) scrollbar full-mode classification keyed off
`getCurrentMode()`.

### Native stack + volume/MPR render (COMMITTED)

Stack: `a3fa6adfa` (`PLANAR_NEXT`, 295 slices, scroll + `setImageIdIndex`). Volume/MPR: `13af1cd77`
(`_setNativeVolumeDisplaySets`, 3 orientations, 512 reformatted slices). `setViewportOrientation`:
`f78d01e2d`. All flag-gated by `useNextViewports`.

### Cornerstone-side blockers (§5) — actual status

DONE (committed on `cornerstoneohifnextapi`, not pushed): **CS-1** (presentation events
VOI/COLORMAP_MODIFIED — §5/§10 are stale where they still call CS-1 "the single biggest blocker"),
**CS-3** (segmentation-preserving `setDisplaySets`, `1b13aa55f`), **CS-5/16/17** (content predicate +
guards; `IEnabledElement` **union** widening still deferred — only the guards/types shipped), **CS-7**
(`getNumberOfSlices`), **CS-8** (reads via the pre-existing `getViewportICamera` bridge + reference
lines + contours + camera-position sync + crosshairs **writes** + `ReferenceCursors`, all done in
`9e32b3500`; only ROTATE/SLAB/auto-pan remain gated-off by design), **CS-9** (cine — `7d13b013f`; no
longer throws, degrades to slice-scroll; 4D dynamic cine still unsupported), **CS-10** (folded into
CS-8), **CS-11** (voi/imageSlice synchronizers), **CS-13** (labelmap-slice, pre-existing), **CS-14**
(3D VR render + interaction tools, `99e043c61`/`3dbcf5dc7`), **CS-15** (render-path decision), **CS-19**
(`forceCPU`), **CS-12** (native `PlanarViewport.calibrateSpacing` + user-calibration merge in
`buildPlanarImageData`, `d299fb659`; `viewportSupportsStackCalibration` is now true so
`calibrateImageSpacing` routes to native, and `getImageData().calibration` reflects the
`calibratedPixelSpacing` so CalibrationLine rescales native length measurements — validated live),
**CS-22** (multi-point opacity TF + threshold on the volume-slice path — pre-existing in
the 5.0 base PR `aa68c904b`; confirmed, but with NO OHIF native fusion wiring exercising it). NOTE:
only `setViewportCamera.ts` (`3dbcf5dc7`) is a newly-authored bridge; `getViewportICamera.ts` is
pre-existing 5.0 infra — the migration *adopts* it across tools, it did not create it.

GENUINELY OPEN (upstream cornerstone):
- **CS-6 part 2** — `VOLUME_VIEWPORT_NEW_VOLUME` still fires only from the two legacy-compat adapters
  (`PlanarLegacyCompatibilityController.ts:574`, `VolumeViewport3DLegacyAdapter.ts:296`), never from
  native `PlanarViewport.setDisplaySets` (`PlanarViewport.ts:327-499`). **This also affects the native
  `VOLUME_3D_NEXT` mount** (no native 3D new-volume emit either) — the prose framed it only around
  planar/MPR. Per-volume init listeners never run on any native volume mount. (CS-6 **part 1** —
  `VOLUME_NEW_IMAGE` on volume-backed slice change — IS done, `5635bdab4` / `planarImageEvents.ts:61-66`.)
- **CS-21 — CORRECTED & NARROWED.** The prose's stated trigger ("focal-point-only 3D SCOORD3D with null
  orientation and no `planeRestriction` → no default-orientation fill") is **unreachable on the native
  SR/RT route**: `getReferenceData3D` (`hydrateStructuredReport.ts`) **always** calls
  `updatePlaneRestriction` (`:353`) before returning, so a produced 3D ref always carries a
  `planeRestriction`, which routes `normalizeVolumeViewReference` into
  `deriveOrientationFromPlaneRestriction` and yields a derived orientation + reorientation — 2D
  `referencedImageId` and oblique `planeRestriction` already resolve on the inherited 5.0 base. The
  **only** residual no-reorient case is a **single-point** SCOORD3D (a `planeRestriction` with a point
  but null in-plane vectors → no normal to cross → keeps current orientation). **File correction:** the
  open logic is the WRITE path `PlanarViewReferenceController.ts:496-513` (not the read-side
  `planarViewReference.ts` the §5/§10 prose pins). Verify only if single-point SCOORD3D measurements are
  in scope; otherwise CS-21 is effectively closed by the inherited base.
- **CS-16 union** — `IEnabledElement.viewport` still `IStackViewport | IVolumeViewport`
  (`IEnabledElement.ts:23`); widening deferred until the CS-8/CS-10 tools-camera narrowing migration
  lands (else the widened union breaks every `getCamera`/`setProperties` reader). Minor.
- **CS-9 residual** — 4D dynamic/time-point cine on native (`playClip.ts:361-366`); minor, see M5.
- **CS-20** — ECG/video/WSI load *ergonomics* only; OHIF now drives those mounts itself (`ca746e2f0`),
  so no cornerstone change is required — a nice-to-have, deprioritized.

Caveat on the DONE blockers: **CS-1's** native presentation event has two silent-skip conditions worth
knowing — it fires only when the target binding is currently mounted (`GenericViewport.ts:652
bindings.has`) and only when `voi`/`invert`/`colormap` keys are in the delta (`PlanarViewport.ts:677-679`),
so an opacity/visibility-only change or a push to a not-yet-mounted display set emits **no** event and
OHIF UI keyed on those still goes stale.

RE-SCOPED: **CS-18** is DONE at the OHIF layer (ref-counted `DataIdRegistry`, committed `6d9e46f74`),
intentionally NOT internalized into cornerstone (the provider stays a dumb add/get/remove/clear store);
it lacks a unit test. Do not list it as flatly TODO.

### OHIF-side native-unsafe sites — verified status at HEAD

**FIXED since the prior audit (do NOT re-list as open):**
- `CornerstoneViewportDownloadForm` — `a19bd7826` added a native capture branch (`:133-165`);
  `getProperties` is now confined to the legacy branch (`:170`). No longer throws on native.
- tmtv `commandsModule.ts:267/296` — `a19bd7826` replaced `getCamera().focalPoint` with
  `getViewportFocalPoint` → `getViewReference().cameraFocalPoint` (`getViewportPresentation.ts:119-130`),
  exactly the prescribed fix.
- `CornerstoneCacheService.invalidateViewportData` — `a19bd7826` now branches on persisted
  `dataShapeType` (`:91/93/108/150`; field at `types/CornerstoneCacheService.ts:29/36`), closing the
  native-stack-rebuilt-as-VOLUME data-correctness bug.
- `ViewportOrientationMarkers.tsx:51-52` — `a19bd7826` keys the synthetic-IOP default-cosine guard on
  `dataShapeType ?? viewportType`; the `viewportType==='stack'` dead branch is gone.
- `CalibrationLineTool` calibration — RESOLVED by CS-12 (`d299fb659`); no OHIF change needed.

**GENUINE native throw still open (the one real crash):**
- `SegmentationService.convertStackToVolumeViewport` — `getViewPresentation`/`setViewPresentation`
  absent on native (`:1731/:1738`), reached for **every** native labelmap mount (stack AND MPR) with no
  `isGenericViewport` gate, AND it promotes to `ViewportType.ORTHOGRAPHIC` (`:1758`) which defeats the
  migration even if the presentation calls were guarded. This is the M4 OHIF gap (see M4 above).

**Feature-degraded on native (NO crash on the single-flag path — these no-op, they do not throw):**
- `useViewportRendering.tsx` `setPixelValueRange`/`setOpacity`/`setThreshold` (`:220/574/625`) gate on
  `isVolumeViewportType` (false on native) → pixel-range / opacity / threshold silently do nothing on a
  native volume. Feature port, not a crash. (One fragile spot: `:584` `getAllVolumeIds` is itself absent
  on native and would throw *if* the `isVolumeViewportType` gate above it were ever bypassed — see
  dual-flag.)
- Per-volume Window-Level panel — `getWindowLevelsData` returns `[]` when `getAllVolumeIds` is absent
  (`utils.ts:109-110`, guarded by `d28202610`), so the panel renders "No window level data available"
  and BOTH `ViewportWindowLevel.tsx` `handleVOIChange:119` (`setProperties`) and `handleOpacityChange:133`
  (`getAllVolumeIds`) are **unreachable**. The prior audit listed `:119`/`:134` as live throws — that is
  **incorrect**; they are dead code on native. The residual is a **feature port** (`utils.ts:108
  TODO(next)`: native per-volume histograms/opacity/VOI).

**Latent / footgun:**
- Read-side fusion twin: `getViewportPresentation.ts:39` `getViewportProperties` defaults to
  `getSourceDataId()` when no dataId is threaded, so a future overlay-scoped reader without
  `displaySetInstanceUID` reads the source binding (read-side mirror of the now-fixed `setColormap` bug).
- `isReferenceViewable.ts` native jump-target resolution and HangingProtocol matching-on-viewport-type
  remain unverified by any native test (likely low-risk — both key on the OHIF `viewportType` string,
  not the cornerstone enum).

**DUAL-FLAG FRAGILITY (unchanged, unmitigated):** every "native skips the legacy branch" guard depends
on cornerstone's `useGenericViewport` being **off**. If a deployment sets BOTH `appConfig.useNextViewports`
AND cornerstone `rendering.useGenericViewport`, a legacy `requestedType` is recorded, `isVolumeViewportType`
flips TRUE for native MPR, and the *feature-degraded no-ops above become real throws* (absent
`getAllVolumeIds`/`getProperties`/`setProperties`). `b5784ca80` guards flag **reads** but does not forbid
the dual-flag combo. The intended path is `useNextViewports` alone.

### Coverage debt (gates honest M4/M5/M6/M7 sign-off)

**OHIF native-path automated coverage is ~zero, and worse than "no spec exists":** the only OHIF test is
`getCornerstoneViewportType.test.ts` (22 mapping cases, mocks `@cornerstonejs/core`). Critically, the
OHIF Playwright suite runs `config/e2e.js` (`playwright.config.ts:48`), which does **not** set the flag —
so even though `config/default.js:6` turns it on, the **entire 75+ spec e2e suite exercises the legacy
backend**. Turning on `default.js` gives a *false* sense of native coverage. A native lane needs an
`e2e-next.js` config + a Playwright project/CI job.

**Cornerstone is far better covered than the prose implied:** `tests/genericViewport` has **~18
Playwright specs** (stack/volume GPU+CPU, video, ECG, WSI, fusion, labelmap-seg, manipulation,
annotation, scale, projection). The real cornerstone gaps are specifically **crosshairs, cine, and true
3D-VR interaction** (none covered), plus the `genericViewportShowcase` example (`948281359`) having no
driving spec. The OHIF↔cornerstone integration layer is entirely untested e2e. Dual-CI-lane +
presentation-snapshot validation remains unbuilt.

### Remaining work — consolidated punch-list (verified at HEAD)

Ordered by how much it blocks a real native release. "OHIF" / "CS" / "both" = where the fix lives.

**Blockers (a native viewport is broken / a milestone cannot close):**
1. **M4 native labelmap (OHIF).** Add an `isGenericViewport` branch in
   `addSegmentationRepresentation`'s LABELMAP dispatch (`SegmentationService.ts:1597/1644`) so a native
   `PLANAR_NEXT` viewport renders the labelmap **in place** instead of routing to
   `convertStackToVolumeViewport` — which both calls absent `get/setViewPresentation` (`:1731/:1738`)
   **and** promotes to `ORTHOGRAPHIC` (`:1758`). Rides cornerstone CS-13 (done). The single real native
   crash and the largest remaining feature.
2. **M7 native e2e lane (OHIF).** Add an `e2e-next.js` config (sets `useNextViewports:true`) + a
   Playwright project/CI job. Until this exists, **no** OHIF e2e touches the native backend
   (`config/e2e.js` lacks the flag), so M4/M5/M6 cannot be signed off honestly.

**Major (feature missing or visibly wrong on native, but no crash):**
3. **M6 VR-menu footgun (OHIF).** `isVolume3DViewportType` is false for native `VOLUME_3D_NEXT`, so
   `WindowLevelActionMenu` hides all four VR ops AND renders 2D controls on a 3D viewport
   (`:69/71/82` vs `:92/94`); same root cause mis-branches SEG-over-3D to Labelmap
   (`commandsModule.ts:322-328`). Fix `isVolume3DViewportType` (used ~10 sites — verify each).
4. **M3 native volume appearance (OHIF).** Port `useViewportRendering` pixel-range/opacity/threshold
   (`:220/574/625`) and the per-volume WL panel (`utils.ts:108 TODO`) off `isVolumeViewportType` to a
   native volume-id resolver / `getViewportProperties` bridge so they work (not just no-op) on native.
5. **M2/M5 native fusion (both).** (a) Runtime-validate PT/CT fusion rendering (keying is correct;
   opacity-TF/blend/z-order + CS-22 unproven). (b) Native `WindowLevelTool` targets the **source** via
   `getSourceDataId` (`:391`), so the PT overlay role is unreachable — needs a role/displaySet-addressable
   tool-targeting API + tmtv config rewrite off `cornerstoneStreamingImageVolume:${uid}` strings.
6. **M5 crosshairs ROTATE + slab (CS).** Native oblique-orientation write + slab/blend API for
   `GenericViewport` (`CrosshairsTool.ts:2286-2288`, `:2401-2402`, `:2599-2601` early-return today).
7. **M5/CS-9 4D dynamic cine (CS).** `playClip._getVolumeFromViewport` (`:361-366`) duck-type the
   generic viewport + a time-point context — breaks `preclinical-4d` on native today.
8. **CS-6 part 2 (CS).** Emit `VOLUME_VIEWPORT_NEW_VOLUME` (or a documented native equivalent) from the
   native `setDisplaySets` path for BOTH `PLANAR_NEXT` volume and `VOLUME_3D_NEXT`.
9. **M6 video/WSI/ECG live validation (both).** Mounts are code-complete (`ca746e2f0`); never run against
   a real study — need test data on a reachable dicomweb.
10. **M7 wire the flag-read guard into CI (OHIF).** `yarn next:check-flag-reads` exists but nothing runs
    it; add it to CI / lint-staged.
11. **M4 RTSTRUCT contour native e2e (OHIF).** Cheapest M4 case, code path looks native-clean (CS-8
    landed) — needs a verification pass.

**Minor / cleanup:** centerOnMeasurement in-plane re-center (`NextViewportOperations.ts:104-109`, both);
crosshairs auto-pan (CS); `DataIdRegistry.dataIdFor('overlay')` wiring for M4 labelmap (OHIF);
stale "two sanctioned reads" comments + `IViewportOperations.ts:22` "ignored on native" JSDoc (OHIF);
RTSTRUCT hardcoded `viewportType:'stack'` (cosmetic, OHIF); DataIdRegistry GC unit test (OHIF);
CS-16 union widening; CS-20 ergonomics; CS-21 single-point-SCOORD3D residual; cornerstone
crosshairs/cine/3D-VR specs + `genericViewportShowcase` driving spec (CS); the §4.3 mount-body
relocation (OHIF, deferred behavior-preserving refactor); the destructive M7 reverts (flip
`default.js`, remove the toggle/override scaffolding — gated on the native path being complete).

### Corrections to the prior same-day audit (refuted / narrowed on verification)

- **Per-volume Window-Level panel does NOT throw on native.** It is guarded by `d28202610`
  (`getWindowLevelsData → []`), so the panel shows "No window level data available" and both
  `ViewportWindowLevel.tsx:119/133` handlers are unreachable. The earlier "two WL-panel native throws"
  finding is wrong; the real item is the feature port (`utils.ts:108`).
- **CS-21's stated trigger is unreachable.** SR/RT hydration always attaches a `planeRestriction`
  (`hydrateStructuredReport.ts:353`), so the "null-orientation, no-planeRestriction 3D SCOORD3D" case
  never occurs; only single-point SCOORD3D is residual, and the open code is the WRITE path
  `PlanarViewReferenceController.ts:496-513` (not `planarViewReference.ts`).

### Learnings & corrections to the original plan

- **§4.2 / §4.3 / §6 are wrong on "constructor selection."** The backend is chosen by a **lazy
  first-use getter**, not the constructor. Reason: the `CornerstoneViewportService` singleton is
  constructed during extension **registration**, which runs **before** `init.tsx` calls
  `setNextViewportsEnabled(...)`; a constructor read captures the default (`false`) and wrongly picks
  the legacy backend. The first mount (first getter read) always happens after init. The "two
  sanctioned flag reads" lint rule still holds; read #2's location is the getter.
- **§4.3 — M0 delegated rather than relocated.** The interface is intentionally minimal
  (mount-dispatch + dataId lifecycle); legacy/next mount **bodies** and the presentation read/write
  fork remain shared in the service. "Move-only legacy" was refined to "delegate to unchanged service
  methods" to guarantee a byte-identical off-path without risky body moves. Literal body relocation +
  presentation-fork extraction are deferred to a later behavior-preserving increment.
- **§4.4 — `is*ViewportType` / `getLegacyViewportType` guards are blind to native viewports.**
  `getLegacyViewportType = viewport.requestedType ?? viewport.type`; the native path never sets
  `requestedType`, so a native viewport reports `PLANAR_NEXT` and
  `isStack/Volume/OrthographicViewportType` all return `false`. Do **not** globally "fix"
  `getLegacyViewportType` (call sites would then invoke legacy `getProperties`/`setStack`/`setCamera`
  and crash). Branch per-call-site on cornerstone **content/capability** predicates
  (`csUtils.viewportIsInVolumeMode`/`viewportIsInStackMode`/`isGenericViewport`). This is the dominant
  recurring migration chore.
- **§4.7 — data-build seam.** `CornerstoneCacheService.getViewportData` must call
  `getCornerstoneViewportType(type, ds, /*native*/ false)` (the **legacy** mapping) to pick the
  stack-vs-volume data **builder**, because the native mapping collapses both to `PLANAR_NEXT` and
  would route to the wrong builder (`PlanarViewport.setDisplaySets` then throws "No registered planar
  dataset metadata"). This is a second, distinct sanctioned use of the type mapper the "two flag
  reads" rule must accommodate.
- **§5 — native render path is CPU by default.** The native `PLANAR_NEXT` stack mount renders through
  `CpuImageSliceRenderPath`: the **visible** element is `cpuCanvas`, while `vp.canvas` /
  `.cornerstone-canvas` (the VTK canvas) is `display:none`. Any sizing/canvas-introspection code must
  measure from `vp.element`, not `getOrCreateCanvas(vp.element)` or `vp.canvas`. This invalidates the
  assumption that `vp.canvas` is the on-screen surface and was the root cause of the panel-resize bug.
- **§5 — `CAMERA_MODIFIED` did NOT fire on initial native mount.** It fires on `setViewState`, but a
  mount-time `CAMERA_MODIFIED` (role `source` only) had to be added to `PlanarViewport` so OHIF
  overlays/markers paint on load without interaction.
- **§5 — stack prefetch is a two-part fix.** A cornerstone capability gate (replace
  `instanceof StackViewport` with `viewportSupportsImageSlices`) **and** OHIF calling
  `stackContextPrefetch.enable` on the native mount; the native path does not inherit prefetch.
- **§5 — native viewports don't auto-apply a metadata default VOI.** OHIF must seed it from
  `voiLutModule` on mount (general, all studies). Distinct from the sigmoid/`voiLUTFunction`
  render-path fix (cornerstone-side, only affects SIGMOID studies); the LINEAR test study's parity
  comes entirely from the metadata-seeded default VOI.
- **§5 — `BaseTool.getTargetId` throws when `getViewReferenceId()` is falsy.** Native viewports
  legitimately return `null` pre-data, which breaks `AnnotationDisplayTool`s that render
  unconditionally (e.g. `ImageOverlayViewerTool`). Short-term: per-tool OHIF guards. Clean fix
  (deferred): harden `getTargetId` / `annotationHydration` upstream to return `undefined`.
- **Dev workflow.** OHIF bundles cornerstone `dist/esm`, not `src` — cornerstone edits need
  `pnpm --filter @cornerstonejs/core run build:esm` + a manual OHIF reload (rsbuild does not HMR
  `node_modules`); verify a sentinel log reached the served bundle before trusting an edit.
- **TEMP scaffolding the lint/grep rule must whitelist (§4.2).** `nextViewports.ts` override helpers,
  the `getToolbarModule` toggle evaluator, and the `modes/basic` toolbar button are
  remove-before-merge; `TODO_BEFORE_MERGE.md` is the cleanup tracker.
- **§4.4 deepened — `getLegacyViewportType` cannot distinguish native stack from native MPR.** OHIF's
  `getCornerstoneViewportType` pre-maps `stack`/`volume`/`orthographic` all to `PLANAR_NEXT` *before*
  handing the type to cornerstone, so `requestedType` ends up `PLANAR_NEXT` (not STACK/ORTHOGRAPHIC) and
  `getLegacyViewportType` returns `PLANAR_NEXT` for **both** content shapes. The legacy-type guards
  therefore conflate "not native-volume" with "not a volume at all" — never use them as a native-content
  discriminator; use cornerstone's `viewportIsInVolumeMode`/`getCurrentMode` instead.
- **§4.2 contract already exceeded.** The "exactly two sanctioned flag reads" invariant is violated:
  8 files in `extensions/cornerstone/src` read `useNextViewports`/`isNextViewportsEnabled` — the 2
  sanctioned (`getCornerstoneViewportType`, the `CornerstoneViewportService` backend getter) PLUS the
  backend trio (`NextViewportBackend`/`IViewportBackend`/`LegacyViewportBackend`) PLUS the 3 M7-throwaway
  scaffolding files. The lint rule §4.2 prescribes must be redefined to whitelist the backend reads
  before it can be written.
- **dicom-microscopy WSI is correctly out of scope.** `extensions/dicom-microscopy` uses OpenLayers
  (`dicom-microscopy-viewer`) and bypasses the cornerstone rendering engine — only the cornerstone WSI
  path (`WHOLE_SLIDE_NEXT`) is the M6 target.

---

## 2. The architectural inversion (why this is more than a method rename)

In the legacy world, the **viewport type encodes the data shape**: `STACK` viewports take
`setStack(imageIds)`, `ORTHOGRAPHIC` viewports take `setVolumes([{ volumeId }])`. OHIF chooses the
type up front and the type dictates the data API.

In cornerstone-next, **one `PLANAR_NEXT` viewport renders both**, and the **render path is inferred
from the data**:

```
displaySetId
  -> genericViewportDataSetMetadataProvider.add(id, { kind:'planar', imageIds, initialImageIdIndex, volumeId? })
  -> viewport.setDisplaySets({ displaySetId, options:{ orientation, role } })
  -> render path inferred: no volumeId + ACQUISITION => image/stack path; volumeId or reformatted orientation => volume-slice path
  -> view state (pan/zoom/rotate/flip/slice/displayArea) via setViewState / viewportProjection
  -> per-binding appearance (VOI/colormap/invert/opacity/visible) via setDisplaySetPresentation(displaySetId, ...)
```

Two ownership splits follow:

- **View presentation** (pan, zoom/scale, rotation, flips, displayArea) lives in `viewState`,
  mutated only through `setViewState`/`updateViewState`/`resetViewState` (or
  `viewportProjection.withPresentation(...) -> setViewState`).
- **Data presentation** (VOI, colormap, invert, opacity, blend mode, interpolation, visibility) is
  **per mounted display set** via `setDisplaySetPresentation(displaySetId, props)`. This is what
  lets a CT source and PET overlay share one view but keep independent windowing/color.

### 2.1 The decisive fact: how to get a *native* viewport **[VERIFIED]**

`packages/core/src/RenderingEngine/helpers/viewportTypeToViewportClass.ts` registers:

```ts
registerViewportType({
  type: ViewportType.PLANAR_NEXT,
  ViewportClass: PlanarViewport,                 // <- native class
  resolveClass: ({ type, requestedType }) =>
    type === ViewportType.PLANAR_NEXT &&
    (requestedType === ViewportType.STACK || requestedType === ViewportType.ORTHOGRAPHIC)
      ? PlanarViewportLegacyAdapter               // <- legacy shim ONLY in this case
      : undefined,
});
```

Consequences that anchor the whole plan:

1. If OHIF calls `enableElement({ type: PLANAR_NEXT })` **without** setting `requestedType` to a
   legacy type, it gets the **pure `PlanarViewport`** — the legacy methods (`setStack`,
   `setProperties`, `getCamera`, `setCamera`, …) are **genuinely absent** (calling them is a
   `"… is not a function"` TypeError, not a deprecation warning). This is exactly the surface we
   target, and it is why the tool/command blockers in Section 5 are real, not theoretical.
2. The `useGenericViewport` remap works precisely by requesting a legacy type (`STACK`) that
   cornerstone re-routes to runtime `PLANAR_NEXT` while preserving `requestedType: STACK`, which
   selects `PlanarViewportLegacyAdapter`. **That is the path we forbid.** Our flag must request
   `PLANAR_NEXT` directly.
3. A natively-created `PLANAR_NEXT` viewport therefore carries **no legacy `requestedType`**. Any
   OHIF helper that reads `viewport.requestedType ?? viewport.type` to decide "stack vs volume"
   (the ~67-consumer `getLegacyViewportType` helper) will see `PLANAR_NEXT` for both — see §4.4 for
   how OHIF sidesteps this with its own `ViewportInfo` type tracking.

### 2.2 Native `PlanarViewport` surface that already works **[VERIFIED]**

- Data: `setDisplaySets(...entries)`, `addDisplaySet(id, options)`, `removeData(dataId)`
  (note: **no** `removeDisplaySet`/`getDisplaySets` enumerator — removal is by id, the only listing
  accessor is `getSourceDataId()`).
- Presentation: `setDisplaySetPresentation(props | (displaySetId, props))`,
  `getDisplaySetPresentation(displaySetId)`.
- View state: `getViewState()` / `setViewState(patch)` / `updateViewState(updater)` /
  `resetViewState(opts)` — and `PlanarViewState` carries **`orientation`, `slice`, `anchorWorld`,
  `anchorCanvas`, `scale`, `scaleMode`, `rotation`, `flipHorizontal`, `flipVertical`,
  `displayArea`**. So pan (anchor), zoom (`scale`), rotation, flips and displayArea all round-trip
  through view state. `getScale`/`setScale` are native; `getPan`/`setPan`/`getZoom`/`setZoom` exist
  but are `@deprecated` shims.
- Navigation: `setImageIdIndex` (stores `stackIndex` for image data, resolves a `volumePoint` for
  volume data), `getCurrentImageIdIndex`/`getSliceIndex`, `getImageIds`.
- Spatial: `getViewReference` / `setViewReference` / `getViewReferenceId` / `isReferenceViewable`,
  `getResolvedView()` (exposes `toICamera()` — the native replacement for `getCamera()`),
  `canvasToWorld` / `worldToCanvas`, `getFrameOfReferenceUID`.
- Events that fire natively **[VERIFIED]**: `CAMERA_MODIFIED` (on `setViewState`), `CAMERA_RESET`
  (on `resetViewState`), plus `IMAGE_RENDERED` and `DISPLAY_AREA_MODIFIED` [from investigation].

---

## 3. OHIF surface area (what couples to the legacy viewport API)

The good news: OHIF is already mid-cleanup. Raw `instanceof StackViewport/VolumeViewport` checks
are gone, `getStackViewports`/`getVolumeViewports` are gone, and type branching is already funneled
through two helpers (`getCornerstoneViewportType`, `getLegacyViewportType`). The imperative
cornerstone-viewport calls are concentrated in **one service**.

- **`extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts`** (1610
  lines) — the only object that drives the imperative viewport API (`setStack`, `setVolumes`,
  `setProperties`, `getCamera`/`setCamera`, `setDisplayArea`, presentation get/set). **This is the
  seam.**
- **`extensions/cornerstone/src/utils/getCornerstoneViewportType.ts`** — the single chokepoint
  mapping OHIF type strings (`stack`/`volume`/`orthographic`/`volume3d`/`video`/`wholeslide`/`ecg`)
  to `Enums.ViewportType`. **[VERIFIED]** it already prefers `displaySets[0].viewportType`. This is
  where the flag flips the requested type.
- **`extensions/cornerstone/src/utils/getLegacyViewportType.ts`** (+ `isStack*`/`isVolume*`
  guards, ~67 consumers) — reads `requestedType ?? type`; misclassifies native `PLANAR_NEXT`.
- **`extensions/cornerstone/src/commandsModule.ts`** (~99 KB) — window-level/VOI, colormap, invert,
  flip, rotate, zoom, reset, jump-to-slice, jump-to-measurement, 3D VR presets via raw vtk actors.
- **`extensions/cornerstone/src/hooks/useViewportRendering.tsx`** + overlays
  (`CustomizableViewportOverlay`, `ViewportOrientationMarkers`, `ViewportImageScrollbar`,
  `ViewportSliceProgressScrollbar`) — read live state (`getProperties().voiRange`, `getZoom()`,
  `getCamera().viewPlaneNormal`) and subscribe to element events.
- **Presentation stores** (`extensions/cornerstone/src/stores`, `getPresentationIds`) +
  **synchronizers** (`SyncGroupService`, `extensions/cornerstone/src/synchronizers`).
- **`SegmentationService`** — legacy single-viewport `addSegmentationRepresentations` +
  `convertStackToVolumeViewport`.
- **`CornerstoneCacheService`** — builds the stack vs volume data the service mounts (the actual
  data-build seam feeding `setDisplaySets`).

Existing flag wiring **[VERIFIED]**: `appConfig.useGenericViewport` exists (`AppTypes.ts:105`,
`init.tsx:80`) and activates cornerstone's legacy remap. We add a sibling flag; we do **not** reuse
this one.

---

## 4. OHIF architecture: the opt-in native-next seam

### 4.1 Strangler-fig principle

Additive from the community's perspective: do not rewrite the stack/volume paths — **move** them
byte-for-byte behind one boundary and grow a second implementation alongside. One flag selects which
runs. Flag off (default) = today's behavior exactly; nobody is force-broken. The native path can
ship incomplete (unmigrated families fall back to legacy) without regressing anyone.

### 4.2 The flag

Add **`appConfig.useNextViewports`** (boolean, default `false`) next to `useGenericViewport` in
`platform/core/src/types/AppTypes.ts`, read in `extensions/cornerstone/src/init.tsx`.

- It does **not** set cornerstone's `rendering.useGenericViewport`.
- It tells OHIF to (a) request `*_NEXT` types natively and (b) drive them with the native API.
- The two flags are mutually exclusive in intent (`useGenericViewport` = legacy methods over
  remapped viewports; `useNextViewports` = native methods over native `*_NEXT` viewports).
  Document that `useNextViewports` overrides/ignores `useGenericViewport`.

The flag was *intended* to be read in exactly two places (`getCornerstoneViewportType` type selection +
`CornerstoneViewportService` backend selection). **In the built implementation this contract is already
exceeded** — the backend trio (`NextViewportBackend`/`IViewportBackend`/`LegacyViewportBackend`) reads
it legitimately, so 8 files read it in total (incl. the M7-throwaway scaffolding). The lint/grep CI rule
must be (re)defined to whitelist the sanctioned set including the backend reads before it can be written;
it cannot be the strict "two reads" rule as originally specified.

### 4.3 Backend split inside `CornerstoneViewportService`

Extract two collaborators behind a small interface, selected once in the constructor:

| Concern | Shared (stays in service) | Forked (`legacyBackend` vs `nextBackend`) |
|---|---|---|
| Element registration / resize / destroy / find / navigation helpers | yes | — |
| `setViewportData` front door, `_setDisplaySets` shell | yes | dispatch only |
| Stack mount (`_setStackViewport`) | — | yes |
| Volume / 3D mount (`_setVolumeViewport` / `setVolumesForViewport`) | — | yes |
| ECG mount (`_setEcgViewport`) | — | yes |
| Video / WSI mount (`_setOtherViewport`) | already native (`setDisplaySets`) | shared template |
| Presentation read (`_getPositionPresentation` / `_getLutPresentation`) | — | yes |
| Presentation write (`_setLutPresentation` / `_setPositionPresentation`) | — | yes |
| `updateViewport` keep-camera | — | yes |

- **`legacyBackend`** is a *move-only* extraction (cut/paste of the exact current bodies, zero
  behavioral change) — runs when the flag is off and must stay byte-identical.
- **`nextBackend`** is the new implementation using the §2.2 native surface. `_setOtherViewport` is
  the proof-of-shape: it already does `await viewport.setDisplaySets({ displaySetId })` +
  `setViewReference(...)` for VIDEO/WHOLE_SLIDE inside this very service.

### 4.4 Viewport-type selection: `'stack'`/`'volume'` collapse onto `PLANAR_NEXT`

Under `useNextViewports`, `getCornerstoneViewportType` maps:

- `'stack'` → `PLANAR_NEXT`
- `'volume'` / `'orthographic'` → `PLANAR_NEXT`
- `'volume3d'` → `VOLUME_3D_NEXT`, `'video'` → `VIDEO_NEXT`, `'wholeslide'` → `WHOLE_SLIDE_NEXT`,
  `'ecg'` → `ECG_NEXT`

**No hanging protocol or mode edits are required** — they keep emitting `'stack'`/`'volume'`
strings through this one chokepoint.

The stack-vs-volume decision moves to the **data layer**: keep building a cached volume (`volumeId`)
for reconstructable/MPR/3D display sets in `CornerstoneCacheService` exactly as today (that decision
is modality/`isReconstructable`-driven, not type-driven). Then register the dataset and mount it;
`ACQUISITION` orientation → image/stack path, `AXIAL/SAGITTAL/CORONAL` → volume-slice path.

**Type discrimination after the switch.** A native `PLANAR_NEXT` viewport reports `type ===
PLANAR_NEXT` with no legacy `requestedType`, so `getLegacyViewportType` (read off the cornerstone
viewport) would misclassify. The mitigation is that **OHIF already stores its own requested type on
`ViewportInfo`** (`getViewportType()` returns the OHIF string/legacy enum). The React overlays and
service branches read that OHIF-owned value, not the runtime cornerstone type — so they survive both
backends untouched **as long as we preserve that invariant**. Code that only holds a *cornerstone*
viewport handle (mostly tools/utils) still needs a content/capability predicate from cornerstone
(blocker CS-5 / CS-17).

### 4.5 Presentation store/restore → viewState / DataPresentation / viewReference

The store **keys** (`getPositionPresentationId`, `getLutPresentationId`) are viewport-agnostic and
**do not change**. Only the read/write channel forks:

- **PositionPresentation** (camera/zoom/pan/slice): `getViewReference` / `setViewReference` /
  `isReferenceViewable` are **already native — keep them**. The pan/zoom portion moves from
  `getViewPresentation`/`setViewPresentation` to `getViewState`/`setViewState` (or
  `viewportProjection.getPresentation`/`withPresentation` → `setViewState`). The
  `PositionPresentation` type already stores a `ViewReference` + a presentation blob, so the schema
  survives.
- **LutPresentation** (VOI/colormap/invert): from `getProperties([volumeId])` /
  `getAllVolumeIds()` → `getDisplaySetPresentation(displaySetId)` /
  `setDisplaySetPresentation(displaySetId, { voiRange, colormap, invert, … })`. **Re-key the store
  by `displaySetInstanceUID`** instead of `volumeId`.
- **displayArea / rotation / flip**: today three separate legacy calls (`setDisplayArea`,
  `setProperties({rotation})`, `setCamera({flipHorizontal})`); in the next path they fold into a
  single `setViewState({ displayArea, rotation, flipHorizontal, flipVertical })` — **[VERIFIED]**
  all four are `PlanarViewState` fields.

`updateViewport` keep-camera becomes a `getViewState()`/`setViewState()` snapshot-restore.

### 4.6 React layer + overlays

The React layer is thin and stays shared: `OHIFCornerstoneViewport` only calls service-level
`enableViewport` + `setViewportData`. The risk concentrates in **overlays / `useViewportRendering`**,
which read live state and subscribe to element events:

- **State reads** route through `viewportProjection.getPresentation()` / `getViewState()` /
  `getDisplaySetPresentation()` (and `canvasToWorld`, already native). Centralize these in
  `useViewportRendering` so overlays consume an OHIF-shaped object regardless of backend.
- **Type branches** keep working because they read OHIF's `ViewportInfo.viewportType`, not the
  runtime type (preserve this invariant — §4.4).
- **Events** are the largest blocked-on-cornerstone risk — see CS-1 and CS-6.

### 4.7 Data-build seam (`CornerstoneCacheService`) and `dataId` lifecycle

The `nextBackend` owns a thin wrapper over `genericViewportDataSetMetadataProvider.add/remove`:

- **`dataId` scheme**: deterministic and unique, derived from `displaySetInstanceUID` (+ an overlay
  suffix for fusion / labelmap overlays). This makes cornerstone's `dataId` equal to OHIF's
  `displaySetInstanceUID`, which is also the key the LUT presentation store now uses.
- **Cleanup**: call `.remove(dataId)` on unmount. Cornerstone's `removeData`/`setDisplaySets` do
  **not** GC the global registration store (blocker CS-18), so OHIF must own this discipline.
- **Shared-volume case** (MPR triptych shares one `volumeId`): ref-count the registration, or scope
  registration per viewport, so unmounting one pane does not unregister data another still uses.
  (This is an OHIF-owned invariant; design it in M0.)

---

## 5. Cornerstone-side work (fixes that belong in cornerstone3D, **not** OHIF)

Consolidated and de-duplicated from the investigation. Severity reflects the **verified** native
path (OHIF requesting `PLANAR_NEXT` directly, per §2.1). Re-pin all cornerstone `file:line`
references against the pinned 5.0.x build before opening PRs.

> **STATUS (2026-06-19):** This register is the original analysis; the per-blocker verdict now lives in
> "Cornerstone-side blockers (§5) — actual status" above. Most blockers below — CS-1, CS-3, CS-7, CS-8,
> CS-9, CS-10, CS-11, CS-12, CS-13, CS-14, CS-15, CS-19, CS-22 — are now DONE/committed; only **CS-6
> part 2, CS-16 union, CS-21** remain genuinely open (CS-20 is an optional cornerstone ergonomic; OHIF
> drives ECG/video/WSI itself), and **CS-18 is solved OHIF-side**. The
> "single biggest blocker" / "biggest open blocker" language below predates those landings.

### Blockers (gate the core planar milestones)

- **CS-1 — `setDisplaySetPresentation` emits no event. [VERIFIED]**
  `GenericViewport.setDataPresentationState` (`GenericViewport.ts:567-582`) calls
  `binding.updateDataPresentation(props)` and never `triggerEvent`. `COLORMAP_MODIFIED` fires only
  from the legacy controller. OHIF's VOI sliders, colorbar, W/L text, invert/opacity/visibility
  controls, and VOI sync groups are entirely event-driven, so they go stale after any programmatic
  or tool-driven presentation change. **Fix:** after `updateDataPresentation`, diff and
  `triggerEvent` `VOI_MODIFIED` (voiRange/invert), `COLORMAP_MODIFIED` (colormap), and a generic
  `VIEWPORT_DATA_PRESENTATION_MODIFIED` carrying the full delta + `displaySetId` (planar bindings
  are multi). **[DONE — `5635bdab4`: `setDisplaySetPresentation` now emits `VOI_MODIFIED`/
  `COLORMAP_MODIFIED` via `mergeDataPresentation` → `notifyDataPresentationModified`. This was the
  original "single biggest blocker"; it is closed.]**

- **CS-6 — slice / new-volume events on `PLANAR_NEXT`.** Volume-backed slices emit
  `STACK_NEW_IMAGE`, never `VOLUME_NEW_IMAGE`; `VOLUME_VIEWPORT_NEW_VOLUME` fires only from the
  legacy controller. OHIF volume scroll indicators, MPR slice sync, segmentation slice tracking, and
  per-volume init never run. **Fix:** emit `VOLUME_NEW_IMAGE` for volume-backed slices and
  `VOLUME_VIEWPORT_NEW_VOLUME` on the native add path (or define documented native equivalents and a
  stable one-event-set mapping). Confirm `STACK_VIEWPORT_SCROLL` and `ELEMENT_ENABLED` fire for
  natively-created viewports.

- **CS-7 — `getNumberOfSlices()` absent on native `PlanarViewport`.** `utilities/jumpToSlice.ts`
  takes the volume branch for a non-`StackViewport` and calls `getNumberOfSlices()` → TypeError.
  Breaks programmatic jumps and every image-slice synchronizer targeting a `PLANAR_NEXT` viewport.
  **Fix:** add native `getNumberOfSlices()` (promote the adapter impl), and make
  `jumpToSlice`/`_getImageSliceData` duck-type on `getNumberOfSlices`/`getSliceIndex` instead of
  `instanceof StackViewport`.

- **CS-8 — tools call `getCamera()`/`setCamera()`/`resetCamera()` unconditionally.** Crosshairs,
  ReferenceLines, ReferenceCursors, contour display, and `cameraSyncCallback` throw immediately on
  `PLANAR_NEXT`. **Fix (pick one repo-wide):** (a) promote native `getCamera`/`setCamera`/
  `resetCamera` onto `GenericViewport` delegating to `getResolvedView().toICamera()` (read) and
  `setViewState`/`setOrientation` (write) — unblocks everything at once; or (b) migrate each tool to
  `getResolvedView().toICamera()` + `setViewReference`/`setViewState` (the labelmap chain already
  does this). `cameraSyncCallback` should mirror `zoomPanSyncCallback`'s projection fallback.

- **CS-9 — cine `playClip` threw `'Unknown viewport type'` on `PLANAR_NEXT`. [DONE — `7d13b013f`]**
  `_createCinePlayContext` only branched `instanceof Stack/Volume/Video`; a `PLANAR_NEXT` cine context
  (duck-type `scroll`/`getSliceIndex`/`getNumberOfSlices`) was added, so it no longer throws and degrades
  to slice-scroll. **Residual:** 4D dynamic/time-point cine is still unsupported on native
  (`_getVolumeFromViewport` returns undefined for a non-`VolumeViewport`) — breaks `preclinical-4d`.

- **CS-10 — Crosshairs/ReferenceLines assume `ORTHOGRAPHIC` volume viewports.** Tool internals
  branch on `instanceof VolumeViewport` / `type === ORTHOGRAPHIC`. **Fix:** detect viewport
  capability (volume actor / orthographic slicing) via capability API and resolve source/target
  geometry via view references. (Tool-internal counterpart to CS-8.)

- **CS-3 — `setDisplaySets`/`addDisplaySet` must be idempotent & incremental.** `setDisplaySets`
  calls `removeAllData()` first, so a naive re-set blanks sibling actors (MPR blanks during SEG
  hydrate — today OHIF hand-rolls a `getActors()` class-name add-vs-set heuristic that native OHIF
  cannot reproduce). **Fix:** re-setting the same source keeps existing overlay (segmentation)
  actors; adding a display set does not rebuild existing ones. Lets OHIF delete the actor
  introspection and the `setTimeout(cb,0)` actor-ready hack.

- **CS-4 — data-inferred render path + OHIF's multi-input shapes.** Confirm/define that
  `PLANAR_NEXT.setDisplaySets({ displaySetId, volumeId?, imageIds, orientation })` renders a stack
  with no `volumeId` and an MPR slice with one, accepts OHIF's multi-input shapes (imageIds +
  initialImageIndex; arrays of volume inputs for fusion), and accepts an OHIF
  `displaySetInstanceUID` as the id. Make `setStack`/`setVolumes` fully replaceable.

- **CS-5 — no content/mode predicate.** A native `PLANAR_NEXT` viewport passes **both**
  `viewportSupportsImageSlices` and `viewportSupportsVolumeId` regardless of what it currently
  displays (the guards test method presence, not content), and collapses STACK+ORTHOGRAPHIC into one
  `.type`. **Fix:** add a runtime content predicate (`getCurrentMode(): 'stack'|'volume'|'empty'`,
  `getVolumeId()`/`hasVolumeId()` reflecting bound content) and/or content-aware capability queries.
  *OHIF mitigates the common case via `ViewportInfo` (§4.4); this is needed for cornerstone-handle-
  only code.*

### Major (gate specific milestones; OHIF can interim-cast or defer)

- **CS-11 — synchronizers must drive native APIs.** `createImageSliceSynchronizer` (slice nav via
  `setViewReference({ sliceIndex })` + native slice event; depends CS-6/CS-7) and
  `createVOISynchronizer` (propagate via `setDisplaySetPresentation`, react to the new presentation
  event; depends CS-1). `createZoomPanSynchronizer` already prefers `viewportProjection` and works
  on `PLANAR_NEXT` today.
- **CS-13 — volume-labelmap slice rendering on `PLANAR_NEXT` without stack→volume promotion.**
  Ensure `addLabelmapRepresentationToViewportMap` + `useSliceRendering` fully renders volume
  labelmaps as slices in-place, plus a capability query for "needs promotion", so OHIF can drop
  `convertStackToVolumeViewport`. (Render chain is already `PLANAR_NEXT`-aware; the add path and
  `VOLUME_VIEWPORT_NEW_VOLUME` emission are the gaps.)
- **CS-14 — native VR API for `VOLUME_3D_NEXT`.** OHIF's 3D toolbar reaches into raw vtk via
  `getActors()[0].actor.getProperty()/getMapper()` for preset/quality/lighting/opacity. **Fix:**
  provide native methods (or `setDisplaySetPresentation` fields) for VR preset, sample distance,
  shading, and scalar-opacity edits — or guarantee a stable `getActors()` contract.
- **CS-15 — generic MPR orientation change + graceful degrade.** `setViewportOrientation` is gated
  on legacy volume types, and requesting an MPR orientation on a non-volumeable dataset **throws**
  in `PlanarRenderPathDecisionService.select()`. **Fix:** support orientation via view
  state/`setOrientation` on generic viewports; expose `canRenderOrientation(dataId, orientation)` or
  degrade to ACQUISITION with a warning event instead of throwing.
- **CS-16 / CS-17 — types & narrowing.** Widen `IEnabledElement.viewport` to include the
  generic-next interface (today `IStackViewport | IVolumeViewport` forces casts); newly-optional
  `CameraModifiedEventDetail.element` / `CameraResetEventDetail.element` / `FrameOfReferenceUID`
  need null-checks OHIF-side. Ship a single `isGenericViewport(vp)` narrowing guard +
  content-capability utilities so OHIF replaces the `getLegacyViewportType` shim with capability
  branching.
- **CS-12 — native spacing calibration. [DONE — `d299fb659`]** `viewportSupportsStackCalibration`
  returned false for native `PLANAR_NEXT` (`calibrateSpacing` was adapter-only). Added native
  `PlanarViewport.calibrateSpacing(imageId)` (re-render + `IMAGE_SPACING_CALIBRATED` event) and merged
  the user `calibratedPixelSpacing` into `buildPlanarImageData`'s `getImageData().calibration` (mirrors
  legacy `{ ...csImage.calibration, ...this.calibration }`). `calibrateImageSpacing` now routes to
  native; length tools rescale. Validated live.
- **CS-21 — view-reference resolution on `*_NEXT` (SR/RT navigation).** SR and RTSTRUCT
  jump-to-measurement hand `setViewReference` a reference that may carry **only**
  `{ referencedImageId }` (2D SCOORD), a `planeRestriction` (oblique), or a 3D SCOORD3D reference
  with a focal point but **null `viewPlaneNormal`/`viewUp`** (`hydrateStructuredReport.ts`
  `chooseCameraView`). **Fix:** ensure native viewports' `setViewReference` resolves a
  `referencedImageId` to the right slice (stack), honors `planeRestriction`, and deterministically
  fills a default camera orientation when orientation is null — matching legacy. Without this, SR/RT
  navigation silently fails to position. (Major.)
- **CS-22 — fusion data-presentation: colormap + multi-point opacity transfer function on a
  non-segmentation overlay.** PT/CT fusion, **PMAP**, and tmtv apply a colormap *plus a multi-point
  opacity transfer function* plus VOI to the **second (overlay) volume** only. The native
  `setDisplaySetPresentation` API targets a binding by id (so per-display-set keying exists), but
  whether it accepts a full multi-point opacity transfer function for a *non-segmentation* fusion
  volume needs confirmation. **Fix:** guarantee `setDisplaySetPresentation(overlayId, { colormap
  (with opacity points), voiRange })` drives a fusion overlay without `volumeId` resolution, and
  (with CS-1) emits a presentation-modified event so the colorbar/VOI-sync update. (Major; gates
  PMAP + tmtv fusion.)

### Minor

- **CS-18 — registration store**: no schema validation, single process-global namespace, no GC on
  `removeData`. Add per-kind validation, viewport-scoped or ref-counted registration, and removal on
  unmount. (OHIF owns discipline short-term — §4.7.)
- **CS-19 — per-mount force-CPU/GPU**: add a `renderTarget`/`forceCPU` field to
  `PlanarSetDataOptions` (today CPU/GPU is global or threshold-based only).
- **CS-20 — `ECG_NEXT` / `VIDEO_NEXT` / `WHOLE_SLIDE_NEXT` load ergonomics**: ECG loads via bespoke
  `setEcg()`; video/WSI pass `imageIds[0]` as the id. Have these accept a display-set identifier and
  resolve image ids internally.

### Cornerstone landing sequence (so OHIF can ship one milestone at a time)

- **Wave 0 (foundation):** CS-5 content predicate, CS-17 narrowing guard, CS-16 widen
  `IEnabledElement`.
- **Wave 1 (planar stack):** CS-4 data-inferred mount, CS-1 presentation events, CS-6 + CS-7
  slice/scroll events + `getNumberOfSlices`, CS-21 view-reference resolution (SR/RT nav), CS-12
  calibration (trailing).
- **Wave 2 (planar volume / MPR):** CS-3 idempotent mount, CS-15 orientation, CS-11 synchronizers.
- **Wave 3 (fusion):** validation gate on CS-4 multi-volume + CS-22 fusion-overlay presentation
  (colormap + opacity TF) + CS-1 per-binding presentation; CS-19 optional.
- **Wave 4 (segmentation):** CS-13 labelmap (+ CS-6 `VOLUME_VIEWPORT_NEW_VOLUME`); **CS-8 contour
  camera unblocks RTSTRUCT** (the leading contour sub-track of M4).
- **Wave 5 (crosshairs/reference lines):** CS-8, CS-10 (+ role/displaySet-addressable tool targeting
  for tmtv crosshairs slab-thickness and fusion tool config).
- **Wave 6 (tail: 3D/video/WSI/ECG/cine):** CS-9, CS-14, CS-20, CS-18.

---

## 6. Feature-area migration matrix

"Blocked" = OHIF cannot complete it with today's cornerstone-next API.

| # | Feature | Legacy OHIF call | Native-next replacement | Difficulty | Blocked on CS? |
|---|---|---|---|---|---|
| 1 | Stack load | `viewport.setStack(imageIds, idx)` (`CornerstoneViewportService`) | `provider.add(id,{imageIds,initialImageIdIndex})` → `setDisplaySets({displaySetId,options:{orientation:ACQUISITION,role:'source'}})` | Moderate | No (API exists); OHIF owns `dataId` GC (CS-18) |
| 2 | Volume-slice / MPR load | `setVolumes([...])` / `addVolumes` | `add(id,{imageIds,volumeId})` + `setDisplaySets({options:{orientation:AXIAL|SAG|COR}})` | Hard | Partial — CS-15 (orient throws), CS-19 (force GPU) |
| 3 | PT/CT fusion | `setVolumes([ct,pt])` + per-volume `setProperties(...,volumeId)` | `setDisplaySets({…ct,role:'source'},{…pt,role:'overlay'})` + `setDisplaySetPresentation(ptId,{colormap,voiRange})` | Hard | Validate CS-4 multi-volume + CS-1 per-binding (API supports per-id presentation) |
| 4 | VOI / window-level | `setProperties({voiRange},volumeId?)`; read `getProperties().voiRange` | `setDisplaySetPresentation(id,{voiRange})` / `getDisplaySetPresentation(id)` | Moderate | **Yes — CS-1** (no `VOI_MODIFIED`) |
| 5 | Colormap / invert | `setProperties({colormap|invert})` | `setDisplaySetPresentation(id,{colormap,invert})` | Moderate | **Yes — CS-1** (no `COLORMAP_MODIFIED`) |
| 6 | Pan/zoom/rotate/flip | `getCamera/setCamera`, `getViewPresentation/setViewPresentation`, `setZoom/getZoom` | `setViewState/updateViewState` (rotation/flip/displayArea), `setScale` (zoom), `viewportProjection.withPresentation` (pan/zoom) | Moderate | No — **[VERIFIED]** fields exist in `PlanarViewState`; only `getPan/setPan` deprecated |
| 7 | Slice nav & jump | `csUtils.jumpToSlice(el,{imageIndex})`; `getNumberOfSlices()` | `setImageIdIndex` / `setViewReference({sliceIndex})`; native `getCurrentImageIdIndex`/`getImageIds` | Moderate | **Yes — CS-7** (`getNumberOfSlices` absent → TypeError) |
| 8 | displayArea | `setDisplayArea(...)` | native `setDisplayArea`, fold into `setViewState({displayArea})` | Moderate | No (`DISPLAY_AREA_MODIFIED` fires) |
| 9 | Position presentation | `getViewReference`+`getViewPresentation` → store; restore `isReferenceViewable`+`setViewReference`+`setViewPresentation` | view-reference APIs native; pan/zoom via `getViewState`/`setViewState` | Moderate | No (verify pan/zoom independent of slice on resize) |
| 9b | LUT presentation | `getProperties([volumeId])`+`getAllVolumeIds()`; restore `setProperties` | `getDisplaySetPresentation`/`setDisplaySetPresentation` keyed by displaySetId | Moderate→Hard | **Yes — CS-1** (no event to refresh store) |
| 10 | Sync — image-slice | `createImageSliceSynchronizer`; `frameViewSynchronizer` uses `STACK_VIEWPORT_SCROLL`+`jumpToSlice` | same factory; nav via `setViewReference({sliceIndex})` | Moderate | **Yes — CS-7, CS-6** |
| 10b | Sync — VOI | `createVOISynchronizer` (legacy props + `VOI_MODIFIED`) | drive `setDisplaySetPresentation` + new event | Moderate | **Yes — CS-1, CS-11** |
| 10c | Sync — zoom/pan | `createZoomPanSynchronizer` | already `viewportProjection`+`setViewState` | Trivial | No (works today) |
| 11 | Measurements | annotation bridge (reads `annotation.metadata`); jump uses `setViewReference`+camera nudge | bridge already type-agnostic; jump keeps `setViewReference`, nudge → `updateViewState`, zoom → `setScale` | Moderate | Partial — needs #6 |
| 12 | Segmentation (labelmap) | `addSegmentationRepresentations(viewportId,[rep])`; `convertStackToVolumeViewport` | `addLabelmapRepresentationToViewportMap` + `useSliceRendering`, render in-place | Hard | **Yes — CS-13, CS-6** (render chain already next-aware) |
| 13 | Crosshairs / ref-lines | tools added to MPR toolgroups; `getCamera/setCamera` | read via `getResolvedView().toICamera()`, nav via `setViewReference/setViewState` | Hard | **Yes — CS-8, CS-10** (fix in tools) |
| 14 | MPR | `setVolumes`+`setOrientation` | `setDisplaySets({options:{orientation}})`, `setOrientation` on volume | Hard | **Yes — CS-15 + #13** |
| 15 | Cine | `utilities.cine.playClip(element)` | element-based, unchanged at OHIF layer | Trivial→Moderate | **Yes — CS-9** |
| 16 | 3D / MIP | `setVolumes`+`setProperties({preset})`; VR via raw `getActors()` | `VOLUME_3D_NEXT`; preset via native VR API | Hard | **Yes — CS-14**; TrackballRotate camera |
| 17 | Video (cornerstone) | `_setOtherViewport` → `setDisplaySets({displaySetId:imageIds[0]})` | already native; pass `displaySetInstanceUID` | Trivial | Minor — CS-20 |
| 18 | Whole-slide | `_setOtherViewport` → `setDisplaySets({displaySetId:imageIds[0]})` | already native; map to `WHOLE_SLIDE_NEXT` | Trivial | Minor — CS-20 |

Note: OHIF DICOM **MP4 video** uses an HTML5 `<video>` React component that bypasses the rendering
engine — out of scope. There are **two** WSI implementations (OpenLayers `dicom-microscopy` vs the
cornerstone WSI path); only the cornerstone path is the `WHOLE_SLIDE_NEXT` target.

All four non-planar **tail families are in scope for the first native-next release**: 3D/MIP
(`VOLUME_3D_NEXT`), whole-slide (`WHOLE_SLIDE_NEXT`), ECG (`ECG_NEXT`), and cornerstone video
(`VIDEO_NEXT`). They are sequenced into M6 but are not "deferred indefinitely" — M6 ships with the
native release.

---

## 7. Derived & specialized workflows (SR, RTSTRUCT, PMAP, tmtv)

These extensions/modes were audited separately because they layer on top of the core viewport. None
of them owns a cornerstone viewport directly — they render the core `OHIFCornerstoneViewport` as a
child and drive it through services — so their migration is mostly inherited, with a few specific
risks.

### 7.1 Structured Report — `cornerstone-dicom-sr` → rides **M1** (volume-hydrated SRs: M2 follow-up)

- Thin orchestration: `OHIFCornerstoneSRMeasurementViewport` renders a child
  `OHIFCornerstoneViewport` forcing `viewportType: 'stack'`, driven by the SR's referenced
  key-image display set. No `setStack`/`setProperties`/`setCamera`/`instanceof` anywhere.
- **Jump-to-measurement is already native-friendly**: it goes through
  `setPositionPresentation({ viewReference })` → `viewport.setViewReference(viewRef)` (no
  `getCamera`/`setCamera`). So SR does **not** wait for M5.
- SR annotation drawing (`DICOMSRDisplayTool`) uses only read-only geometry (`worldToCanvas`,
  `canvasToWorld`, `getRotation`, `getActors`) — ports cleanly; drop the private `_actors` fallback.
- **Risks (cornerstone):** CS-21 — `setViewReference({ referencedImageId })` (2D) and the 3D
  SCOORD3D reference with null orientation must resolve on `PLANAR_NEXT`/volume viewports; and SR
  annotations render inside the shared tools annotation pipeline, which transitively hits CS-8.
- Volume-hydrated SCOORD3D SRs (a hydrated SR can target a reconstructable volume) validate under
  **M2**.

### 7.2 RTSTRUCT — `cornerstone-dicom-rt` → rides **M4** (leading contour sub-track), gated on **CS-8**

- RTSTRUCT is a **contour** segmentation: the SOP handler builds a CONTOUR geometry via
  `geometryLoader.createAndCacheGeometry({ type: CONTOUR })` and a Contour `SegmentationPublicInput`
  through OHIF `SegmentationService` — **not** a labelmap. The viewport component just forwards
  `displaySets` + `viewportType` to the core viewport.
- Because the representation is CONTOUR, it **skips** the `convertStackToVolumeViewport` /
  labelmap-slice path entirely (no CS-3/CS-13 exposure) — so it is the **cheapest M4
  representation** and a good first M4 validation case.
- **CS-8 dependency: now LANDED (`06605d040`/`9e32b3500`).** The cornerstone contour render path read
  `getCamera().viewPlaneNormal` for in-plane culling and broke on `PLANAR_NEXT`; it now reads via the
  `getViewportICamera` bridge, so contour render is no longer cornerstone-blocked. **Residual:** because
  contour bypasses `convertStackToVolumeViewport` it is the one SEG representation that does NOT hit the
  M4 OHIF throw — but it has **zero OHIF end-to-end native verification**, and its post-load
  `setPositionPresentation` still hardcodes `viewportType: 'stack'` (next line). Still the cheapest M4
  validation case; sequence it ahead of labelmap (CS-13).
- Minor: the post-load `setPositionPresentation` hardcodes `viewportType: 'stack'` — make it
  dynamic. MPR/volume contour overlay follows M2.

### 7.3 Parametric Map — `cornerstone-dicom-pmap` → rides **M2 (mount) + M3 (presentation)**

- **PMAP is a color-fusion *second volume*, not a labelmap and not a segmentation overlay.** Its
  `load()` requires the referenced series to already be a cached cornerstone **volume** (it throws
  for stack), builds a derived volume, and the viewport passes `displaySets = [referenced, pmap]`
  with `viewportType: 'volume'` + per-display-set `colormap` (`rainbow_2`, 5-point opacity array) +
  `voi`. It rides `_setVolumeViewport` → `setVolumes` + per-volume `setProperties`.
- Native-next mapping: two-base-volume mount via `setDisplaySets` (depends on **CS-3** incremental
  mount) + per-overlay colormap/opacity-TF/VOI via `setDisplaySetPresentation` (depends on
  **CS-22** + **CS-1**). Do **not** route PMAP through M4 — despite reusing the
  `SEGMENTATION_LOADING_COMPLETE` event it is fusion, not segmentation (clean up that event coupling
  during migration).
- Precondition to confirm: under `useNextViewports` the referenced series must still be mounted as a
  **volume** (PMAP throws otherwise) — i.e. PMAP's display set must keep forcing a `volumeId`.

### 7.4 tmtv mode — `extensions/tmtv` + `modes/tmtv` → integration/acceptance vehicle (M2→M6)

- The heaviest multi-modality consumer: a PET/CT/Fusion + MIP hanging protocol with
  camera/VOI/colormap **sync groups**, ROI-threshold **labelmap** segmentation, and PET/CT
  jump-to-region. Most orchestration is declarative through the HP (`viewportType`, fusion
  `colormap`, MIP `blendMode`/`slabThickness`, `syncGroups`), so it has few raw legacy calls.
- Direct couplings: (1) two `getCamera().focalPoint` reads (`commandsModule.ts:264,293`,
  ROI-threshold start/end slice) → `getViewReference()`/`getViewState()` focal point; (2) fusion PT
  colormap via the shared `setViewportColormap` → `setProperties({colormap}, volumeId)` → must
  become overlay-role `setDisplaySetPresentation`; (3) tool config that hand-builds
  `cornerstoneStreamingImageVolume:${displaySetUID}` volumeId strings and
  `filterActorUIDsToSetSlabThickness` by actor UID → tools must resolve targets by
  **displaySet/role**, not loader-prefixed strings (tools-side work alongside CS-8/CS-10).
- Dependencies: **M2** (CT/PT/Fusion orthographic), **M3** (fusion colormap + the dense voi/colormap
  sync groups — tmtv is the densest sync exerciser, 4 distinct VOI sync ids per orientation),
  **M4** (ROI-threshold labelmap — its core feature), **M5** (fusion crosshairs + slab-thickness),
  **M6** (the MIP sagittal viewport + `MipJumpToClick` → `setViewReference`). Treat tmtv as the
  **end-of-M5 acceptance test** with an M6 MIP follow-up; only the two focal-point reads and the
  fusion colormap can migrate early.

---

## 8. Phased rollout

Each milestone is independently shippable behind the flag; legacy stays default until M7.

- **M0 — Scaffolding & flag (no behavior change when off). [DONE]** Add `useNextViewports`; extract the
  `legacyBackend` (move-only) / `nextBackend` seam in `CornerstoneViewportService`; build the
  `dataId` wrapper + GC discipline (§4.7); add the dormant `useNextViewports` branch in
  `getCornerstoneViewportType`. **Prove:** full suite green with flag off; add a CI lane that runs
  with `useNextViewports=false` and snapshot-tests the presentation stores. **Also do here:**
  migrate the raw `viewport.type === 'orthographic'` checks (`getToolbarModule`,
  `layerConfigurationUtils`, `init.tsx`) to capability/`ViewportInfo` reads — correct for the legacy
  path too, so it lands ahead of and independent of the flag.
- **M1 — Planar stack, read-only. [DONE]** `'stack'`→`PLANAR_NEXT`; `nextBackend._setStackViewport` uses
  `add` + `setDisplaySets` + `setDisplaySetPresentation`; migrate stack overlays/scrollbar reads to
  native (`getCurrentImageIdIndex`/`getImageIds`, `csUtils.scroll`, `getScale`). **CS deps:** CS-5
  discriminator, CS-6/CS-7 events. **Caveat (ordering):** W/L readout parity needs CS-1 — see Risk 1.
- **M2 — Planar volume + MPR. [PARTIAL]** `'volume'`→`PLANAR_NEXT`, data layer passes `volumeId`; replace the
  `getActors()` add-vs-set heuristic with native `setDisplaySets`/`addDisplaySet`; drop the
  `setTimeout` hack. **CS deps:** CS-3 idempotent mount, CS-15 orientation.
- **M3 — Presentation, VOI/colormap, synchronizers. [PARTIAL]** Split read/write into geometry (`setViewState`
  / `viewportProjection`) and data presentation (`setDisplaySetPresentation` keyed by
  displaySetUID); migrate `commandsModule` window-level/invert/colormap/flip/rotate/zoom/reset.
  **CS deps (highest concentration):** CS-1 (presentation event), CS-11 (synchronizers). **Prove:**
  W/L drag updates readout + propagates across a VOI sync group; pan/zoom sync stays anchor-aligned
  over 20+ cycles (no drift); presentation persists across study/grid navigation.
- **M4 — Segmentation (labelmap). [cornerstone DONE / OHIF UNSTARTED — throws on native]** Move rep selection off `isVolume*` to capability/content; use
  `addLabelmapRepresentationToViewportMap` + `useSliceRendering`; eliminate
  `convertStackToVolumeViewport`. **CS deps:** CS-13, CS-3, CS-6.
- **M5 — Crosshairs / reference lines / MPR tools. [cornerstone DONE / OHIF residue]** Almost entirely gated on upstream CS-8/CS-10
  (+ CS-7 for jumps, CS-9 wiring). **Prove:** crosshairs drag moves the other panes to the correct
  world point; reference lines draw across panes.
- **M6 — 3D / video / WSI / ECG. [PARTIAL — 3D DONE; video/WSI/ECG mounts unimplemented]** `VOLUME_3D_NEXT` (CS-14 VR API; 3D VR commands stay legacy under
  the flag until the API exists), `VIDEO_NEXT`/`WHOLE_SLIDE_NEXT` (already near-native; pass UID),
  `ECG_NEXT` via `setDisplaySets`.
- **M7 — Default-on & cleanup. [TODO]** Flip default to `true`; after one release with both CI lanes green,
  delete the `legacyBackend` branches, the `getActors()` heuristic, `convertStackToVolumeViewport`,
  the `getProperties`/`setProperties`/`getCamera`/`setCamera` call sites, and the
  `requestedType`-based guards.

---

## 9. Risks, testing & validation

**Keeping legacy byte-identical (off path):** dual CI lanes (flag on + off) for every milestone;
single-chokepoint discipline enforced by lint/grep; snapshot-test the presentation stores; the
`legacyBackend` split must be additive (new methods), never edits to legacy bodies.

**e2e / visual coverage:** per-family smoke (single/multi-frame stack, MPR triptych, 4D volume,
PT/CT fusion, SEG-over-stack, SEG-over-MPR, RTSTRUCT/contour, 3D VR, WSI, video, ECG); interaction
(scroll, W/L drag, invert, colormap, rotate, flip, zoom/pan, reset, jump-to-measurement, crosshairs,
reference lines, cine); sync (camera/zoom-pan/image-slice/VOI across 2+ viewports, asserting they
*stay* aligned after repeated interaction); persistence (resize, layout change, study nav, HP stage
switch); pixel-diff fixed states between off/on builds.

**Highest-risk areas:** (1) **events not firing** — CS-1/CS-6; until upstream, an interim
push-after-write in `nextBackend`/`useViewportRendering` behind the flag, with an e2e asserting the
UI updates after a *programmatic* VOI change. (2) **anchor drift on sync** — drive many pan/zoom
cycles, assert world-point alignment within tolerance. (3) **segmentation slice rendering** — SEG
hydrate into a live MPR triptych must not blank siblings (CS-3). (4) **fusion presentation keying**
— per-overlay colormap/VOI by displaySetUID, correct z-order across orientation changes. (5) **type
discrimination collapse** — unit-test each guard against a native `PLANAR_NEXT` viewport in both
stack and volume content states.

**Rollback:** per-milestone instant rollback by flipping the flag (kill switch in runbooks);
family-level rollback by reverting one branch in `getCornerstoneViewportType` (e.g. keep stack
native, send volume back to `ORTHOGRAPHIC`); no store migration (same keys/shapes both backends);
never delete a legacy branch before M7.

---

## 10. Open decisions and verification debt

**Resolved by the user (2026-06-16):**
- **Sibling extensions are audited and folded into milestones** (Section 7): SR → M1 (volume SRs
  M2), RTSTRUCT → M4 contour sub-track (gated on CS-8), PMAP → M2+M3, tmtv → M2–M6 acceptance
  vehicle.
- **Tail scope:** all four families (3D/MIP, whole-slide, ECG, cornerstone video) are **in scope**
  for the first native-next release (M6). HTML5 MP4 video stays out of scope (separate
  non-engine component). The cornerstone WSI path (not the OpenLayers `dicom-microscopy` impl) is
  the `WHOLE_SLIDE_NEXT` target.

**Still open (verify before relying on) — status 2026-06-19:**
- **HangingProtocol matching / `isReferenceViewable`:** still unverified by any native test. Both key on
  the OHIF `viewportType` string (which `getCornerstoneViewportType` does NOT rewrite — only the
  cornerstone enum flips), so the branches are *likely* native-safe, but no native jump-target test
  exists.
- **CS-22 fusion presentation shape:** CONFIRMED cornerstone-side — `setDisplaySetPresentation` accepts a
  multi-point opacity TF + threshold on the volume-slice path (pre-existing 5.0 base PR `aa68c904b`).
  But NO OHIF native fusion/PMAP path exercises it; the rendered fusion result is unproven. (The overlay
  colormap **keying** is now correct — `7b61e08ee` — only the rendered result is unvalidated; see M2.)
- **CS-21 view-reference resolution (CORRECTED):** 2D `referencedImageId` + oblique `planeRestriction`
  resolve on the inherited 5.0 base. The previously-claimed "null-orientation 3D SCOORD3D → no
  default-orientation fill" gap is **unreachable** — `hydrateStructuredReport.ts:353` always attaches a
  `planeRestriction`, routing into `deriveOrientationFromPlaneRestriction`. The only residual is a
  **single-point** SCOORD3D (planeRestriction with a point but null in-plane vectors → keeps current
  orientation); the open code is the WRITE path `PlanarViewReferenceController.ts:496-513`, NOT
  `planarViewReference.ts` (the read/derive side). Verify only if single-point SCOORD3D is in scope.
- **PMAP volume precondition:** still unconfirmed under `useNextViewports` (PMAP throws for stack); the
  pmap extension has zero native guards.

**Verification debt before cornerstone PRs:** re-pin all cornerstone `file:line` references to the
pinned 5.0.x build; runtime-validate multi-volume fusion presentation (the API supports per-binding
presentation by id, but the PT/CT path needs a live test); confirm `ELEMENT_ENABLED` fires for
natively-created `PLANAR_NEXT`; confirm OHIF's e2e/visual harness can parameterize `appConfig`
per-run and supports pixel-diffing (the parity strategy depends on it).

**Resolved during this plan [VERIFIED]:** native `PlanarViewport` is built when `PLANAR_NEXT` is
requested without a legacy `requestedType` (§2.1); `PlanarViewState` carries
rotation/flip/displayArea/scale/anchor so M3 is not blocked on missing view-state fields (§2.2);
`setDisplaySetPresentation` originally emitted no event (CS-1 — since fixed, `5635bdab4`); `setViewState`
fires `CAMERA_MODIFIED` and `resetViewState` fires `CAMERA_RESET`.
