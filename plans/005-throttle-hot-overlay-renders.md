# Plan 005: Stop per-frame re-renders in ViewportOrientationMarkers and useMeasurements

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- extensions/cornerstone/src/Viewport/Overlays/ViewportOrientationMarkers.tsx extensions/cornerstone/src/hooks/useMeasurements.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW — both changes are guard/memoization-shaped; behavior on
  actual orientation/measurement changes must be identical.
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

Two hot paths do avoidable per-event React work:

1. `ViewportOrientationMarkers` sets state with `Date.now()` on **every**
   `CAMERA_MODIFIED` event. That event fires at animation-frame rate during
   any pan/zoom/scroll drag, so each visible viewport re-renders the component
   and re-runs a `useMemo` that does `metaData.get` + orientation-cosine math
   ~60 times per second — multiplied across a 2x2+ grid. Orientation markers
   only change when the camera's *orientation* changes (rotation/flip), not on
   pan or zoom.
2. `useMeasurements` detects changes by `JSON.stringify`-ing the **entire**
   mapped measurement collection twice per debounced tick — O(n·size) work
   that runs continuously while a user drags a measurement handle. Its effect
   also depends on `measurementFilter`, whose default is a fresh arrow function
   per call, so default-arg callers resubscribe to 5 measurement events every
   render.

## Current state

- `extensions/cornerstone/src/Viewport/Overlays/ViewportOrientationMarkers.tsx`
  lines 19-30:

```tsx
const [cameraModifiedTime, setCameraModifiedTime] = useState(0);
...
useEffect(() => {
  const cameraModifiedListener = () => setCameraModifiedTime(Date.now());
  element.addEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedListener);
  return () => {
    element.removeEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedListener);
  };
}, [element]);

const markers = useMemo(() => {
  if (!viewportData || cameraModifiedTime === 0) { return ''; }
  ...
}, [...deps include cameraModifiedTime...]);
```

- The repo's own exemplar of the correct pattern —
  `extensions/cornerstone/src/Viewport/Overlays/CustomizableViewportOverlay.tsx`
  lines 129-147 guards its setState on an actual camera delta:

```tsx
const updateScale = eventDetail => {
  const { previousCamera, camera } = eventDetail.detail;
  if (
    previousCamera.parallelScale !== camera.parallelScale ||
    previousCamera.scale !== camera.scale
  ) {
    ...setScale(scale);
  }
};
```

- `extensions/cornerstone/src/hooks/useMeasurements.ts` lines 62-101:

```ts
export function useMeasurements({ measurementFilter } = { measurementFilter: () => true }) {
  ...
  setDisplayMeasurements(prevMeasurements => {
    if (JSON.stringify(prevMeasurements) !== JSON.stringify(mappedMeasurements)) {
      return mappedMeasurements;
    }
    return prevMeasurements;
  });
  ...
  }, [measurementService, measurementFilter, displaySetService]);
```

- Cornerstone3D `CAMERA_MODIFIED` event detail carries `previousCamera` and
  `camera`, each with `viewUp` (vec3), `viewPlaneNormal` (vec3),
  `parallelScale`, `scale`, `position`, `focalPoint` — the orientation markers
  depend only on `viewUp` and `viewPlaneNormal`.
- Repo convention: no emojis in log strings. Tests use Jest + babel-jest per
  `jest.config.base.js`; hooks are not currently tested in this extension, but
  `extensions/cornerstone/src/utils/*.test.ts` shows the unit style, and
  `extensions/cornerstone/src/services/SegmentationService/SegmentationService.test.ts`
  shows how services/events are mocked at scale.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Unit tests (this package) | `cd extensions/cornerstone && pnpm run test:unit:ci` | exit 0 |
| Dev server (manual check, optional) | `pnpm run dev:fast` (root) | serves on :3000 |

## Scope

**In scope**:
- `extensions/cornerstone/src/Viewport/Overlays/ViewportOrientationMarkers.tsx`
- `extensions/cornerstone/src/hooks/useMeasurements.ts`
- `extensions/cornerstone/src/hooks/useMeasurements.test.ts` (create)

**Out of scope** (do NOT touch):
- `CustomizableViewportOverlay.tsx` — it is the exemplar, already correct.
- `MeasurementService` itself; the mapping function `mapMeasurementToDisplay`'s
  output shape (panel code depends on it).
- Any change from `lodash.debounce` to another debounce — dependency
  consolidation is plan 017.

## Git workflow

- Branch: `advisor/005-hot-overlay-renders`
- Conventional commits, e.g. `perf(cornerstone): only re-render orientation markers on orientation change`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Guard the orientation-markers listener on an orientation delta

In `ViewportOrientationMarkers.tsx`, change the listener to compare
`previousCamera.viewUp`/`viewPlaneNormal` against `camera.viewUp`/
`viewPlaneNormal` (element-wise; a small epsilon like `1e-6` or exact
inequality both acceptable — match the exemplar's exact-compare style) and
call `setCameraModifiedTime(Date.now())` only when either vector changed, or
when it is the first event (`cameraModifiedTime === 0` — the memo returns ''
until the first event, so the first event must always pass; easiest is a
`useRef(false)` "seen first event" flag rather than reading state in the
listener).

Keep the effect's add/removeEventListener structure and deps unchanged.

**Verify**: `cd extensions/cornerstone && pnpm run test:unit:ci` → exit 0 (no
regressions). `grep -n "viewPlaneNormal" src/Viewport/Overlays/ViewportOrientationMarkers.tsx` → ≥ 1 match.

### Step 2: Single-serialization change detection + stable default filter in useMeasurements

1. Hoist the default filter to module level:

```ts
const DEFAULT_MEASUREMENT_FILTER = () => true;
export function useMeasurements({ measurementFilter = DEFAULT_MEASUREMENT_FILTER } = {}) {
```

2. Replace the double-stringify with a ref-cached serialization (stringify the
   new collection once; compare against the cached string of the current
   state; never re-serialize the previous value):

```ts
const serializedRef = useRef('');
...
const next = JSON.stringify(mappedMeasurements);
if (next !== serializedRef.current) {
  serializedRef.current = next;
  setDisplayMeasurements(mappedMeasurements);
}
```

   (Call this inside `updateDisplayMeasurements` instead of the functional
   setState; the debounce already coalesces bursts.) Do NOT switch to
   uid/timestamp comparison in this plan — it changes correctness semantics if
   any mutation fails to bump a timestamp; see Maintenance notes.

**Verify**: `grep -c "JSON.stringify" extensions/cornerstone/src/hooks/useMeasurements.ts` → 1.

### Step 3: Unit-test the hook

Create `extensions/cornerstone/src/hooks/useMeasurements.test.ts`. Mock
`useSystem` (from `@ohif/core`) to supply a fake `measurementService`
(`getMeasurements`, `subscribe` returning `{ unsubscribe }`, `EVENTS` object)
and `displaySetService` (`getDisplaySetsForSeries` returning
`[{ instances: [{}] }]`). Use `@testing-library/react`'s `renderHook` if it is
already a dependency; if it is NOT installed anywhere in the workspace, test
the extracted pure parts instead (export `mapMeasurementToDisplay` for testing
and assert its mapping; assert the module-level default filter is referentially
stable across two imports) — do not add new dependencies for this plan.

Cases:
1. Identical measurement payload delivered twice → state object is
   referentially unchanged (or serialization performed once per update — assert
   via a `JSON.stringify` spy called at most once per tick).
2. Changed payload → new state.
3. Unmount → every subscription's `unsubscribe` called and debounce cancelled.

**Verify**: `cd extensions/cornerstone && pnpm run test:unit:ci` → exit 0, new tests included.

## Test plan

- New: `useMeasurements.test.ts` as Step 3 (cases listed there).
- Existing: full `extensions/cornerstone` unit suite must stay green.
- Manual recipe for the reviewer (do NOT self-verify rendering—hand this to a
  human): open any MPR study, drag-pan continuously in one viewport with React
  DevTools profiler recording; before the fix `ViewportOrientationMarkers`
  commits every frame; after, zero commits during pure pan/zoom, and markers
  still flip correctly when rotating an MPR view or scrolling into a new
  orientation.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `cd extensions/cornerstone && pnpm run test:unit:ci` exits 0 with the new test file
- [ ] `grep -c "JSON.stringify" extensions/cornerstone/src/hooks/useMeasurements.ts` → 1
- [ ] `grep -n "measurementFilter = DEFAULT_MEASUREMENT_FILTER" extensions/cornerstone/src/hooks/useMeasurements.ts` → 1 match
- [ ] `ViewportOrientationMarkers.tsx` listener references `previousCamera` (grep) and no unconditional `setCameraModifiedTime(Date.now())` remains
- [ ] `git status --porcelain` touches only in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `CAMERA_MODIFIED` event detail in the installed cornerstone version does
  not carry `previousCamera` (check
  `node_modules/@cornerstonejs/core/dist/esm/types/EventTypes.d.ts` or
  equivalent) — the guard needs a different signal; report instead of caching
  vectors yourself.
- `renderHook` tooling is absent AND `mapMeasurementToDisplay` cannot be
  exported without breaking its error-throwing contract for panel callers.
- Any existing test fails after Step 1 in a way that suggests something relies
  on per-frame marker updates.

## Maintenance notes

- Follow-up (deferred): replace the single `JSON.stringify` with
  uid+`modifiedTimestamp` comparison once someone confirms every measurement
  mutation path bumps `modifiedTimestamp`; that makes the diff O(n) instead of
  O(total payload).
- If orientation markers ever need to react to zoom (e.g. font scaling), the
  guard must widen — reviewer should confirm markers depend only on
  `viewUp`/`viewPlaneNormal` today.
- Reviewer should scrutinize: the first-event flag (markers must still appear
  on initial mount after the first camera event).
