# Viewport State Architecture — Analysis and Plan

Branch: `ohifohifnextapi` (analysis includes the viewport backend/adapter seam added here).
Scope: ViewportGridService + provider + grid component, CornerstoneViewportService + ViewportInfo,
the new `adapter/` + `backends/` seams, and every consumer of grid/viewport state in the repo.

This document is the architecture proposal. It deliberately does not contain implementation diffs.

---

## 0. Verdict in three sentences

Your stated end state — grid component subscribed to layout only, viewport components subscribed to
their own composition, a per-viewport runtime state that cooperates with CS3D, and an aggregate
"grid stable" signal that policies (sync activation) can subscribe to — is the right target, and
selector-based state subscription is the right mechanism. But selectors are the *second* step, not
the first: the grid state today lives inside a React `useReducer` with service methods injected
into a mutable bag (`serviceImplementation`), and every structural problem you are trying to fix
(event `setTimeout` deferrals, stale `getState()`, readiness implemented three different ways,
`areEqual`/`needsRerendering` hacks) is a symptom of that substrate. The plan below therefore
extracts the state into a framework-agnostic store first, rebuilds the service and React hook as
thin views over it, and only then decomposes the components and adds the runtime/stability layers —
and your backend/adapter work on this branch is not in conflict with any of it; it is the
prerequisite for the runtime layer.

---

## Status (2026-07-04, implementation rounds 1-5, uncommitted on `ohifohifnextapi`)

| Phase | State |
|---|---|
| 0 — Characterization and guardrails | Done |
| 1 — Store extraction | Done |
| 2 — Selector API + layout/composition split | Done |
| 3 — Readiness v2 (runtime slice + stability) | Done |
| 4a — Component decomposition (host, layout-only grid) | Done |
| 4b — Mount orchestration leaves React | Done, via the mount-intent variant (see the 4b design-constraint note in §4.6): the component publishes its received (wrapper-transformed) props as a mount intent on every render, and the controller reconciles/supersedes from intents rather than raw grid composition |
| 5 — Viewport runtime channel | Done |
| 6 — Policies, consolidation, deprecation | Done, except the `setTimeout` event-deferral removal (the deferred legacy broadcasts are still in place) |

---

## 1. Glossary — four kinds of "viewport state"

The codebase currently uses "viewport state" for at least three unrelated things
(`viewportGridService.getViewportState()` returns a grid entry; `ViewportInfo` holds mount
options; overlays read live CS3D state). The redesign names them:

| Term | What it is | Owner | Examples |
|---|---|---|---|
| **Layout** | Grid structure and pane geometry | OHIF grid store | numRows/numCols, pane x/y/w/h, positionId |
| **Composition** | What a viewport *should* show | OHIF grid store | displaySetInstanceUIDs, viewportOptions, displaySetOptions |
| **Runtime** | What a viewport *is* showing right now | CS3D (read-through), plus an OHIF lifecycle mirror | slice index, orientation, VOI, view reference, phase (mounting/rendered/settled) |
| **Stability** | Aggregate derived state over runtime vs composition | OHIF grid store (derived) | "every viewport has rendered the composition it was asked to render" |

Everything below is organized around keeping these four separate, with explicit joins
(`viewportId` + revision counters).

---

## 2. Current state — what the code actually does

### 2.1 The grid stack

Files: `platform/core/src/services/ViewportGridService/ViewportGridService.ts`,
`platform/ui-next/src/contextProviders/ViewportGridProvider.tsx`,
`platform/app/src/components/ViewportGrid.tsx` (the orchestrator; note the ui-next file of the
same name is just a positioning div).

State shape (`platform/core/src/types/ViewportGridType.ts`): `{activeViewportId, layout{numRows,
numCols, layoutType}, isHangingProtocolLayout, viewports: Map<viewportId, {displaySetInstanceUIDs,
viewportOptions, displaySetOptions, x, y, width, height, viewportLabel, isReady}>}` — layout
geometry, composition, and readiness all on one object, one React reducer.

The mechanics that matter:

- **The service is implemented by the provider.** `setServiceImplementation`
  (`ViewportGridService.ts:93`) receives `useCallback` closures from the provider; the provider
  re-injects them in a `useEffect` after every commit (`ViewportGridProvider.tsx:493-522`) because
  `getState` closes over the state value. Between a dispatch and that effect re-run,
  `service.getState()` returns stale state.
- **Every mutating event is deferred with `setTimeout(0)`** (`ViewportGridService.ts:154, 215,
  267, 312`) to paper over the above. Comments say "queueMicrotask"; the code uses macrotasks.
  `setDisplaySetsForViewports` is `async` and awaits a dispatch that returns nothing.
- **The reducer has state-destroying paths**: `VIEWPORT_IS_READY` with an unknown viewportId does a
  bare `return;` (state becomes `undefined`, `ViewportGridProvider.tsx:358-360`); the `default`
  case returns `action.payload` (`:373-374`).
- **The reducer mutates "read-only" state** (`previousViewport.viewportOptions.initialImageOptions
  = null` at `:181-186`; `Object.assign(viewport, …)` + `viewport.isReady = false` at `:307-314`)
  and performs a cross-service call inside reduction (`service.getPresentationIds` at `:227`).
- **The hook API has drifted until part of it broke**: the `api` tuple element is rebuilt every
  render (`:525`, unstable identity in consumer deps), and `api.set` calls `service.setState(…)`
  (`:535`) — a method that does not exist on the service or its base class. Nobody noticed,
  which tells you nobody can tell the two call paths (service vs hook api) apart.
- **The grid component is an orchestrator**: it subscribes to HP `PROTOCOL_CHANGED` and translates
  stages to `setLayout` (`ViewportGrid.tsx:129-140`), resolves DisplaySet objects per pane per
  render (`:194-200`), calls `getState()` per pane during render for border styles (`:228-231`),
  aggregates readiness by polling `getGridViewportsReady()` in an effect guarded by a layout hash
  (`:143-150`), and rebuilds all panes when `activeViewportId` changes — the code says so itself:
  `// This is causing the viewport components re-render when the activeViewportId changes` (`:193`).
- **Grid state is additionally mirrored into 4+ zustand stores** (`useViewportGridStore` for HP
  stage snapshots, `useToggleOneUpViewportGridStore` for one-up restore — which snapshots the live
  `viewports` Map **by reference**, so later in-place mutations can corrupt the "snapshot" —
  plus `useDisplaySetSelectorStore`, `useHangingProtocolStageIndexStore`).

### 2.2 The viewport component and the mount path

`extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx` (unchanged on this branch):

- Receives fat props from the grid (`displaySets` objects rebuilt every grid render).
- Data mounting is driven by React prop-diffing: effect on `[viewportOptions, displaySets,
  dataSource]` → `createViewportData` → `setViewportData` (`:269-305`). The only thing preventing
  a full data remount when you *click a different pane* is `React.memo` with a 60-line hand-written
  deep comparator (`areEqual`, `:422-485`) that must enumerate every prop that may matter.
- `needsRerendering` exists to defeat that comparator on purpose (SEG hydration pokes a remount),
  and is cleared by mutating the prop object mid-effect (`:291-293`). The component also mutates
  `viewportOptions.viewportType` during render (`:75-79`) — writing into grid state.
- Element lifecycle, toolGroup/syncGroup membership, synchronizer rehydration, presentation
  store-on-unmount all live in this one component.

### 2.3 CornerstoneViewportService and the branch's seams

The service (1,624 lines) holds: rendering engine lifecycle, `viewportsById: Map<viewportId,
ViewportInfo>`, a **second** composition registry `viewportsDisplaySets: Map<viewportId,
string[]>`, resize queueing, presentation capture/restore, and the mount orchestration
(`setViewportData` → `_setDisplaySets` → `backend.dispatchMount`). `ViewportInfo` is a mutable
bag whose options/data/id are overwritten in place on every `setViewportData` (`:563-568`).

What this branch added (and got right):

- `adapter/IViewportAdapter` — a next-shaped, per-viewport read/write facade over legacy vs native
  API differences (view state, presentation, dataId addressing, classification), the **single**
  sanctioned `isGenericViewport` call site, WeakMap-cached, with side-by-side contract tests.
- `backends/IViewportBackend` — one-per-session mount/remount/presentation/dataId lifecycle,
  selected once from `useNextViewports`; the service keeps lane-agnostic preludes.
- `backends/IViewportOperations` + segmentation backend twins; `nextViewportPolicies`;
  `viewportDataShape` (pre-mount shape classification via persisted `dataShapeType`);
  a boundary-enforcement script and a README that names the three homes for divergence.
- Crucially: **no new events or subscription surfaces** (verified against merge-base; the only new
  listener in the whole diff is a `CAMERA_MODIFIED` re-seed in the slice progress scrollbar). The
  branch widened the *imperative read* contract, not the event contract.

Remaining warts in this area (independent of the branch): the shared volume tail in
`setVolumesForViewport` (`:1200-1297`) that native only "traverses safely"; `dataShapeType` as a
second type discriminator bolted next to `viewportType` (`Viewport.ts:235` documents a bug it
already caused); presentation application re-entrancy (native re-invokes `setPresentations` from
inside mounts); eight dead `unknown`-typed fields on the service (`:171-178`).

### 2.4 Consumers — who needs what

Inventory across platform/extensions/modes (details in the appendix-level notes below):

- **Cohort A — layout/active-viewport readers**: 23 `useViewportGrid()` context consumers + ~38
  `viewportGridService.getState()` call sites, almost all reading only `activeViewportId` or the
  `viewports` map. All of them re-render (or re-fire) on every grid change today.
- **Cohort B — per-viewport composition readers**: the viewport wrappers (SEG/RT/SR/PMAP),
  `useViewportDisplaySets`, sync toggles, `useViewportSegmentations`.
- **Cohort C — CS3D runtime readers**: overlays, both scrollbars, orientation markers, loading
  indicator, `useViewportRendering` (8 `useState` mirrors fed by service events + raw element
  listeners + colorbar service), `ViewportWindowLevel`. Each wires its own element listeners.
  This branch already centralized their *reads* behind `getViewportAdapter`/`viewportDataShape`.
- **Cohort D — aggregate readiness**: implemented **three different ways today**:
  1. per-viewport `isReady` boolean set on element-enable + polling `getGridViewportsReady()`
     + one-shot `VIEWPORTS_READY` (grid component effect);
  2. `VIEWPORT_DATA_CHANGED` events counted up to `numPanes` in
     `attachProtocolViewportDataListener` (`extensions/cornerstone/src/commandsModule.ts:1405`)
     to trigger HP `onViewportDataInitialized`;
  3. ad-hoc cornerstone element events (12 distinct load-signal patterns counted; there is no
     unified "first render" signal).
- **Sync groups**: membership is declared in `viewportOptions.syncGroups` and wired at
  `ELEMENT_ENABLED` (`OHIFCornerstoneViewport.tsx:181`) with **no readiness gating anywhere**.
  The "activate sync only when grid is stable" behavior does not exist today and has no natural
  place to be written.
- Dead surface: `GRID_SIZE_CHANGED` has zero subscribers.

### 2.5 Root causes

1. **The store is React state, and services are grafted onto it** — everything else (timing hacks,
   stale reads, broken `api.set`) follows from this inversion.
2. **One undifferentiated state object + identity-unstable derived data** (displaySets arrays,
   `api`) — so every consumer over-subscribes, and the only defenses are hand-written comparators.
3. **Composition, layout, runtime, and readiness are entangled** — `isReady` lives on the
   composition entry, is reset only on `SET_LAYOUT` (stale-true on display-set swaps), and means
   "element enabled", not "content rendered".
4. **The data-mount lifecycle is driven by React prop diffing** — `areEqual` +
   `needsRerendering` + prop mutation are the workarounds.
5. **No revision/epoch concept** — nothing can express "this ready signal belongs to that
   composition", which is exactly what stability-gated sync needs.

---

## 3. Pushback — where I disagree or refine your framing

Point by point against your stated goals:

1. **"Viewport grid component listens to grid changes without viewport content changes."**
   Agree. Mechanism: a layout slice (structure + geometry only) with its own revision; the grid
   component subscribes to that slice alone. Note the pane `key=viewportId` reconciliation trick
   (`ViewportGrid.tsx:250-260`) must be preserved — panes should *move*, not remount, across
   stage changes.

2. **"Viewport component listens to the current display set(s) and initiates changes for
   recording that."** Agree on the listening half; **push back on components being the write
   path.** Components should render and hand over a DOM element; *recording* (display-set
   history, presentation capture) and *mounting* belong to store-subscribing coordinators.
   React lifecycle is the wrong driver for imaging-data lifecycle — `areEqual`,
   `needsRerendering`, StrictMode double-effects, and the interleaving `loadViewportData`
   promises are the accumulated evidence. The plan phases this so the interim state (component
   keyed by an explicit `compositionRevision`) is already a big improvement before the full
   mount-controller inversion.

3. **"Viewport internal state that knows what image is displayed, the orientation, etc."**
   Agree, with one hard rule: **do not mirror continuous CS3D state into an OHIF store.**
   CS3D remains the source of truth; OHIF keeps a revision counter bumped by normalized events
   and computes snapshots *through the adapter* on demand (cached per revision). Only lifecycle
   facts OHIF itself owns (mounting/rendered/settled) are stored. Copying camera/VOI into a store
   is how the presentation-state class of bugs multiplies, and interaction-frequency updates would
   thrash every subscriber.

4. **"Load state as part of viewport grid state, listened via useViewportGrid with a method to
   get the specific state part."** Agree with the *surface* (it should be readable from the same
   hook with a selector); **push back on the representation.** A plain `isReady` boolean on the
   viewport entry is what exists today and it demonstrably fails all three requirements: it means
   element-enabled rather than rendered, it goes stale on display-set swaps (only `SET_LAYOUT`
   resets it), and aggregation happens by polling in a component effect. Load state must be a
   **runtime entry `{phase, forRevision}` keyed to the viewport's `compositionRevision`**, with
   the aggregate ("stability") *derived* in the store. Otherwise "activate sync when stable"
   races: the old viewport's ready signal arrives while the new composition is being applied.

5. **"Activate sync only when grid is stable, auto-deactivate on composition changes."**
   Agree; with revisions this becomes a ~15-line policy (code in §5.4). Today it is unimplementable
   without adding yet another bespoke listener chain.

On the reviewer's comment ("you can do all these things with the new listeners you've added, but
it requires multiple ways of doing things... the future is state management with state
selection"): **agree with the direction, and it actually understates the problem.** The "multiple
ways" already ship on master — six grid events plus `isReady` plus `VIEWPORT_DATA_CHANGED`
counting are three parallel readiness systems (§2.4). Selectors bolted on top of the current
context/injection substrate would not fix the synchronous-read or event-ordering problems; the
store has to move out of React first. Also worth stating plainly in the PR discussion: **this
branch added no listeners** — its adapter layer is the *read* normalization that the selector
model needs anyway.

On this branch's direction (backends/adapters): **keep it; it is a prerequisite, not a
competitor.** Two asks so it stays aligned:

- Backends and adapters must remain **event-silent**. All change notification flows through one
  runtime channel (§4.7). No per-lane subscription surfaces, ever.
- `dataShapeType` should graduate from "field bolted onto viewportData" to *the* shape
  discriminator carried in composition state, decided pre-mount, so `viewportType` stops being
  overloaded as a type-and-shape hybrid. Longer term the "shared volume tail" in
  `setVolumesForViewport` should be owned entirely by the legacy backend so the service holds no
  lane-shaped code at all.

And two pre-emptive "don't do this" pushbacks on tempting alternatives:

- **Don't split pane identity from viewport identity.** Revisions (`layoutRevision`,
  `compositionRevision`) express everything reuse/remount needs; a second identity would ripple
  through HP viewportIds, presentation IDs, and sync groups for no gain.
- **Don't reach for `useContextSelector` / more `React.memo`.** They treat symptom P2 while
  leaving P1/P3/P5 (services can't read/write correctly, readiness fragmented) untouched.

---

## 4. Target architecture

### 4.1 Principles

1. **One writable source of truth per state kind**, living outside React. React subscribes;
   services read/write synchronously; events become derived notifications.
2. **Subscribe by selector; notify by slice.** No consumer sees updates for state it did not
   select. Referential stability is a store responsibility, not a consumer defense.
3. **CS3D owns runtime truth.** OHIF stores revisions and lifecycle phases, never copies of
   continuous state. Reads go through `IViewportAdapter`.
4. **Transactions, not call choreography.** An HP stage apply is one atomic transaction producing
   one notification wave, with all derived state (presentation IDs, active viewport, stability)
   computed inside it.
5. **Revisions join the layers.** Every composition change bumps `compositionRevision`; every
   runtime report carries `forRevision`; stability compares them. Stale signals become inert.
6. **Compatibility is a facade, not a fork.** The existing service API, events, and
   `useViewportGrid()` tuple keep working throughout the migration, reimplemented over the store.

### 4.2 The grid store (platform/core)

Zustand **vanilla** store (`createStore` + `subscribeWithSelector`) — no React import; core
services and the React binding share it. (Fallback if a new core dependency is vetoed: a ~100-line
hand-rolled equivalent; the API below doesn't change. zustand 4.5.5 already ships in the app
bundle.)

```ts
// platform/core/src/services/ViewportGridService/gridStore.ts
interface ViewportGridStoreState {
  // ---- layout slice: structure only ----
  layout: {
    layoutType: string;
    numRows: number;
    numCols: number;
    panes: PaneGeometry[];            // ordered: {viewportId, positionId, x, y, width, height}
    layoutRevision: number;
  };
  activeViewportId: string | null;
  isHangingProtocolLayout: boolean;

  // ---- composition slice: what each viewport should show ----
  viewports: Map<string, ViewportComposition>;

  // ---- runtime slice: lifecycle of what each viewport is showing ----
  runtime: Map<string, ViewportRuntimeEntry>;

  // ---- derived: recomputed inside every transaction ----
  derived: {
    epoch: number;                    // bumps on any layout/composition transaction
    allMounted: boolean;
    allRendered: boolean;
    allSettled: boolean;
    pendingViewportIds: string[];
  };
}

interface ViewportComposition {
  viewportId: string;
  displaySetInstanceUIDs: string[];
  viewportOptions: GridViewportOptions;   // same shape as today
  displaySetOptions: unknown[];
  viewportLabel: string | null;
  compositionRevision: number;            // bumps when any of the above change
}

interface ViewportRuntimeEntry {
  forRevision: number;                    // which compositionRevision this describes
  phase: 'detached' | 'mounting' | 'mounted' | 'rendered' | 'settled' | 'error';
  pendingWork: number;                    // open work tokens (streaming, seg hydration, …)
}
```

Transactions (each = one store update, one notification wave, derived recomputed):

```ts
applyLayout(props)                 // today's setLayout semantics incl. findOrCreateViewport
setDisplaySets(updates[])          // today's setDisplaySetsForViewports semantics
setActiveViewport(viewportId)
bumpComposition(viewportId, why)   // replaces the needsRerendering prop-mutation hack
reportPhase(viewportId, phase, forRevision)
beginWork(viewportId, token) / endWork(viewportId, token)
set(partial) / reset()             // compat
snapshot(): FrozenGridSnapshot / restore(snapshot)   // one-up toggle, HP stage cache
```

Rules encoded in the store, not in callers:

- Presentation-ID computation happens in the transaction pre-step (it is a pure function of the
  candidate state), never during "reduction", and never by mutating prior entries.
- `runtime` entries reset to `{phase:'detached', forRevision: <new revision>}` whenever the
  viewport's composition changes — fixing the stale-`isReady` bug class by construction.
- All emitted objects are frozen in dev builds; `snapshot()` deep-copies (fixing the
  one-up-restore aliasing bug).
- Maps are replaced, entries are reused when untouched — per-viewport selectors bail out on
  `Object.is`.

Selectors ship next to the store as named, tested functions:

```ts
// platform/core/src/services/ViewportGridService/selectors.ts
export const selectLayout = s => s.layout;
export const selectActiveViewportId = s => s.activeViewportId;
export const selectViewport = (id: string) => s => s.viewports.get(id);
export const selectIsActive = (id: string) => s => s.activeViewportId === id;
export const selectStability = (level: 'mounted' | 'rendered' | 'settled') => s => ({
  isStable: s.derived[levelKey(level)],
  epoch: s.derived.epoch,
  pending: s.derived.pendingViewportIds,
});
```

### 4.3 ViewportGridService becomes a facade

Same registration, same public methods, plus a selector subscription for non-React code:

```ts
viewportGridService.select(selector, listener, { equality? }) => unsubscribe
```

- `getState()` returns a **legacy-shaped snapshot** (viewport entries re-assembled with
  x/y/w/h and an `isReady` computed from `runtime.phase >= 'mounted'`), cached per epoch — every
  one of the ~38 existing call sites keeps working, now always-current (no more mid-transaction
  staleness).
- The six existing EVENTS remain, republished from store subscriptions (`GRID_STATE_CHANGED` on
  composition transactions, `LAYOUT_CHANGED` on layout transactions, `ACTIVE_VIEWPORT_ID_CHANGED`,
  `VIEWPORTS_READY` when `allMounted` first becomes true for a `layoutRevision`). They are
  documented as the deprecated bridge. The `setTimeout` deferral is kept initially for
  bug-for-bug timing compatibility and removed in the cleanup phase after consumers are audited.
  *As implemented*, the `VIEWPORTS_READY` bridge dedupes one publish per `layout.layoutRevision`
  but subscribes to the `(allMounted, layoutRevision)` pair — evaluating every transaction rather
  than watching `allMounted` edges — because a relayout that reuses every viewport carries the
  runtime forward and can already be `allMounted` inside the `applyLayout` transaction, with no
  later transition to observe. A premature manual `publishViewportsReady()` (called while
  `allMounted` is still false) broadcasts but does NOT consume the revision's publish slot, so
  the automatic bridge still fires for the genuine all-mounted transition; a mounted manual call
  marks the revision so the bridge cannot double-fire.
- `setServiceImplementation` is deleted (kept one release as a warn-once no-op for third parties).
- `getViewportState(viewportId)` is deprecated in favor of `getViewportComposition(viewportId)` —
  freeing the term "viewport state" for the runtime layer (§4.7).

### 4.4 React binding

```ts
// overloads — same export site as today (@ohif/ui-next)
useViewportGrid(): [LegacyGridState, ViewportGridApi];            // unchanged, deprecated
useViewportGrid<T>(selector: (s: ViewportGridStoreState) => T,
                   equality?: (a: T, b: T) => boolean): T;        // the new way
useViewportGridApi(): ViewportGridApi;                            // stable identity, actions only
```

Implemented with `useSyncExternalStoreWithSelector` over the store held in a trivial context
provider (the provider now only injects the store/service instance — enabling test isolation and
future multi-grid windows — and contains zero logic). The `api` object becomes a module-stable
singleton, fixing the unstable-deps footgun.

### 4.5 Component decomposition

```
ViewerViewportGrid            subscribes selectLayout ONLY
  └─ ViewportPane (per pane)  subscribes selectIsActive(id) — active border, drop target
       └─ ViewportHost        subscribes selectViewport(id) — resolves DisplaySets narrowly,
            │                 picks the viewport component by SOPClassHandlerId
            └─ <XViewport/>   extension component: element + overlays; contract = { viewportId }
```

- The grid component sheds: HP subscription (→ coordinator, §4.6), displaySet resolution
  (→ host), readiness polling (→ derived state), per-render `getState()` border computation
  (→ geometry from the layout slice).
- Clicking a pane re-renders exactly two `ViewportPane` border wrappers; zero viewport internals.
- `ViewportHost` passes `displaySets` down for backward compatibility, but the prop identity is
  stable per `compositionRevision` — so `React.memo(areEqual)` can be deleted, replaced by
  nothing. `needsRerendering` (grid option, prop, and comparator entry) is deleted; SEG hydration
  calls `bumpComposition(viewportId, 'segmentation-hydrated')`.
- The two same-named `ViewportGrid` components get distinct names (`ViewportGridLayout` in
  ui-next).

### 4.6 Mount orchestration leaves React (the reconciler)

End state for the data path:

```
Component:   attachElement(viewportId, element)  /  detachElement(viewportId)
Controller:  subscribes per-viewport composition (+ element registry) and reconciles:
             element && composition && runtime.forRevision !== compositionRevision
               → supersede any in-flight mount for this viewportId
               → createViewportData → backend.dispatchMount → presentations
               → reportPhase('mounted'|'rendered', revision)
```

- Lives in extensions/cornerstone next to CornerstoneViewportService (it is the thing that calls
  it); `ViewportInfo` becomes an immutable per-(viewportId, revision) construct instead of a
  mutable bag.
- Explicit supersession kills the interleaved `loadViewportData()` promise races; StrictMode
  double-mounts reduce to idempotent attach/detach.
- Tool-group/sync-group membership and the metadata-invalidation subscription move here from the
  component (they are composition-level concerns; today's per-component `ELEMENT_ENABLED` handler
  and `DISPLAY_SET_SERIES_METADATA_INVALIDATED` effect are deleted).
- Side benefit worth naming: the grid becomes drivable without React (headless tests, OHIF as an
  embedded library).
- HP's `PROTOCOL_CHANGED → applyLayout` translation moves from the grid component into a small
  `HangingProtocolGridCoordinator` registered at app/mode setup.

This is the one structural change your bullet 2 pushes against ("viewport component ... initiates
changes"), so it is phased: **4a** keeps component-initiated mounting but keyed on the single
`compositionRevision` value (deletes the deep comparator immediately); **4b** moves to the
controller. If 4b stalls, 4a is already a stable resting point.

**4b design constraint discovered during implementation (2026-07-04):** the SEG/SR/RT/tracked
viewport wrappers render `OHIFCornerstoneViewport` with *transformed* mount inputs (e.g. the
referenced series display set instead of the SEG the grid composition names, plus their own
viewportOptions). Today the mount driver takes those from props, so a controller reconciling raw
grid composition would mount the wrong data for every wrapped viewport type. Before 4b can land,
the wrappers need an explicit **mount-intent contract** — either a per-viewport-type
composition-to-mount-plan resolver registered alongside the viewport component, or an
`attachElement(viewportId, element, intent)` handoff where the wrapper supplies the transformed
intent. Until that is designed, component-driven mounting (with `areEqual`) remains load-bearing
and must not be deleted.

### 4.7 Per-viewport runtime state (the CS3D-cooperating layer)

One channel per mounted viewport, owned by extensions/cornerstone, fed by adapter-normalized
cornerstone events, exposed with the subscribe+getSnapshot contract:

```ts
type ViewportRuntimeSnapshot = {
  revision: number;
  phase: 'detached' | 'mounting' | 'mounted' | 'rendered' | 'settled' | 'error';
  shape: ViewportShape;                       // adapter.getShape()
  displaySetInstanceUIDs: string[];
  viewReference?: Types.ViewReference;        // CS3D vocabulary, verbatim
  viewState?: ViewportViewState;              // adapter.getViewState()
  presentation?: ViewportPresentation;        // active binding VOI/colormap/invert
  sliceIndex?: number;
  numSlices?: number;
};

cornerstoneViewportService.getViewportRuntime(viewportId): ViewportRuntimeSnapshot;
cornerstoneViewportService.subscribeViewportRuntime(viewportId, cb): unsubscribe;

// React
useViewportState(viewportId, selector, equality?)   // extensions/cornerstone hook
```

How it "works with CS3D state" — the crux of your bullet 3:

- **Events → revision.** The channel wires, once per viewport: `getSliceEventName(...)`
  (STACK_NEW_IMAGE / VOLUME_NEW_IMAGE), `VOI_MODIFIED`, `COLORMAP_MODIFIED`, `CAMERA_MODIFIED`
  (rAF-throttled), first `IMAGE_RENDERED` per mount revision, `ELEMENT_DISABLED`. Each bumps
  `revision` and invalidates the cached snapshot. Nothing else is stored.
- **Snapshot = read-through.** `getViewportRuntime` computes lazily via `getViewportAdapter`
  (`getViewState`, `getPresentation`, `getShape`, `getViewReference`, slice count via
  `viewportDataShape`) and caches per revision — satisfying `useSyncExternalStore`'s stable
  snapshot requirement without ever copying CS3D truth. Legacy and native lanes are identical to
  consumers because the adapter is the read layer; the snapshot vocabulary is deliberately the
  native one (`viewReference`/`viewState`), which is exactly why the adapter contract being
  "next-shaped" was the right call.
- **Lifecycle flows up.** The channel (and mount pipeline) call `reportPhase` /
  `beginWork`/`endWork` on the grid store — the only writes crossing from runtime to grid state.
  Volume streaming completion and segmentation hydration hold work tokens, defining `settled`.
- This replaces, one for one: the per-overlay element-listener wiring (scrollbars, loading
  indicator, orientation markers, window-level overlay), `useViewportRendering`'s eight `useState`
  mirrors + three subscription mechanisms, and the branch's own `CAMERA_MODIFIED` re-seed patch
  in the progress scrollbar (the channel's revision bump on camera reorient covers it).
  `useViewportRendering` keeps its public shape, reimplemented over `useViewportState`.

### 4.8 Readiness and stability semantics

Phases, per viewport, always relative to a `compositionRevision`:

- `mounted` — element enabled and data bound (≈ today's `VIEWPORT_DATA_CHANGED`; strictly
  stronger than today's `isReady` = element-enabled).
- `rendered` — first `IMAGE_RENDERED` for that revision (this signal does not exist today; 12
  ad-hoc patterns approximate it).
- `settled` — rendered and `pendingWork === 0`.

Derived stability recomputes in-transaction; `derived.epoch` bumps on every layout/composition
transaction so policies can distinguish "became unstable because composition changed" (epoch
moved) from "still loading" (same epoch, pending non-empty).

Compat mapping (behavior-preserving by default, correctness opt-in):
`VIEWPORTS_READY` republished when `allMounted` first becomes true per `layoutRevision`
(today's consumers: StudyPrefetcher first-load, toolbar refresh, mode toolbar listeners);
`attachProtocolViewportDataListener`'s pane counting is replaced by a one-line
`select(selectStability('mounted'), …)` — with its timing verified against HP
`onViewportDataInitialized` expectations before the old path is deleted.

### 4.9 Fit with the backend/adapter seam (this branch)

| Layer (this plan) | Uses from the branch | Rule |
|---|---|---|
| Runtime snapshot reads | `IViewportAdapter`, `viewportDataShape` | adapter stays the only place that knows lanes exist |
| Mount pipeline (4.6) | `IViewportBackend.dispatchMount/remount`, presentations | backends stay event-silent; report lifecycle only via the pipeline's `reportPhase` |
| Composition | `dataShapeType` becomes a composition field decided pre-mount | single shape discriminator; `viewportType` stops doing double duty |
| Policies | `nextViewportPolicies` | unchanged |

No part of the state plan requires reworking the branch. The reverse dependency is real, though:
without the adapter, §4.7 would need per-lane branches in every snapshot getter.

### 4.10 What this deletes (the payoff list)

`setServiceImplementation` + closure re-injection; all four `setTimeout(0)` event deferrals; the
`async` mutation methods; `areEqual` (60 lines) and both `needsRerendering` flags; prop mutation
in render; `getGridViewportsReady` polling + `layoutHash`; the pane-counting readiness detector;
per-overlay element-listener wiring (5+ sites); `useViewportRendering`'s state mirrors; the
by-reference grid snapshots in one-up/HP stores; `GRID_SIZE_CHANGED` (dead); the two
state-nuking reducer paths (by construction); `viewportsDisplaySets` as a second composition
registry (the store is the registry).

---

## 5. Extension developer experience (the contract, shown as code)

### 5.1 Reading grid state — layout vs composition vs active

```tsx
// A toolbar widget that must re-render only when the layout changes:
function LayoutIndicator() {
  const { numRows, numCols } = useViewportGrid(selectLayout);
  return <span>{numRows}x{numCols}</span>;
}

// A pane border that must re-render only when THIS pane's active-ness flips:
function PaneChrome({ viewportId }) {
  const isActive = useViewportGrid(selectIsActive(viewportId));
  return <div className={isActive ? 'border-highlight' : 'border-input'} />;
}

// A viewport wrapper that must re-render only when ITS composition changes:
function MyViewportHostLogic({ viewportId }) {
  const composition = useViewportGrid(selectViewport(viewportId));
  const displaySets = useDisplaySets(composition.displaySetInstanceUIDs); // narrow DS subscription
  // composition.compositionRevision is the remount/refetch key — no deep compares
}
```

### 5.2 Reading live viewport state inside a viewport (CS3D-backed)

```tsx
// Overlay: slice indicator — updates on scroll, nothing else
function SliceIndicator({ viewportId }) {
  const { sliceIndex, numSlices } = useViewportState(
    viewportId,
    s => ({ sliceIndex: s.sliceIndex, numSlices: s.numSlices }),
    shallow
  );
  return <span>{sliceIndex + 1}/{numSlices}</span>;
}

// Window-level readout — updates on VOI changes only, both lanes, no element listeners
function WindowLevelLabel({ viewportId }) {
  const voi = useViewportState(viewportId, s => s.presentation?.voiRange);
  return voi ? <span>W:{width(voi)} L:{center(voi)}</span> : null;
}

// Imperative, non-React (a command):
const snap = cornerstoneViewportService.getViewportRuntime(viewportId);
if (snap.phase === 'rendered' && snap.shape === 'volume') {
  viewportOperations.rotate(viewport, 90);
}
```

### 5.3 A custom (non-cornerstone) viewport reporting lifecycle

```tsx
function OHIFVideoViewport({ viewportId }) {
  const lifecycle = useViewportLifecycle(viewportId); // bound to current compositionRevision
  return (
    <video
      onLoadedData={() => lifecycle.rendered()}
      onCanPlayThrough={() => lifecycle.settled()}
      onError={e => lifecycle.error(e)}
    />
  );
}
// Cornerstone viewports never call this — the mount pipeline + runtime channel report for them.
```

### 5.4 The flagship policy: sync activation gated on stability

```ts
// extensions/cornerstone/src/coordinators/syncStabilityPolicy.ts — registered in onModeEnter
export function installSyncStabilityPolicy({ servicesManager }) {
  const { viewportGridService, syncGroupService } = servicesManager.services;
  let activeEpoch = -1;

  return viewportGridService.select(
    selectStability('rendered'),
    ({ isStable, epoch }) => {
      if (epoch !== activeEpoch) {
        // any composition/layout change: sync immediately suspends
        syncGroupService.suspendAll();
        activeEpoch = epoch;
      }
      if (isStable) {
        // every viewport has rendered the composition belonging to THIS epoch
        syncGroupService.resumeAll();
      }
    }
  );
}
```

Walkthrough during an HP stage change: `applyLayout` bumps `epoch` and resets every runtime entry
→ the policy fires with `isStable:false`, sync suspends. Old viewports' late `IMAGE_RENDERED`
events carry stale `forRevision`s and are ignored by the store. As each pane renders its new
composition it reports `rendered` for the new revision; when the last one lands, `isStable`
flips true for the same epoch and sync resumes. No timers, no counting, no races.

*As implemented* (`extensions/cornerstone/src/utils/syncStabilityPolicy.ts`), the handler mirrors
`isStable` into `suspendAll`/`resumeAll` rather than latching on the epoch as sketched above,
because the store carries the runtime phase forward across display-set swaps, so instability can
arrive in a later notification (when the mount pipeline invalidates the runtime entry) than the
epoch bump — mirroring covers both orderings and both calls are idempotent. The epoch is kept
only for the debug log line. Installation is opt-in via `appConfig.useSyncStabilityPolicy` or the
`?useSyncStabilityPolicy=true` URL param (URL wins when present).

### 5.5 Aggregate load state in a panel

```tsx
function StudyLoadBadge() {
  const { isStable, pending } = useViewportGrid(selectStability('settled'));
  return isStable ? <Check /> : <Spinner label={`${pending.length} viewports loading`} />;
}
```

### 5.6 Non-React service code (a prefetcher, an analytics hook)

```ts
const unsubscribe = viewportGridService.select(
  s => s.activeViewportId,
  activeViewportId => studyPrefetcherService.reprioritize(activeViewportId)
);
```

### 5.7 What stays exactly the same

`viewportGridService.setLayout / setDisplaySetsForViewports / setActiveViewportId / getState`,
the HP flow, `commandsManager.run('setDisplaySetsForViewports', …)`, viewport modules'
registration, and (until deprecation completes) `useViewportGrid()`'s `[state, api]` tuple and
all six events.

---

## 6. Migration plan

Dependencies are strictly ordered; each phase is shippable and leaves the app releasable.

### Phase 0 — Characterization and guardrails
Write down current behavior before moving it: unit-capture the reducer semantics worth keeping
(viewportOptions inheritance incl. the `isHangingProtocolLayout` branches, presentationIds
computation, `determineActiveViewportId`); Playwright flows for HP stage apply, drag-drop,
one-up toggle + restore, active-border, sync toggle; an event-order probe test (which events fire,
in what order, for each mutation). Fix nothing yet.
*Acceptance: suite green on the current branch; every §2 wart reproduced by a test or explicitly
waived.*

### Phase 1 — Store extraction (the substrate fix)
`gridStore.ts` + transactions in platform/core; ViewportGridService reimplemented over it;
provider reduced to store injection; `useViewportGrid()` returns the same tuple via
`useSyncExternalStore`; `setServiceImplementation` deleted (warn-once shim); presentationId
computation moved into transactions; the two state-nuking reducer paths and the in-place
mutations fixed; `api` made stable; `api.set` actually wired.
Keep: event names, `setTimeout` deferral (for now), async method signatures (now trivially
resolved), legacy `getState()` shape.
*Acceptance: Phase 0 suite green; new test — `await setDisplaySetsForViewports(...)` then
`getState()` reflects the change synchronously.*
*Risk: consumers depending on stale-read timing; the deferral bridge + event-order probe manage it.*

### Phase 2 — Selector API and the layout/composition split
State reshaped into the §4.2 slices with revisions; selector overload on `useViewportGrid`;
`viewportGridService.select`; legacy `getState()` assembled per epoch; migrate Cohort A's hottest
readers (`getBorderStyle` per-render `getState()`, `useActiveViewportDisplaySets`, `useToolbar`,
StudyPrefetcher) to selectors as the proof.
*Acceptance: render-count test — activating a viewport re-renders only the two pane chromes;
changing one pane's display set re-renders only that host.*

### Phase 3 — Readiness v2 (runtime slice + stability)
`runtime` slice, `reportPhase`, work tokens, `derived` stability; `onElementEnabled →
setViewportIsReady` replaced by pipeline reporting (`mounted` on data-bound — strictly better
than element-enabled); grid component's polling effect + `layoutHash` deleted; `VIEWPORTS_READY`
bridged per §4.8; `attachProtocolViewportDataListener` reimplemented on `select(...)`.
*Acceptance: stability integration test across an HP stage change (no stale-ready flicker: assert
`isStable` never true between epoch bump and last new-revision render); StudyPrefetcher first-load
and HP `onViewportDataInitialized` timing unchanged.*

### Phase 4 — Component decomposition
**4a**: `ViewportHost` extraction; grid subscribes to layout only; pane-level `selectIsActive`;
displaySet resolution + component pick in host; stable props keyed by `compositionRevision`;
delete `areEqual`, `needsRerendering`, render-time prop mutations (`viewportType` override moves
into the `setDisplaySets` transaction).
**4b**: `attachElement`/`detachElement` + mount controller with supersession; tool/sync-group
membership and metadata-invalidation move into it; HP coordinator extracted from the grid
component. Land 4b behind a short-lived internal flag, on for CI.
*Acceptance: drag-drop during active scroll cannot interleave mounts (supersession test);
StrictMode double-mount clean; all Phase 0 flows green with the flag on.*

### Phase 5 — Viewport runtime channel
Channel + `getViewportRuntime`/`subscribeViewportRuntime` + `useViewportState`; migrate the
Cohort C consumers (both scrollbars, loading indicator, orientation markers, window-level
overlay); reimplement `useViewportRendering` over it (public shape unchanged); delete the
superseded element-listener wirings including the branch's `CAMERA_MODIFIED` scrollbar patch.
*Acceptance: overlay behavior parity on legacy AND `?useNextViewports=true` lanes (the adapter
makes the channel lane-blind — assert with the existing contract-test pattern); no direct
`element.addEventListener` left under `Viewport/Overlays/`.*

### Phase 6 — Policies, consolidation, deprecation
Ship `installSyncStabilityPolicy` (opt-in per mode or `syncGroup.requiresStableGrid`); one-up and
HP stage snapshots move to `snapshot()/restore()` (deep-copied); remove the `setTimeout` event
deferral after auditing the event-order probe; deprecation warnings on no-selector
`useViewportGrid()`, `getViewportState`, and direct event subscription; extend
`check-next-viewport-boundaries.sh`-style linting: no new grid EVENTS, no `getState()` in render
paths, backends/adapters must not subscribe or broadcast.
*Acceptance: docs page for the four state kinds + selector catalog; deprecation warnings clean in
the shipped modes.*

Goal traceability: your bullet 1 → Phases 2+4a; bullet 2 → 2+4; bullet 3 → 5; bullet 4 → 3;
bullet 5 → 6.

---

## 7. What NOT to do (decisions, so they don't get re-litigated per PR)

1. No new PubSub events on ViewportGridService or CornerstoneViewportService from now on —
   additions go into store state or the runtime snapshot.
2. No continuous CS3D state (camera pose, per-frame anything) stored in any OHIF store.
   Revision + read-through only.
3. No pane-vs-viewport identity split; revisions carry reuse semantics.
4. No direct writes to the runtime slice from components — only the mount pipeline, the runtime
   channel, and `useViewportLifecycle` for custom viewports.
5. No `useContextSelector`/`React.memo` band-aids on the existing provider in the meantime — they
   would create a third way of doing things mid-migration.
6. No per-lane (legacy/native) event surfaces in backends or adapters, ever.
7. Don't "unify" the two dispatch strategies (session flag vs per-viewport predicate) as part of
   this work — the backends README is right that they are genuinely different axes.

---

## 8. Open questions (for team discussion, with my defaults)

1. **zustand vanilla in platform/core vs hand-rolled store.** Default: zustand vanilla (already in
   the bundle, devtools time-travel in dev is genuinely useful here). Hand-rolled only if core's
   zero-dep policy is absolute.
2. **Does `settled` include segmentation hydration and volume streaming by default?** Default:
   yes via work tokens, because "stable enough to sync" usually wants geometry, which needs the
   volume; policies that only need first-render use `rendered`.
3. **Deprecation horizon for the `[state, api]` tuple and the six events.** Default: warn in the
   release after Phase 6, remove two majors later — external extensions depend on both.
4. **Naming.** `useViewportState` vs `useViewportRuntime` for the CS3D-backed hook (default:
   `useViewportState`, and rename the grid accessor to `getViewportComposition` so the term is
   unambiguous); `ViewportHost` vs `ViewportSlot`.
5. **Multi-grid / multi-monitor.** The store-per-provider design enables independent grids per
   window; explicitly out of scope to build now.
