# Plan 006: Cancel superseded viewport data loads and guard the metadata-invalidated handler

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx`
> If the file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — the load effect participates in a deliberate re-render hack
  (`needsRerendering`); the cancellation guard must not change when
  `setViewportData` is called in the single-flight case.
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

`OHIFCornerstoneViewport` loads viewport data in a fire-and-forget async
effect with no cancellation. When `displaySets`/`viewportOptions` change in
quick succession (hanging-protocol stage changes, rapid series switching,
layout changes), two `createViewportData` calls race and **whichever resolves
last wins** — which is not necessarily the latest request, so a viewport can
end up rendering a superseded display set. Separately, the
`DISPLAY_SET_SERIES_METADATA_INVALIDATED` handler in the same file dereferences
`getViewportInfo(viewportId)` without a null guard (every other call site in
this file guards it), so an event arriving for a torn-down viewport throws a
`TypeError` mid-update.

## Current state

`extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx`:

- Lines 240-263 — the unguarded handler (note: `viewportInfo.hasDisplaySet` at
  line 250 with no null check):

```tsx
async ({ displaySetInstanceUID: invalidatedDisplaySetInstanceUID, invalidateData }) => {
  if (!invalidateData) { return; }
  const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
  if (viewportInfo.hasDisplaySet(invalidatedDisplaySetInstanceUID)) {
    const viewportData = viewportInfo.getViewportData();
    const newViewportData = await cornerstoneCacheService.invalidateViewportData(...);
    const keepCamera = true;
    cornerstoneViewportService.updateViewport(viewportId, newViewportData, keepCamera);
  }
}
```

- Lines 269-305 — the racy effect (abridged; note fire-and-forget call at 304
  and the intentional `needsRerendering` hack comment at 285-290):

```tsx
useEffect(() => {
  if (!viewportOptions.viewportType) { viewportOptions.viewportType = STACK; }
  const loadViewportData = async () => {
    const viewportData = await cornerstoneCacheService.createViewportData(
      displaySets, viewportOptions, dataSource, initialImageIndex
    );
    const presentations = getViewportPresentations(viewportId, viewportOptions);
    // Note: This is a hack to get the grid to re-render ... (needsRerendering)
    if (viewportOptions.needsRerendering) { viewportOptions.needsRerendering = false; }
    cornerstoneViewportService.setViewportData(
      viewportId, viewportData, viewportOptions, displaySetOptions, presentations
    );
  };
  loadViewportData();
}, [viewportOptions, displaySets, dataSource]);
```

- Guarded exemplars in the same file: line ~168 (`ELEMENT_ENABLED` handler)
  and lines ~206-210 both null-check the same service call before use.
- Repo conventions: pub-sub subscriptions cleaned up via returned unsubscribe
  in useEffect (this file already follows it); no emojis in logs.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Unit tests (package) | `cd extensions/cornerstone && pnpm run test:unit:ci` | exit 0 |
| E2E (targeted, requires test data + build; heavy) | `pnpm run test:data` then `pnpm exec playwright test tests/HangingProtocol*.spec.ts` with the dev server per `pnpm run test:e2e:serve` | pass |

If the Playwright environment is unavailable in your sandbox, note it in the
report and rely on unit tests + the manual recipe.

## Scope

**In scope**:
- `extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx`

**Out of scope** (do NOT touch):
- `CornerstoneViewportService` / `CornerstoneCacheService` internals — the fix
  is at the call site; adding cancellation tokens to the service API is a
  bigger design change (see Maintenance notes).
- The `needsRerendering` hack itself — preserve its behavior exactly.
- Every other subscription/effect in this file.

## Git workflow

- Branch: `advisor/006-viewport-load-race`
- Conventional commit, e.g. `fix(cornerstone): drop superseded viewport data loads and guard invalidation handler`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Null-guard the metadata-invalidated handler

After `const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);`
(line 248), add:

```tsx
if (!viewportInfo) {
  return;
}
```

Match the style of the guard at lines ~206-210.

**Verify**: `awk '/DISPLAY_SET_SERIES_METADATA_INVALIDATED/,/unsubscribe/' extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx | grep -c "if (!viewportInfo)"` → 1

### Step 2: Cancellation flag in the load effect

Use the standard stale-closure guard: a local `cancelled` flag set in the
effect cleanup, checked after every `await` and immediately before
`setViewportData`:

```tsx
useEffect(() => {
  if (!viewportOptions.viewportType) { viewportOptions.viewportType = STACK; }
  let cancelled = false;
  const loadViewportData = async () => {
    const viewportData = await cornerstoneCacheService.createViewportData(...);
    if (cancelled) { return; }
    ...
    cornerstoneViewportService.setViewportData(...);
  };
  loadViewportData();
  return () => { cancelled = true; };
}, [viewportOptions, displaySets, dataSource]);
```

Constraints:
- The `needsRerendering` reset must stay where it is relative to
  `setViewportData` but must NOT run when cancelled (move it after the
  `if (cancelled) return;`). Rationale: a superseded run must not consume the
  flag that the newest run's re-render depends on.
- Do not convert to AbortController — `createViewportData` doesn't accept a
  signal; the flag only prevents *applying* stale results (the wasted fetch is
  acceptable and out of scope).

**Verify**: `grep -n "cancelled" extensions/cornerstone/src/Viewport/OHIFCornerstoneViewport.tsx` shows: one `let cancelled = false`, one `cancelled = true` inside a cleanup return, and at least one `if (cancelled)` check between the `await` and `setViewportData`.

### Step 3: Run the package unit suite

**Verify**: `cd extensions/cornerstone && pnpm run test:unit:ci` → exit 0.

### Step 4 (conditional): Targeted E2E

If Playwright infra is available (test data submodule + serve), run the
hanging-protocol and layout-related specs, which exercise rapid viewport
data changes: `pnpm exec playwright test -g "HangingProtocol"` (and any spec
whose name matches `Layout`).

**Verify**: selected specs pass; otherwise record "e2e not run: <reason>" in
the report and plans/README notes.

## Test plan

This component has no unit-test harness today (it needs a full cornerstone
mock environment), and building one is explicitly out of scope. Testing is:
- the package unit suite (regressions in anything importing this file),
- the targeted Playwright specs (Step 4) when available,
- manual reviewer recipe: rapidly toggle between hanging-protocol stages /
  switch series in quick succession on a slow network profile (Chrome dev
  tools, "Slow 3G") — before the fix, the viewport can settle on the older
  series; after, it always settles on the last-selected one.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] Step 1 and Step 2 grep verifications pass
- [ ] `cd extensions/cornerstone && pnpm run test:unit:ci` exits 0
- [ ] Playwright targeted specs pass, or the skip reason is recorded
- [ ] `git status --porcelain` shows only `OHIFCornerstoneViewport.tsx` modified (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The effect body at lines 269-305 no longer matches the excerpt (drift — this
  file is actively developed).
- Any Playwright hanging-protocol spec that passed before your change fails
  after it (run the spec on a clean checkout first if in doubt).
- You find `setViewportData` is *intentionally* invoked for superseded data
  somewhere (e.g. a comment or test asserting last-write-wins) — report the
  contradiction.

## Maintenance notes

- The proper long-term fix is request-scoped cancellation inside
  `CornerstoneCacheService.createViewportData` (AbortSignal through to image
  loading) so superseded fetches stop consuming bandwidth; this plan only
  prevents stale *application*. Deferred deliberately.
- Reviewer should scrutinize: the `needsRerendering` flag ordering (see Step 2
  constraint) and that the cleanup doesn't cancel the *current* run on
  unrelated re-renders (deps array unchanged — same firing cadence as before).
- Related: plan 001 fixes the data-source-level stale cache; the two together
  cover the "stale data shown" class end to end.
