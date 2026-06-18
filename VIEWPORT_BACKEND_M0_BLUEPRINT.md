I have all the source detail required. Producing the blueprint.

---

# M0 Blueprint: `legacyBackend` / `nextBackend` split inside `CornerstoneViewportService`

This is the concrete, implementable M0 design. It extracts the existing forked logic (5 inline native branches + the legacy bodies) behind one `IViewportBackend` interface, selected once in the service constructor, and adds the missing `dataId` lifecycle (refcounted register/release). Flag-off must be byte-identical; the split is move-only for legacy and an extraction-into-a-class for the already-validated native branches.

All file paths absolute. Service file: `/Users/alireza/open-source/clean/Viewers.worktrees/ohifohifnextapi/extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts`.

---

## 1. The `IViewportBackend` interface (exact methods + signatures)

One method per forked concern in §4.3. Methods keep the *same argument lists* the current private methods already have, so extraction is a mechanical move. Backends are stateful classes that hold a back-reference to the service.

New file: `extensions/cornerstone/src/services/ViewportService/backends/IViewportBackend.ts`

```ts
import type { Types } from '@cornerstonejs/core';
import type ViewportInfo from '../Viewport';
import type {
  Presentations,
  PositionPresentation,
  LutPresentation,
} from '../../../types/Presentation';
import type { StackViewportData, VolumeViewportData } from '../../../types/CornerstoneCacheService';

export interface IViewportBackend {
  // ---- Mount (forked: §4.3 stack/volume/ecg rows) ----
  setStackViewport(
    viewport: Types.IStackViewport,
    viewportData: StackViewportData,
    viewportInfo: ViewportInfo,
    presentations?: Presentations
  ): Promise<void>;

  // public passthrough in the service forwards here; signature matches today's loose one
  setVolumesForViewport(
    viewport: Types.IVolumeViewport,
    volumeInputArray: unknown[],
    presentations?: Presentations
  ): Promise<void>;

  setEcgViewport(
    viewport: Types.IECGViewport,
    viewportData: StackViewportData
  ): Promise<void>;

  // §4.3: "already native = shared template". Kept on the interface so nextBackend
  // can override to pass displaySetInstanceUID and route add() through the registry.
  setOtherViewport(
    viewport: Types.IStackViewport,
    viewportData: StackViewportData,
    viewportInfo: ViewportInfo,
    presentations?: Presentations
  ): Promise<void>;

  // ---- Presentation reads (forked: §4.3 read row) ----
  // Wrapper in the service adds viewportType/viewportId/3D-null guard; the backend
  // returns only the channel-specific payload it reads off the cs viewport.
  getPositionPresentation(
    csViewport: Types.IViewport,
    viewportInfo: ViewportInfo
  ): Pick<PositionPresentation, 'viewReference' | 'viewPresentation'>;

  getLutPresentation(
    csViewport: Types.IViewport,
    viewportInfo: ViewportInfo
  ): Pick<LutPresentation, 'properties'>;

  // ---- Presentation writes (forked: §4.3 write row) ----
  setLutPresentation(
    viewport: Types.IViewport,
    lutPresentation: LutPresentation
  ): void;

  setPositionPresentation(
    viewport: Types.IViewport,
    positionPresentation: PositionPresentation
  ): void;

  // ---- updateViewport keep-camera (forked) ----
  // Owns the snapshot/restore mechanism: legacy = getCamera/setCamera,
  // next = getViewState/setViewState (§4.5). Returns the same promise updateViewport awaits.
  updateViewportKeepCamera(
    viewport: Types.IViewport,
    viewportData: StackViewportData | VolumeViewportData,
    viewportInfo: ViewportInfo,
    keepCamera: boolean
  ): Promise<void>;

  // ---- dataId lifecycle (§4.7) — NEXT-only; legacy = no-op ----
  onViewportDisabled(viewportId: string): void; // called BEFORE viewportsDisplaySets.delete
  destroy(): void;                              // flush all registrations
}
```

**Design notes on signatures:**
- `getPositionPresentation` / `getLutPresentation` return only the *forked half*. The shared wrapper (the existing `_getPositionPresentation` / `_getLutPresentation` shell) keeps `viewportType: viewportInfo.getViewportType()`, the `viewportId`, and the `isVolume3DViewportType` null-guard for `viewReference`. This keeps the §4.4 invariant (type is OHIF-owned) in shared code, not in the backend. **Caveat:** today `_getPositionPresentation` reads `viewReference` via the shared `csViewport.getViewReference()` (native, kept both ways) — leave `viewReference` in the *shared wrapper* and have the backend only return `viewPresentation`. This makes the legacy/next fork exactly the one line that differs (387-389).
- `setVolumesForViewport` stays a **public** method on the service (external callers: HP `runImageLoadStrategy` continuation). The service's public method forwards to `this.backend.setVolumesForViewport(...)`. Keep `unknown[]` for `volumeInputArray` since the current signature is untyped — do not tighten it in a move-only extraction.
- `onViewportDisabled` / `destroy` are on the interface so `disableElement` / `destroy` dispatch uniformly; `LegacyViewportBackend` implements both as empty bodies (byte-identical: today nothing is removed).

---

## 2. Access pattern: how backends reach service state/helpers

**Recommendation: construct each backend with a back-reference to the service (`new NextViewportBackend(this)`), typed against a narrow `IViewportServiceInternals` facade interface** that the service `implements`. This gives the cleanest of both worlds:

- Mechanically, moving a body becomes `this.x` → `this.service.x` (a pure rename, no logic change — sanctioned by §4.1).
- The facade interface documents and constrains exactly what backends may touch, so the backend can't accidentally reach into unrelated service internals and the off-path can't drift.

New file: `extensions/cornerstone/src/services/ViewportService/backends/IViewportServiceInternals.ts`

```ts
// The exact shared surface backends are allowed to touch (derived from the inventory's
// serviceStateUsed columns). The service `implements` this; backends hold a ref to it.
export interface IViewportServiceInternals {
  // shared state
  viewportsById: Map<string, ViewportInfo>;
  viewportsDisplaySets: Map<string, string[]>;
  renderingEngine: Types.IRenderingEngine | null;
  servicesManager: AppTypes.ServicesManager;
  readonly EVENTS: typeof CornerstoneViewportService.EVENTS;

  // shared lookups
  getCornerstoneViewport(viewportId: string): Types.IViewport;
  getViewportInfo(viewportId: string): ViewportInfo;

  // shared helpers both backends call
  _processExtraDisplaySetsForViewport(viewport: Types.IViewport): unknown[];
  _addOverlayRepresentations(results: unknown[]): Promise<void>;
  _getInitialImageIndexForViewport(viewportInfo: ViewportInfo, imageIds?: string[]): number;
  _getSlabThickness(displaySetOptions: unknown, volumeId?: string): number;
  setPresentations(viewportId: string, presentations: Presentations, viewportInfo?: ViewportInfo): void;
  _broadcastEvent(eventName: string, payload: unknown): void;
}
```

**Preserving byte-identical legacy — the rules (enforce in review):**
1. `LegacyViewportBackend` is **cut-and-paste** of the exact current method bodies. The only permitted edit is the mechanical receiver rewrite: `this.foo` → `this.service.foo` for the shared symbols listed in `IViewportServiceInternals`, and `this._setNativeVolumeDisplaySets` / native-only helpers do **not** move into legacy at all.
2. No reordering of statements, no renamed locals, no "while I'm here" cleanups, no changed early-returns. Diff each moved body against the original (see §7 validation).
3. The `setTimeout(callback, 0)` hack in `setVolumesForViewport`, the `getActors()` add-vs-set heuristic, `jumpToSlice`, the `viewport.render()` ordering, and the two `_broadcastEvent` calls all move verbatim into `LegacyViewportBackend.setVolumesForViewport`.
4. Helper functions that today are module-scope (`getVolumeActorReferencedIds`, `volumeIdPrefixesMatch`, `viewportMatchesDesiredVolumePresentation`, `getViewportProperties`, `cleanProperties`) stay module-scope and are imported by `LegacyViewportBackend`. The `cleanProperties` closure inside `_getLutPresentation` (408-419) should be hoisted to a module-level shared util (`backends/lutPresentationUtils.ts`) so both the legacy read and any next read can reuse it without divergence.

(The alternative — passing a context object literal of bound functions — is rejected: it adds an allocation per backend and obscures `this` identity in the moved bodies, making the byte-identical diff harder to verify. The `implements`-facade keeps the moved code reading almost identically to the original.)

---

## 3. File layout

```
extensions/cornerstone/src/services/ViewportService/
  CornerstoneViewportService.ts        # slimmed: shared methods + ctor selection + _setDisplaySets dispatch shell
  backends/
    IViewportBackend.ts                # the interface (§1)
    IViewportServiceInternals.ts       # narrow facade the service implements (§2)
    LegacyViewportBackend.ts           # MOVE-ONLY extraction of current legacy bodies
    NextViewportBackend.ts             # extraction of the 5 inline native branches + new writes
    dataIdRegistry.ts                  # refcounted register/release over genericViewportDataSetMetadataProvider (§5)
    lutPresentationUtils.ts            # hoisted cleanProperties + getViewportProperties shared helpers
```

**Service KEEPS (shared):** constructor (+ backend selection), `enableViewport`, `getRenderingEngine`, `resize`/`performResize`/`enqueue…`/`processViewportResizeQueue`/`resetGridResizeTimeout`, `destroy` (now also dispatches `backend.destroy()`), `disableElement` (now also dispatches `backend.onViewportDisabled()`), `setPresentations` (orchestration), `storePresentation`, `getPresentations`, `getPresentationIds`, `_getSegmentationPresentation`, `_setSegmentationPresentation`, `setViewportData` front door, **`_setDisplaySets` dispatch shell**, all find/nav/lookup helpers (`getCornerstoneViewport`, `getViewportInfo`, `findNavigationCompatibleViewportId`, etc.), `_getInitialImageIndexForViewport`, `_processExtraDisplaySetsForViewport`/`_addOverlayRepresentations`/`addOverlayRepresentationForDisplaySet`, `_getSlabThickness`/`_getFrameOfReferenceUID`/`_removeResizeObserver`, and the **shared wrappers** `_getPositionPresentation`/`_getLutPresentation`/`_setLutPresentation`/`_setPositionPresentation`/`updateViewport` that now delegate the forked half to `this.backend`.

The `_setVolumeViewport` *outer* (volumeInput build + volumesNotLoaded handling, 1087-1169) is backend-agnostic data prep that ends in `return this.setVolumesForViewport(...)`. Keep it **shared in the service**; only its terminal `setVolumesForViewport` call dispatches to the backend. (Do not move volumeInput build into either backend — it's shared and would duplicate.)

---

## 4. Extraction map (current lines → destination)

| Forked concern | LegacyViewportBackend gets (move-only) | NextViewportBackend gets (extract inline native) |
|---|---|---|
| **Stack mount** | `_setStackViewport` legacy tail `1012-1026` (setStack/setProperties/setPresentations/_addOverlay/setDisplayArea/setProperties{rotation}/setCamera{flip}) | native branch `942-1009` (registry.register + setDisplaySets + default-VOI seed + setDisplaySetPresentation + setViewState + stackContextPrefetch + _addOverlay) |
| **Volume mount** | `setVolumesForViewport` legacy remainder `1244-1338` (overlay-only path, getActors heuristic, addVolumes/setVolumes, setProperties via setTimeout, setPresentations, jumpToSlice, broadcast) | dispatch `1232-1242` + the whole body of `_setNativeVolumeDisplaySets` `1373-1429` (registry.register per base volume + setDisplaySets role source/overlay + per-binding setDisplaySetPresentation + broadcast) |
| **ECG mount** | `_setEcgViewport` body `846-852` | new `setDisplaySets`-based impl (M6; M0 stub = same legacy body so off≡on for ECG until M6) |
| **Other (video/WSI)** | n/a — shared template `855-870` stays callable by both via service | optional override to pass UID + registry (M6); M0 inherits the shared template |
| **Position read** | `csViewport.getViewPresentation({pan,zoom})` (the `else` of 387-389) → returns `{viewPresentation}` | the `isGenericViewport` arm → returns `{viewPresentation: undefined}` (later: viewState pan/zoom) |
| **LUT read** | the whole current body `421-431` (Map-by-volumeId for volume, getViewportProperties for stack) → `{properties}` | NEW: build `properties` re-keyed by `displaySetInstanceUID` via `getDisplaySetPresentation(dsUID)` for each UID in `viewportsDisplaySets.get(viewportId)` |
| **LUT write** | `_setLutPresentation` body `1741-1752` | NEW: `setDisplaySetPresentation(dsUID, {voiRange,colormap,invert})` per UID (Map entries keyed by dsUID) |
| **Position write** | `_setPositionPresentation` body `1759-1774` | NEW: keep `setViewReference` (native), pan/zoom via `setViewState` instead of `setViewPresentation` |
| **updateViewport keep-camera** | `1517-1532` (getCamera up front; isVolume→_setVolumeViewport+setCamera; isStack→_setStackViewport) | NEW: snapshot `getViewState()` before, route mount by data-shape (delegate to own setStack/setVolume), restore `setViewState()` after |
| **default-VOI helper** | — | `_getDefaultVoiRangeFromMetadata` `1347-1360` moves in as a private method |

**`_setDisplaySets` dispatch shell (stays in service, refactored):** replace the `if (csUtils.isGenericViewport(viewport))` data-shape block (1552-1570) AND the legacy type block (1572-1602) with a single dispatch through the backend. The backend owns its own routing:

```ts
_setDisplaySets(viewport, viewportData, viewportInfo, presentations = {}): Promise<void> {
  return this.backend.dispatchMount(viewport, viewportData, viewportInfo, presentations);
}
```
…where `dispatchMount` is the routing method on each backend:
- `LegacyViewportBackend.dispatchMount` = the exact current type-based chain (`isStackViewportType`→setStack, `isVolumeViewportType`→setVolume, ECG→setEcg, else→setOther) moved verbatim from 1572-1602.
- `NextViewportBackend.dispatchMount` = the data-shape routing moved from 1552-1570 (`'volume' in firstData` → setVolume else setStack), which is **correct and required** because PLANAR_NEXT collapses both onto one type (§4.4). This keeps the only non-`getViewportType()` branch inside the backend that owns it.

Add `dispatchMount` to `IViewportBackend` (the one method the shell calls). This is cleaner than the service inspecting `isGenericViewport` itself — the service never branches on the runtime cs type again.

---

## 5. dataId lifecycle registry (§4.7)

New file: `backends/dataIdRegistry.ts`. A small class, owned by `NextViewportBackend` (one instance per backend). `LegacyViewportBackend` never touches it.

```ts
import { utilities as csUtils } from '@cornerstonejs/core';

type DataSetPayload = { kind: 'planar'; imageIds: string[]; volumeId?: string; initialImageIdIndex?: number };

export class DataIdRegistry {
  // GLOBAL refcount keyed on dataId — NOT per-viewport. The provider store is a single
  // process-global namespace (CS-18) and the MPR triptych registers the SAME dataId from N panes.
  private refCounts = new Map<string, number>();
  // per-viewport ledger of dataIds it registered, to drive release on unmount.
  private byViewport = new Map<string, string[]>();

  register(viewportId: string, dataId: string, payload: DataSetPayload): void {
    const prev = this.refCounts.get(dataId) ?? 0;
    if (prev === 0) {
      csUtils.genericViewportDataSetMetadataProvider.add(dataId, payload); // only on 0 -> 1
    }
    this.refCounts.set(dataId, prev + 1);
    const list = this.byViewport.get(viewportId) ?? [];
    list.push(dataId);
    this.byViewport.set(viewportId, list);
  }

  releaseViewport(viewportId: string): void {
    const dataIds = this.byViewport.get(viewportId);
    if (!dataIds) return;
    for (const dataId of dataIds) {
      const next = (this.refCounts.get(dataId) ?? 1) - 1;
      if (next <= 0) {
        this.refCounts.delete(dataId);
        csUtils.genericViewportDataSetMetadataProvider.remove(dataId); // only on 1 -> 0
      } else {
        this.refCounts.set(dataId, next);
      }
    }
    this.byViewport.delete(viewportId);
  }

  destroy(): void {
    for (const dataId of this.refCounts.keys()) {
      csUtils.genericViewportDataSetMetadataProvider.remove(dataId);
    }
    this.refCounts.clear();
    this.byViewport.clear();
  }
}
```

**Key design points:**
- `dataId === displaySetInstanceUID` (stack: `displaySetInstanceUIDs[0]`; volume/MPR: `displaySetInstanceUID`). The overlay-suffix scheme (`${dsUID}::overlay`) for fusion/labelmap is **net-new and deferred** — the current inline volume path already filters overlays out (1185-1192) and SEG/RT go through `_addOverlayRepresentations`, so M0 only needs the bare-UID case. Leave a `dataIdFor(dsUID, role?)` helper stub so the suffix lands without touching call sites later.
- **Where `register` is called:** inside `NextViewportBackend.setStackViewport` (replacing the raw `genericViewportDataSetMetadataProvider.add` at 945) and `NextViewportBackend.setVolumesForViewport`'s native loop (replacing the raw `add` at 1393). Both now go through `this.registry.register(viewport.id, dataId, payload)`.
- **Where `releaseViewport` is called:** the service's `disableElement` dispatches `this.backend.onViewportDisabled(viewportId)` **before** `this.viewportsById.delete` / `this.viewportsDisplaySets.delete`. `NextViewportBackend.onViewportDisabled` calls `this.registry.releaseViewport(viewportId)`. (The registry's own `byViewport` ledger is authoritative, so it does not depend on `viewportsDisplaySets` not yet being deleted — but ordering the dispatch first is the safe convention.)
- **Where `destroy` is called:** the service's `destroy()` dispatches `this.backend.destroy()` (before `viewportsDisplaySets.clear()` / `cache.purgeCache()`), which calls `registry.destroy()`.
- **MPR triptych correctness:** 3 panes → 3 `register(viewportId_i, sameDataId, …)` calls → `provider.add` fires once (0→1), refcount reaches 3. Unmounting one pane → refcount 3→2, no `remove`. The other two still resolve metadata. Last pane → 1→0 → `remove`.
- `LegacyViewportBackend.onViewportDisabled`/`destroy` = `{}` (empty) — byte-identical, since today there is no removal.

---

## 6. Constructor selection (the second sanctioned flag read)

In the constructor (137-142), after `this.servicesManager = servicesManager;`, select once:

```ts
import { isNextViewportsEnabled } from '../../utils/nextViewports';
import { LegacyViewportBackend } from './backends/LegacyViewportBackend';
import { NextViewportBackend } from './backends/NextViewportBackend';

// field
private backend: IViewportBackend;

constructor(servicesManager: AppTypes.ServicesManager) {
  super(EVENTS);
  this.renderingEngine = null;
  this.viewportGridResizeObserver = null;
  this.servicesManager = servicesManager;

  // SANCTIONED FLAG READ #2 (the only other is getCornerstoneViewportType).
  // Selected ONCE here so the chosen backend is fixed for the service's lifetime.
  this.backend = isNextViewportsEnabled()
    ? new NextViewportBackend(this)
    : new LegacyViewportBackend(this);
}
```

Because the service is a singleton created at extension init (after `setNextViewportsEnabled(...)` runs in `init.tsx` line 89-91), the flag is already resolved when the constructor runs. No appConfig threading needed.

**§9 grep/lint CI rule:** forbid `isNextViewportsEnabled` / `useNextViewports` outside an allowlist of exactly: `getCornerstoneViewportType.ts`, `CornerstoneViewportService.ts` constructor, `nextViewports.ts` (the accessor module itself), `init.tsx` (the writer/source). **Must whitelist the TEMP violation at `getToolbarModule.tsx:485`** (the dev toggle evaluator) — or the rule trips. Document that whitelist entry as remove-before-merge alongside the toggle.

---

## 7. Validation plan

**Flag-OFF byte-identical (the critical guarantee):**
1. **Mechanical-diff gate.** For each moved legacy body, diff the moved text against the pre-extraction original with only the receiver rewrite normalized (`this.` ↔ `this.service.`). Zero other token differences allowed. This is the primary proof; do it per method in the PR.
2. **Dual CI lanes.** Run the full existing Jest suite + Playwright e2e with `useNextViewports=false` (default). Must be green and unchanged from `master`.
3. **Presentation-store snapshot tests.** Add unit tests that drive `storePresentation` / `getPresentations` for a stack and a volume viewport and snapshot the `useLutPresentationStore` / `usePositionPresentationStore` contents. Run identical snapshots on the pre-refactor commit and the refactor commit — they must match exactly (keys AND value shapes, §4.5 says keys never change).
4. **Registry no-op proof (off).** Assert `LegacyViewportBackend.onViewportDisabled`/`destroy` make zero `genericViewportDataSetMetadataProvider.add/remove` calls (spy). Confirms the off-path still never registers/removes.

**Flag-ON native still works (the 5 already-validated behaviors must survive extraction):**
1. **Stack render** (M1 behavior): mount a single/multi-frame stack, assert `registry.register` called once with `{kind:'planar', imageIds, initialImageIdIndex}`, `setDisplaySets({role:'source', orientation:ACQUISITION})` called, default VOI seeded from metadata when none provided (the `_getDefaultVoiRangeFromMetadata` path), image not raw/dark.
2. **Volume/MPR render** (M2 behavior): mount an MPR triptych, assert 3 `register` calls with the SAME dataId, `provider.add` fired ONCE, refcount==3; per-orientation `setDisplaySets`.
3. **Data-shape routing**: assert `_setDisplaySets` → `NextViewportBackend.dispatchMount` routes `'volume' in firstData` to volume, else stack — unit test both content states against a PLANAR_NEXT handle.
4. **Position read fork**: `getPositionPresentation` returns `viewPresentation: undefined` for a generic viewport (no throw), `viewReference` still populated by the shared wrapper.
5. **dataId GC (the net-new behavior, the M0 deliverable):** mount triptych → disable one pane → assert no `remove`; disable remaining two → assert exactly one `remove(dataId)` total; `service.destroy()` flushes all remaining. This is the test that did not exist before and proves §4.7.

---

## 8. Risks + smallest-safe-increment landing order

**Risks**
- **R1 — accidental legacy behavior drift during the move.** Highest risk. Mitigation: the mechanical-diff gate (§7.1) + "additive, never edit legacy" review rule. The `setVolumesForViewport` legacy body (~95 lines with the getActors heuristic + setTimeout) is the largest/riskiest single move.
- **R2 — `setVolumesForViewport` is public and externally called** (HP `runImageLoadStrategy`). If the public forwarder's signature/`this` binding changes, the HP continuation breaks even with flag off. Mitigation: keep the public method on the service with the identical loose signature; it just forwards to `this.backend.setVolumesForViewport`.
- **R3 — disable/destroy ordering.** If `onViewportDisabled` is dispatched *after* `viewportsDisplaySets.delete`, a future implementation that reads the ledger from the service would miss it. Mitigation: registry owns its own `byViewport` ledger (independent of `viewportsDisplaySets`); still dispatch the hook first by convention.
- **R4 — facade drift.** Backends reaching service internals not in `IViewportServiceInternals`. Mitigation: type the back-reference as `IViewportServiceInternals`, not the concrete class.
- **R5 — grep rule false-positive on the TEMP toggle** (`getToolbarModule.tsx:485`). Mitigation: explicit allowlist entry, flagged remove-before-merge.
- **R6 — known native blockers surfacing in shared code under the flag** (`getViewportAlignmentData` getCamera CS-8, `_getInitialImageIndexForViewport` ORTHOGRAPHIC `getNumberOfSlices` CS-7, `setPresentations` cast CS-16). These are **out of M0 scope** (deferred to M2/M5); M0 must not try to fix them, only avoid regressing the off path. Note them inline.

**Smallest safe increment order (land sequentially, each independently green):**
1. **Scaffolding only.** Add `IViewportBackend.ts`, `IViewportServiceInternals.ts`, `dataIdRegistry.ts`, and an empty-shell `LegacyViewportBackend` + `NextViewportBackend`. Wire constructor selection. No bodies moved yet — both backends throw `notImplemented` and the service still uses its current private methods. Compiles; flag-off untouched. (Pure plumbing, zero behavioral risk.)
2. **Move presentation reads/writes** (`get/setPositionPresentation`, `get/setLutPresentation`) into both backends; service wrappers delegate. Smallest forked surface, validated by the store-snapshot tests immediately.
3. **Move the dispatch shell** (`_setDisplaySets` → `backend.dispatchMount`) + move `setStackViewport` (legacy tail to legacy, native branch to next). Wire `registry.register` in the next stack path. Validate stack render on + off.
4. **Move `setVolumesForViewport`** (riskiest body) + `_setNativeVolumeDisplaySets` into next; wire registry per-base-volume. Validate MPR triptych.
5. **Wire the GC hooks** (`disableElement`→`onViewportDisabled`, `destroy`→`backend.destroy`) and add the refcount tests (§7 flag-on test 5). This is the M0 net-new deliverable; land it last so the registry has real registrations to release.
6. **Move `updateViewport` keep-camera** + `setEcgViewport` (next ECG = legacy-body stub for now) + leave `setOtherViewport` as the shared template.

Land 1-2 first (lowest risk, establishes the seam and the snapshot harness), then 3-4 (the heavy moves, each behind the diff gate), then 5 (the GC discipline that is the actual point of §4.7).