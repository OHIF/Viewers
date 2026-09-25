# Plan 013: Characterization tests for commandsModule and CornerstoneViewportService

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- extensions/cornerstone/src/commandsModule.ts extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts`
> These are the repo's highest-churn files — drift is LIKELY. Characterization
> tests pin CURRENT behavior, so drift does not invalidate the plan; just
> characterize what is there now. Only treat structural removal of the target
> functions as a STOP.

## Status

- **Priority**: P3
- **Effort**: L (multi-day)
- **Risk**: LOW — additive tests; the risk is wasted effort on brittle mocks,
  controlled by the seam-selection rules below.
- **Depends on**: none (but lands best after 002 so `typecheck` exists)
- **Category**: tests
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

The two most-edited files in the busiest extension have zero unit tests:

- `extensions/cornerstone/src/commandsModule.ts` — 2878 lines, ~31 commits in
  12 months; the central command registry for viewport actions (windowing,
  tool activation, navigation, sync, segmentation commands). Every change is
  verified only by slow WebGL-dependent E2E or by hand.
- `extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts`
  — 1622 lines, ~18 commits/yr; owns viewport lifecycle and display-set →
  viewport wiring.

High churn + zero coverage is the repo's top regression-risk combination.
Characterization tests (pin what the code DOES today, right or wrong) create
the safety net that any future refactor — including the eventual split of the
2878-line file — requires. The repo already proves this is feasible at scale:
`SegmentationService.test.ts` (~3000 lines) unit-tests a sibling service with
cornerstone mocked.

## Current state

- `extensions/cornerstone/src/commandsModule.ts` — exports a function
  (`commandsModule({ servicesManager, commandsManager, ... })`) returning
  `{ actions, definitions, defaultContext }` where `definitions` maps command
  names to `{ commandFn, ... }`. Commands read services via
  `servicesManager.services` and cornerstone via `@cornerstonejs/core` /
  `@cornerstonejs/tools` imports.
- `extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts`
  — class extending the pub-sub base; key seams: viewport-info bookkeeping
  (`getViewportInfo`, per-viewport state maps), display-set → viewport-data
  mapping helpers, presentation handling. GPU/rendering-engine calls are the
  hard boundary to mock.
- The proven mocking pattern:
  `extensions/cornerstone/src/services/SegmentationService/SegmentationService.test.ts`
  — read its first ~150 lines before writing anything: how it uses
  `jest.mock('@cornerstonejs/core', ...)` / `jest.mock('@cornerstonejs/tools', ...)`,
  how it fakes `servicesManager`, and how events are asserted.
- Jest config: `extensions/cornerstone/jest.config.js` → root
  `jest.config.base.js` (jsdom; `@cornerstonejs/*` mapped to `dist/esm` via
  moduleNameMapper; babel-jest transforms everything —
  `transformIgnorePatterns: []`).
- Test command: `cd extensions/cornerstone && pnpm run test:unit:ci`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Package tests | `cd extensions/cornerstone && pnpm run test:unit:ci` | exit 0 |
| Focused | `cd extensions/cornerstone && pnpm exec jest src/commandsModule --ci` | exit 0 |

## Scope

**In scope**:
- `extensions/cornerstone/src/commandsModule.test.ts` (create)
- `extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.test.ts` (create)
- Test-support fixtures under `extensions/cornerstone/src/__fixtures__/` if
  shared fakes help (optional)

**Out of scope** (do NOT touch):
- ANY change to the two source files. Characterization means: if behavior
  looks wrong, pin it anyway with a `// NOTE: current behavior, possibly a
  bug:` comment and list it in the report. (Exception: none. Zero source
  edits.)
- Splitting `commandsModule.ts` — that is the *follow-up* this plan enables,
  not this plan.
- E2E tests.

## Git workflow

- Branch: `advisor/013-characterization-tests`
- Commit per milestone (e.g. after each describe-block group lands green)
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Absorb the proven mocking pattern

Read `SegmentationService.test.ts` (at minimum: its jest.mock setup, fake
servicesManager construction, and 2-3 representative test cases). Extract the
reusable parts mentally — do not refactor that file.

**Verify**: you can state (in the report) which cornerstone modules it mocks
and how services are faked.

### Step 2: Seam selection for commandsModule (aim: 12-20 commands)

Read `commandsModule.ts`'s `definitions` map and classify every command:
- **A — testable now**: reads services + calls cornerstone APIs that are
  cheap to fake (get/set properties, service method calls, event broadcasts).
- **B — thin wrapper**: one-line delegation to another module (test = assert
  delegation args).
- **C — GPU/DOM-bound**: needs enabled elements/rendering engine behavior —
  SKIP, list in report.

Deliverable in the test file: a header comment listing the A/B/C
classification (this doubles as the module's first behavioral inventory).

**Verify**: classification comment exists; count(A)+count(B) ≥ 12.

### Step 3: commandsModule.test.ts

For each class-A/B command, at least one test: build the module with a fake
`servicesManager` (stub exactly the services the command touches — read the
command body first), invoke `definitions.<name>.commandFn` via the returned
structure (or `actions.<name>` where that's the convention in the file), and
assert the observable effect: service method called with expected args,
cornerstone setter called, event broadcast, or returned value. Priority
commands (audit-flagged as highest value — include all that classify A/B):
window-level/VOI presets, tool activation/deactivation, viewport
navigation/scroll/jump-to-measurement, orientation/rotation/flip, sync
toggles, capture/download-image if class B.

Use fake IDs like `'viewport-1'`, `'display-set-uid-1'`. No emojis in any
strings.

**Verify**: `pnpm exec jest src/commandsModule --ci` → exit 0, ≥ 12 passing tests.

### Step 4: CornerstoneViewportService.test.ts (aim: 8-12 tests)

Target the decidable seams only:
1. Service construction + `EVENTS` shape.
2. Viewport-info bookkeeping: after the public registration path used by the
   app (find the method the viewport component calls — e.g.
   `enableViewport`/`storeViewportData`-adjacent, read the class first),
   `getViewportInfo(viewportId)` returns the stored info; unknown id →
   undefined (this pins the null-contract that plan 006 guards against).
3. Display-set/presentation mapping helpers that take plain data and return
   plain data (identify 3-5 by reading the class; they exist around
   viewport-data construction).
4. Destroy/cleanup: subscriptions/maps cleared (mirror how
   SegmentationService.test.ts asserts teardown).
Mock the rendering engine with a minimal object recording calls
(`{ enableElement: jest.fn(), getViewport: jest.fn(() => fakeViewport), ... }`)
— shape it after whatever the class actually calls (read first).

**Verify**: `pnpm exec jest src/services/ViewportService --ci` → exit 0, ≥ 8 passing tests.

### Step 5: Full package suite + report

Run the whole package suite. Write the report section in `plans/README.md`
notes: tests added per file, class-C command list (untestable-without-GPU),
and any `// NOTE: current behavior, possibly a bug:` pins (these feed future
bug plans).

**Verify**: `cd extensions/cornerstone && pnpm run test:unit:ci` → exit 0.

## Test plan

This plan IS a test plan; the structural pattern is
`SegmentationService.test.ts`. Anti-goals: no snapshot tests, no asserting on
mock-call *counts* where args suffice, no testing cornerstone itself.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `commandsModule.test.ts` ≥ 12 passing tests + A/B/C classification comment
- [ ] `CornerstoneViewportService.test.ts` ≥ 8 passing tests
- [ ] `cd extensions/cornerstone && pnpm run test:unit:ci` exits 0
- [ ] `git diff --stat` shows zero changes to the two source files
- [ ] Possibly-a-bug pins listed in `plans/README.md` notes (or "none")
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Fewer than 12 commands classify as A/B (the module is more GPU-bound than
  the audit judged) — deliver the classification + whatever tests exist and
  report the real ratio.
- The jest environment cannot load `commandsModule.ts`'s import graph under
  jsdom after two attempts at targeted `jest.mock`s — report the failing
  import chain. Do NOT add broad manual mocks of `@cornerstonejs/*` beyond the
  patterns SegmentationService.test.ts already uses.
- Either target file has been split/renamed since `973631b7e` — re-scope
  against the new layout only if the mapping is obvious; otherwise report.

## Maintenance notes

- This unlocks the deferred refactor: splitting `commandsModule.ts` into
  `commands/*.ts` by domain with a stable registration surface. Do that only
  after these tests are green in CI.
- The class-C list is the honest boundary of unit-testability; shrinking it
  requires a cornerstone fake-rendering-engine harness — a separate
  infrastructure investment.
- Reviewer should scrutinize: tests that merely mirror the implementation
  (mock-in, same-mock-out) — each test should assert something a refactor
  could plausibly break.
