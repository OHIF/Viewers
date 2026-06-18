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

## Implementation status (as of 2026-06-17)

This section back-annotates the canonical plan with the state of the prototype on branch
`ohifohifnextapi` (OHIF) and `cornerstoneohifnextapi` (cornerstone3D, local-only, not pushed).
It supersedes the separately-authored `.html` status companion where they disagree. Be aware:
**PARTIAL means PARTIAL** — the native path renders but does not yet persist presentation, and the
biggest tool blockers (crosshairs writes, cine, 3D VR) are not done.

### Milestone status

- **M0 — Scaffolding & flag + backend seam: PARTIAL.** Done: `appConfig.useNextViewports`
  (`AppTypes.ts`), `nextViewports.ts` accessor + `init.tsx` wiring (`setNextViewportsEnabled`),
  `getCornerstoneViewportType` `*_NEXT` mapping (idempotent pass-through, jest test),
  `CornerstoneCacheService` data-shape fix, and the backend seam itself
  (`backends/`: `IViewportBackend`, `IViewportServiceInternals`, `LegacyViewportBackend`,
  `NextViewportBackend`, ref-counted `DataIdRegistry`). Not done: the seam is **delegation, not the
  full body extraction** the blueprint specified (see backend subsection); native presentation
  **restore** is skipped on mount; several presentation READ sites are not yet capability-guarded;
  the dual-CI presentation-snapshot proof was not executed. The whole `backends/` seam +
  `VIEWPORT_BACKEND_M0_BLUEPRINT.md` are **UNCOMMITTED** working-tree changes (validated both lanes
  manually).
- **M1 — Planar stack, read-only: DONE.** Native `PLANAR_NEXT` stack renders end-to-end with zero
  console errors (295-slice CT NECK; scroll + `setImageIdIndex` navigate; cache fills to 295).
  Includes `getViewportPresentation` read bridge, `CornerstoneCacheService` root-cause fix,
  `ImageOverlayViewerTool` `getViewReferenceId` guard, mount-time VOI seeding, toolbar evaluator.
  Caveat: presentation **persistence** (pan/zoom/VOI across nav/resize/HP) is still M5 work.
- **M2 — Planar volume + MPR: PARTIAL.** Native volume/MPR renders in all 3 orientations
  (`_setNativeVolumeDisplaySets`); `setViewportOrientation` works on native volumes; round-trip
  stack→sag→cor→axial→stack is clean. Not done: fusion (2nd base volume as overlay) is best-effort
  and unvalidated; the `dataId` overlay-suffix scheme (`dataIdFor(uid, role)`) is a stub; volume
  presentation restore not done.
- **M3 — Presentation, VOI/colormap, synchronizers: PARTIAL/TODO.** Done on the cornerstone side:
  VOI + image-slice synchronizers support native; `setDisplaySetPresentation` emits
  `VOI_MODIFIED`/`COLORMAP_MODIFIED` (CS-1). Read bridging via `getViewportPresentation`. **Not
  done:** native presentation **restore** (`setPresentations`) is skipped on both mounts, so pan /
  zoom / VOI / position do not persist across study/grid navigation, resize, or hanging-protocol
  application — the core M3 "prove" criteria are unmet. Several read sites remain unguarded
  (`ColorbarService`, `ViewportWindowLevel/utils`, `commandsModule` invert/getViewPresentation,
  `useViewportRendering`).
- **M4 — Segmentation (labelmap/contour): PARTIAL.** Cornerstone: contour segmentation +
  `handleContourSegmentation` render on native (CS-8 contour commit); labelmap-slice rendering
  pre-existing (CS-13); `setDisplaySets` preserves segmentation overlays on same-source re-set
  (CS-3). OHIF `_addOverlayRepresentations` path reused. Not done: `SegmentationService.ts:1731`
  read site not capability-guarded; SEG/RT presentation persistence on native untested; no native
  SEG/RT spec coverage.
- **M5 — Crosshairs / reference lines / MPR tools: TODO.** Cornerstone foundations committed: camera
  reads via `getViewportICamera` bridge, reference lines, camera-position sync, contour render. **Not
  done:** the gating work — `CrosshairsTool` camera **writes** (22 `getCamera` + 4 `setCamera`) and
  `ReferenceCursors` (CS-8 writes), and CS-10. No native Playwright coverage exists, so these cannot
  be honestly gated yet; the running-OHIF loop is the intended gate.
- **M6 — 3D / video / WSI / ECG: TODO.** `getCornerstoneViewportType` maps `ecg`/`video`/
  `wholeslide`/`volume3d` to `*_NEXT` under the flag, and the backend interface reserves
  `setEcg`/`setOther` dispatch, but native mounts are **not implemented** — the ECG/other bodies are
  unchanged legacy. CS-14 (3D VR / `TrackballRotate`) and CS-20 (ECG/video/WSI dataId ergonomics) are
  deferred.
- **M7 — Default-on & cleanup: TODO.** `TODO_BEFORE_MERGE.md` tracks all dev-only reverts. **Not
  done and must be reverted before merge:** `config/default.js` sets `useNextViewports: true` (flips
  default for everyone); the in-toolbar legacy/next toggle + `localStorage` override
  (`ohif-use-next-viewports-override`) are throwaway. No CI grep/lint allowlist rule for flag reads
  yet; the backend seam is uncommitted; the blueprint validation plan (byte-identical diff gate, dual
  CI lanes, presentation-snapshot + registry-GC tests) is not executed.

### M0 backend system (legacyBackend / nextBackend + facade + DataIdRegistry §4.7)

**Status: UNCOMMITTED working-tree changes, validated on both lanes manually.** New `backends/` dir
plus a modified `CornerstoneViewportService`. It is the scaffolding + dispatch + registry increment
only — **not** the rich move-only interface §4.3 specified:

- `IViewportBackend` has only **four** members: `dispatchMount`, `registerDataId`,
  `onViewportDisabled`, `destroy`. The mount **bodies** (`_setStackViewport`,
  `_setNativeVolumeDisplaySets`, `_setEcgViewport`, `_setOtherViewport`) and the presentation
  read/write forks **stayed in the service**. Both backends' `dispatchMount` delegate back through a
  narrow `IViewportServiceInternals` facade. `LegacyViewportBackend.dispatchMount` is a verbatim copy
  of the old legacy type-dispatch chain (byte-identical off-path guaranteed by *not* moving bodies);
  `NextViewportBackend.dispatchMount` routes by data shape (`'volume' in firstData`, then delegates
  to `service._setVolumeViewport` → `_setNativeVolumeDisplaySets`, else `service._setStackViewport`).
- Backend selection is a **lazy first-use getter** (`private get backend()` resolving
  `isNextViewportsEnabled()` on first access), **not** the constructor read the blueprint and §4.2/
  §4.3/§6 call "sanctioned read #2" — see Learnings.
- `DataIdRegistry` (§4.7) shipped as designed: global ref-count map + per-viewport ledger;
  `provider.add` only on 0→1, `provider.remove` only on 1→0; `releaseViewport` on disable;
  `destroy()` removes each dataId individually (not `provider.clear()`). `registerDataId` replaced the
  raw `genericViewportDataSetMetadataProvider.add` at both native mount sites; `disableElement` calls
  `backend.onViewportDisabled(viewportId)` **before** deleting viewport bookkeeping. The
  `dataIdFor(uid, role)` overlay-suffix is a stub (M0 uses the bare uid). GC unit tests not written.

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
VOI/COLORMAP_MODIFIED — note this **contradicts** §5/§10 which still list CS-1 as the single biggest
open blocker), **CS-3** (segmentation-preserving `setDisplaySets`), **CS-5/16/17** (content predicate
+ guards; `IEnabledElement` union widening deferred), **CS-7** (`getNumberOfSlices`), **CS-11**
(voi/imageSlice synchronizers), **CS-13** (labelmap-slice, pre-existing), **CS-15** (render-path
decision), **CS-19** (`forceCPU`). **CS-4/CS-22** are pre-existing in `genericMultiVolumeAPI` (no work
needed) — also contradicting the .md's treatment of them as work items. PARTIAL: **CS-6** (part 1
`VOLUME_NEW_IMAGE` done; part 2 `VOLUME_VIEWPORT_NEW_VOLUME` dedup deferred), **CS-8** (reads /
reference lines / contours / camera-position sync done; crosshairs **writes** + `ReferenceCursors`
NOT done), **CS-18** (no upstream GC; addressed OHIF-side by the uncommitted `DataIdRegistry`). TODO:
**CS-9** (cine — `playClip` throws on `PLANAR_NEXT`), **CS-10**, **CS-12** (calibration), **CS-14** (3D
VR/`TrackballRotate`), **CS-20** (ECG/video/WSI ids), **CS-21** (view-ref resolution).

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

The flag is read in exactly **two** places: `getCornerstoneViewportType` (type selection) and the
`CornerstoneViewportService` constructor (backend selection). A lint/grep CI rule should forbid it
anywhere else so the off-path cannot drift.

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

### Blockers (gate the core planar milestones)

- **CS-1 — `setDisplaySetPresentation` emits no event. [VERIFIED]**
  `GenericViewport.setDataPresentationState` (`GenericViewport.ts:567-582`) calls
  `binding.updateDataPresentation(props)` and never `triggerEvent`. `COLORMAP_MODIFIED` fires only
  from the legacy controller. OHIF's VOI sliders, colorbar, W/L text, invert/opacity/visibility
  controls, and VOI sync groups are entirely event-driven, so they go stale after any programmatic
  or tool-driven presentation change. **Fix:** after `updateDataPresentation`, diff and
  `triggerEvent` `VOI_MODIFIED` (voiRange/invert), `COLORMAP_MODIFIED` (colormap), and a generic
  `VIEWPORT_DATA_PRESENTATION_MODIFIED` carrying the full delta + `displaySetId` (planar bindings
  are multi). **This is the single biggest blocker.**

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

- **CS-9 — cine `playClip` throws `'Unknown viewport type'` on `PLANAR_NEXT`.**
  `_createCinePlayContext` only branches `instanceof Stack/Volume/Video`. **Fix:** add a
  `PLANAR_NEXT` cine context (duck-type `scroll`/`getSliceIndex`/`getNumberOfSlices`; depends on
  CS-7). Can stay legacy under the flag and ship in the tail.

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
- **CS-12 — native spacing calibration.** `viewportSupportsStackCalibration` returns false for
  native `PLANAR_NEXT` (`calibrateSpacing` is adapter-only); expose a native calibration entry
  point. Non-core; can lag.
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
- **Hard dependency: CS-8** — the cornerstone contour render path reads
  `getCamera().viewPlaneNormal` for in-plane culling; on `PLANAR_NEXT` (no legacy camera) contour
  visibility breaks. RT is entirely contour-based, so it is **non-functional** on the native path
  until CS-8 lands. Sequence RT as the leading item of M4, ahead of labelmap (CS-13).
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

- **M0 — Scaffolding & flag (no behavior change when off). [PARTIAL]** Add `useNextViewports`; extract the
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
- **M4 — Segmentation (labelmap). [PARTIAL]** Move rep selection off `isVolume*` to capability/content; use
  `addLabelmapRepresentationToViewportMap` + `useSliceRendering`; eliminate
  `convertStackToVolumeViewport`. **CS deps:** CS-13, CS-3, CS-6.
- **M5 — Crosshairs / reference lines / MPR tools. [TODO]** Almost entirely gated on upstream CS-8/CS-10
  (+ CS-7 for jumps, CS-9 wiring). **Prove:** crosshairs drag moves the other panes to the correct
  world point; reference lines draw across panes.
- **M6 — 3D / video / WSI / ECG. [TODO]** `VOLUME_3D_NEXT` (CS-14 VR API; 3D VR commands stay legacy under
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

**Still open (verify before relying on):**
- **HangingProtocol matching:** verify no HP *matching rule* keys on viewport type, and that
  `isReferenceViewable`'s `viewportOptions.viewportType === 'stack'` string branch behaves under the
  flag.
- **CS-22 fusion presentation shape:** confirm `setDisplaySetPresentation` accepts a multi-point
  opacity transfer function for a non-segmentation overlay (gates PMAP + tmtv fusion).
- **CS-21 view-reference resolution:** confirm `setViewReference({ referencedImageId })`,
  `planeRestriction`, and null-orientation 3D references resolve on `*_NEXT` (gates SR/RT jump).
- **PMAP volume precondition:** confirm the referenced series is still mounted as a volume under
  `useNextViewports` (PMAP throws for stack).

**Verification debt before cornerstone PRs:** re-pin all cornerstone `file:line` references to the
pinned 5.0.x build; runtime-validate multi-volume fusion presentation (the API supports per-binding
presentation by id, but the PT/CT path needs a live test); confirm `ELEMENT_ENABLED` fires for
natively-created `PLANAR_NEXT`; confirm OHIF's e2e/visual harness can parameterize `appConfig`
per-run and supports pixel-diffing (the parity strategy depends on it).

**Resolved during this plan [VERIFIED]:** native `PlanarViewport` is built when `PLANAR_NEXT` is
requested without a legacy `requestedType` (§2.1); `PlanarViewState` carries
rotation/flip/displayArea/scale/anchor so M3 is not blocked on missing view-state fields (§2.2);
`setDisplaySetPresentation` emits no event (CS-1); `setViewState` fires `CAMERA_MODIFIED` and
`resetViewState` fires `CAMERA_RESET`.
