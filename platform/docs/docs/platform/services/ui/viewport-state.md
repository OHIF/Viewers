---
sidebar_position: 9
sidebar_label: Viewport State
title: Viewport State Architecture
summary: Guide to OHIF's viewport state architecture for extension developers, covering the four kinds of viewport state (layout, composition, runtime, stability), selector-based grid subscriptions with useViewportGrid, the CS3D-backed useViewportState hook, stability and work tokens, and the mount-intent contract for custom viewport authors.
---

# Viewport State

## Overview

The viewport grid is backed by a framework-agnostic store owned by the
`ViewportGridService`. Extensions read it through selectors instead of
subscribing to whole-state events, so a component re-renders only when the
slice it selected actually changed.

The word "viewport state" historically meant three unrelated things. The
architecture names four kinds and keeps them separate:

| Kind | What it is | Owner | Examples |
| --- | --- | --- | --- |
| **Layout** | Grid structure and pane geometry | grid store (`state.layout`) | `numRows`/`numCols`, pane `x`/`y`/`width`/`height`, `positionId`, `layoutRevision` |
| **Composition** | What a viewport *should* show | grid store (`state.viewports`) | `displaySetInstanceUIDs`, `viewportOptions`, `displaySetOptions`, `compositionRevision` |
| **Runtime** | What a viewport *is* showing right now | Cornerstone3D (read-through), plus a lifecycle mirror in the grid store (`state.runtime`) | slice index, VOI, view reference, phase (`mounting`/`mounted`/`rendered`/`settled`) |
| **Stability** | Aggregate derived state over runtime vs composition | grid store (`state.derived`) | "every viewport has rendered the composition it was asked to render" |

The layers are joined by `viewportId` plus revision counters: every
composition change bumps that viewport's `compositionRevision`, runtime
reports carry the revision they belong to, and stale reports are ignored by
the store.

## Reading grid state in React

`useViewportGrid` (from `@ohif/ui-next`) takes a selector over the grid store
state and re-renders only when the selected value changes. Named selectors are
exported as `gridSelectors`:

```tsx
import { useViewportGrid, gridSelectors } from '@ohif/ui-next';

// Re-renders only when the layout changes:
function LayoutIndicator() {
  const { numRows, numCols } = useViewportGrid(gridSelectors.selectLayout);
  return <span>{numRows}x{numCols}</span>;
}

// Re-renders only when THIS viewport's active-ness flips:
function PaneChrome({ viewportId }) {
  const isActive = useViewportGrid(gridSelectors.selectIsActive(viewportId));
  return <div className={isActive ? 'border-highlight' : 'border-input'} />;
}

// Re-renders only when ITS composition changes:
function MyViewportLogic({ viewportId }) {
  const composition = useViewportGrid(gridSelectors.selectViewport(viewportId));
  // composition is undefined until the viewport exists in the grid
  const displaySetUIDs = composition?.displaySetInstanceUIDs ?? [];
  // composition.compositionRevision is the remount/refetch key - no deep compares
}

// Inline selectors work too:
const activeViewportId = useViewportGrid(state => state.activeViewportId);
```

The selector receives the **store** state shape
(`layout` / `activeViewportId` / `viewports` / `runtime` / `derived`), not the
legacy state shape returned by `viewportGridService.getState()`.

Selectors that build a fresh object on every call need an equality function so
the component does not re-render on identical values. `shallowEqual` is
exported from both `@ohif/core` and via `gridSelectors`:

```tsx
import { useViewportGrid, gridSelectors } from '@ohif/ui-next';

function StudyLoadBadge() {
  const { isStable, pending } = useViewportGrid(
    gridSelectors.selectStability('settled'),
    gridSelectors.shallowEqual
  );
  return isStable ? <Check /> : <Spinner label={`${pending.length} viewports loading`} />;
}
```

The available named selectors:

| Selector | Returns |
| --- | --- |
| `selectLayout` | `{ layoutType, numRows, numCols, panes, layoutRevision }` |
| `selectActiveViewportId` | the active viewport id (or `null`) |
| `selectViewport(viewportId)` | the viewport's composition (or `undefined`) |
| `selectIsActive(viewportId)` | `boolean` |
| `selectStability(level)` | `{ isStable, epoch, pending }` for `'mounted'`, `'rendered'` or `'settled'` (use with `shallowEqual`) |

### Actions without subscriptions

`useViewportGridApi` returns the referentially stable actions object
(`setLayout`, `setDisplaySetsForViewports`, `setActiveViewportId`, `getState`,
...). It never causes a re-render on grid changes and is safe to put in
effect/callback dependency arrays:

```tsx
import { useViewportGridApi } from '@ohif/ui-next';

function OneUpButton({ viewportId }) {
  const viewportGridApi = useViewportGridApi();
  return <Button onClick={() => viewportGridApi.setActiveViewportId(viewportId)} />;
}
```

Calling `useViewportGrid()` with no arguments still returns the legacy
`[state, api]` tuple, re-rendering on every grid change. It is deprecated;
prefer the selector overload plus `useViewportGridApi`.

## Reading grid state outside React

Non-React code (services, coordinators, commands) uses
`viewportGridService.select(selector, listener, options?)`; it returns an
unsubscribe function and the listener fires only when the selected value
changes:

```ts
const unsubscribe = viewportGridService.select(
  state => state.activeViewportId,
  activeViewportId => studyPrefetcherService.reprioritize(activeViewportId)
);
```

Two things to know:

- Listeners run **synchronously inside the writing store transaction**, so
  they observe state earlier than the deferred legacy events
  (`GRID_STATE_CHANGED` etc.) did. A consumer that needs the old macrotask
  timing must defer its own body.
- Pass `{ equality: shallowEqual }` (or your own comparator) when the selector
  builds a fresh object, and `{ fireImmediately: true }` to receive the current
  value on subscribe.

For one-off reads, `viewportGridService.getViewportComposition(viewportId)`
returns the composition (including `compositionRevision`);
`getViewportState(viewportId)` is deprecated in its favor and returns the
legacy-shaped entry.

## Reading live viewport state (CS3D-backed)

Continuous rendering state (slice position, VOI, camera, colormap) is never
copied into OHIF state. Each mounted cornerstone viewport has a runtime
channel that bumps a revision on the relevant cornerstone events and computes
a snapshot lazily as a read-through over the live viewport:

```ts
type ViewportRuntimeSnapshot = {
  revision: number;
  phase: 'detached' | 'mounting' | 'mounted' | 'rendered' | 'settled' | 'error';
  shape: ViewportShape;
  displaySetInstanceUIDs: string[];
  viewReference?: Types.ViewReference;
  viewState?: ViewportViewState;
  presentation?: ViewportPresentation; // VOI / colormap / invert
  sliceIndex?: number;
  numSlices?: number;
};
```

In React, use `useViewportState` (from `@ohif/extension-cornerstone`) with a
selector; overlays no longer wire their own `element.addEventListener` calls:

```tsx
import { useViewportState } from '@ohif/extension-cornerstone';
import { shallowEqual } from '@ohif/core';

// Slice indicator - updates on scroll, nothing else
function SliceIndicator({ viewportId }) {
  const { sliceIndex, numSlices } = useViewportState(
    viewportId,
    s => ({ sliceIndex: s.sliceIndex, numSlices: s.numSlices }),
    shallowEqual
  );
  return <span>{sliceIndex + 1}/{numSlices}</span>;
}

// Window-level readout - updates on VOI changes only, no element listeners
function WindowLevelLabel({ viewportId }) {
  const voiRange = useViewportState(viewportId, s => s.presentation?.voiRange);
  return voiRange ? <span>{formatWindowLevel(voiRange)}</span> : null;
}
```

Without a selector, `useViewportState(viewportId)` returns the whole snapshot
and re-renders on every runtime revision.

Imperative code reads the same snapshot from the service:

```ts
const snapshot = cornerstoneViewportService.getViewportRuntime(viewportId);
if (snapshot.phase === 'rendered' && snapshot.shape === 'volume') {
  // safe to operate on the rendered volume
}
const unsubscribe = cornerstoneViewportService.subscribeViewportRuntime(viewportId, () => {
  // a runtime revision was bumped; re-read getViewportRuntime(viewportId)
});
```

The snapshot vocabulary is the native cornerstone one
(`viewReference`/`viewState`), served identically for the legacy and next
viewport lanes because the viewport adapter is the read layer.

## Stability and work tokens

Each content viewport reports lifecycle phases relative to its current
`compositionRevision`:

- `mounted` - element enabled and data bound
- `rendered` - first `IMAGE_RENDERED` for that revision
- `settled` - rendered and `pendingWork === 0`

The store aggregates them into `state.derived`
(`allMounted` / `allRendered` / `allSettled`, plus `pendingViewportIds` and an
`epoch` that bumps on every layout/composition transaction). Runtime reports
for a stale revision are inert, so late events from a superseded mount can
never mark new content ready.

`pendingWork` counts **work tokens**: asynchronous work that should keep a
viewport out of `settled` even after its first render. The mount pipeline
holds one automatically while bound volumes are still streaming. Extensions
can hold their own:

```ts
viewportGridService.beginWork(viewportId, 'my-extension:overlay-fetch');
try {
  await loadOverlayData();
} finally {
  viewportGridService.endWork(viewportId, 'my-extension:overlay-fetch');
}
```

Tokens are idempotent per (viewportId, token) and are cleared automatically
when the viewport's composition changes.

Cornerstone viewports never report phases themselves - the mount pipeline and
the runtime channel report for them. A custom (non-cornerstone) viewport
reports through the grid service against its current revision:

```ts
const composition = viewportGridService.getViewportComposition(viewportId);
viewportGridService.reportPhase(viewportId, 'rendered', composition.compositionRevision);
```

(or via the compatibility shim
`viewportGridService.setViewportIsReady(viewportId, true)`, which reports
`mounted` for the current revision).

### The sync stability policy (opt-in)

The flagship stability consumer suspends all synchronizers while any content
viewport has not yet rendered its current composition, and resumes them once
every viewport has (no timers, no pane counting). It is off by default and
opted into either via app config:

```js
// appConfig
useSyncStabilityPolicy: true,
```

or per-session via the URL: `?useSyncStabilityPolicy=true` (also `?useSyncStabilityPolicy`
or `=1`). The URL parameter takes precedence over the config value when
present.

The policy itself is a one-subscription mirror over
`selectStability('rendered')` - see
`extensions/cornerstone/src/utils/syncStabilityPolicy.ts` for the pattern to
copy when writing your own stability-gated policy.

## Mount intents (custom viewport authors)

Data mounting is orchestrated outside React by a mount controller inside
`cornerstoneViewportService`. On every render, `OHIFCornerstoneViewport`
publishes a *mount intent* - the `displaySets`, `viewportOptions`,
`displaySetOptions`, `dataSource` and `compositionRevision` it received as
props - via `cornerstoneViewportService.setViewportMountIntent`. The
controller compares intents and re-runs the mount pipeline only when the
intent actually changed, superseding any in-flight mount for that viewport.

What this means for viewport authors:

- **Wrappers just pass transformed props.** SEG/SR/RT/PMAP/tracked viewports
  render `OHIFCornerstoneViewport` with transformed inputs (for example the
  referenced series display set instead of the SEG the grid composition
  names). The intent is published from the received props automatically inside
  `OHIFCornerstoneViewport`; wrappers do not call `setViewportMountIntent`
  and must not read the raw grid composition as the mount input.
- **`needsRerendering` is gone.** Neither the `React.memo` `areEqual`
  comparator nor the `needsRerendering` viewport option exist anymore (the
  option is kept as a deprecated no-op field for config compatibility). To
  force a re-mount - for example after segmentation hydration - bump the
  composition:

  ```ts
  viewportGridService.bumpComposition(viewportId, 'segmentation-hydrated');
  ```

  The bumped `compositionRevision` flows into the next published intent, the
  comparison fails, and the viewport re-mounts.

## Migration table

| Old pattern | New pattern |
| --- | --- |
| `const [gridState, api] = useViewportGrid()` to read one field | `useViewportGrid(selector)` for the field + `useViewportGridApi()` for actions |
| Subscribing to `GRID_STATE_CHANGED` / `ACTIVE_VIEWPORT_ID_CHANGED` events | `viewportGridService.select(selector, listener)` |
| `element.addEventListener` in overlays (`STACK_NEW_IMAGE`, `VOI_MODIFIED`, `CAMERA_MODIFIED`, ...) | `useViewportState(viewportId, selector, equality?)` |
| `viewportOptions.needsRerendering` / `React.memo(areEqual)` | `viewportGridService.bumpComposition(viewportId, reason)` |
| Polling `getGridViewportsReady()` / counting panes for readiness | `useViewportGrid(gridSelectors.selectStability('mounted'), gridSelectors.shallowEqual)` or `select(selectStability(...), ...)` |
| `viewportGridService.getViewportState(viewportId)` | `viewportGridService.getViewportComposition(viewportId)` |

The full service method surface (`setLayout`, `setDisplaySetsForViewports`,
`setActiveViewportId`, `getState`, the hanging protocol flow) and the existing
grid events are unchanged; the events are the deprecated bridge and new code
should subscribe through selectors.
