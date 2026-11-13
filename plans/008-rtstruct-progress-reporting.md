# Plan 008: Report real RTSTRUCT segment-loading progress instead of a constant

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts`
> If the file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW — telemetry/progress path only; no rendering logic changes.
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

While loading RT structure sets, `SegmentationService` broadcasts
`SEGMENT_LOADING_COMPLETE` progress computed as
`Object.keys(segmentsCachedStats).length / allRTStructData.length`. But
`segmentsCachedStats` is reassigned every iteration to a fresh object with
exactly two keys (`center`, `modifiedTime`), so the numerator is always `2`:
a 40-structure RTSTRUCT reports a fixed 5% forever. Any progress UI bound to
this event is wrong for the entire load.

## Current state

`extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts`,
inside the loop over `allRTStructData` (excerpt, lines 705-732):

```ts
const contourSet = geometry.data as csTypes.IContourSet;
const centroid = contourSet.centroid;

segmentsCachedStats = {
  center: { world: centroid },
  modifiedTime: rtDisplaySet.SeriesDate, // Using SeriesDate as modifiedTime
};

segments[segmentIndex] = {
  label: id,
  segmentIndex,
  cachedStats: segmentsCachedStats,
  locked: false,
  active: false,
  group,
};

// Broadcast segment loading progress
const numInitialized = Object.keys(segmentsCachedStats).length;   // <-- always 2
const percentComplete = Math.round((numInitialized / allRTStructData.length) * 100);
this._broadcastEvent(EVENTS.SEGMENT_LOADING_COMPLETE, {
  percentComplete,
  numSegments: allRTStructData.length,
});
} catch (e) {
  console.warn(`Error initializing contour for segment ${segmentIndex}:`, e);
  continue; // Continue processing other segments even if one fails
}
```

Note the `catch { continue }` — failed segments are skipped, so a plain loop
index would over-count; count *successful* iterations.

This file has a substantial existing test:
`extensions/cornerstone/src/services/SegmentationService/SegmentationService.test.ts`
— use its mocking setup as the pattern if you add a test (see Test plan for
the decision rule).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Unit tests (package) | `cd extensions/cornerstone && pnpm run test:unit:ci` | exit 0 |

## Scope

**In scope**:
- `extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts`
  (the RTSTRUCT loading loop only)
- `SegmentationService.test.ts` (optionally, per Test plan)

**Out of scope** (do NOT touch):
- The analogous SEG/labelmap loading paths elsewhere in this file — verify
  whether they share the bug (see Step 2) but do not modify them in this plan
  unless the identical two-line pattern is present; report otherwise.
- Event names/payload shape (`percentComplete`, `numSegments`) — consumers
  depend on them.

## Git workflow

- Branch: `advisor/008-rtstruct-progress`
- Conventional commit, e.g. `fix(cornerstone): report actual RTSTRUCT segment loading progress`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Count successfully processed segments

Introduce a counter declared immediately before the loop over
`allRTStructData` (find the `for` statement enclosing the excerpt):

```ts
let numProcessedSegments = 0;
```

Inside the `try`, after the `segments[segmentIndex] = {...}` assignment and
before the broadcast, increment it, and use it as the numerator:

```ts
numProcessedSegments++;
const percentComplete = Math.round((numProcessedSegments / allRTStructData.length) * 100);
```

Delete the `const numInitialized = Object.keys(segmentsCachedStats).length;`
line. Do not touch `segmentsCachedStats` itself (its per-segment value is
stored into `segments[segmentIndex].cachedStats` and is correct for that use).

**Verify**: `grep -n "Object.keys(segmentsCachedStats).length" extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts` → no matches; `grep -c "numProcessedSegments" <same file>` → ≥ 2.

### Step 2: Check the sibling loading paths for the same arithmetic

`grep -n "percentComplete" extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts`
and inspect each hit. If another path computes progress from
`Object.keys(<per-item object>).length`, do NOT fix it here — record the
file:line in your final report and in `plans/README.md` notes.

**Verify**: report lists every `percentComplete` site with verdict (correct /
same-bug / n-a).

### Step 3: Tests

Run the existing suite. If `SegmentationService.test.ts` already exercises the
RTSTRUCT load path (search it for `SEGMENT_LOADING_COMPLETE` or `RTSTRUCT`),
extend it with an assertion that consecutive broadcasts have strictly
increasing `percentComplete` reaching 100 for a 3-segment fixture. If the test
file has no RTSTRUCT harness, skip writing one (standing up geometry-loader
mocks is disproportionate for this fix) and say so in the report.

**Verify**: `cd extensions/cornerstone && pnpm run test:unit:ci` → exit 0.

## Test plan

Per Step 3: extend the existing test only if the harness already reaches this
code path; otherwise the grep-based done criteria plus the package suite are
the gate.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "Object.keys(segmentsCachedStats).length" .../SegmentationService.ts` → 0
- [ ] `cd extensions/cornerstone && pnpm run test:unit:ci` exits 0
- [ ] Step 2 verdict list present in the final report
- [ ] `git status --porcelain` shows only in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpt doesn't match (drift).
- The enclosing loop structure isn't a per-segment `try/catch { continue }` —
  the counting strategy assumes it.
- Consumers are found that depend on the buggy constant (unlikely; check by
  `grep -rn "SEGMENT_LOADING_COMPLETE" platform extensions` and reading the
  handlers) — report instead of changing them.

## Maintenance notes

- If segment loading is ever parallelized, the counter must become an atomic
  increment inside the resolved callback, not a loop variable.
- Reviewer should scrutinize: increment placement relative to the `catch`
  (failed segments must not count).
