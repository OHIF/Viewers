# Plan 011: Unit-test the DICOMweb data source's query and metadata plumbing

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- extensions/default/src/DicomWebDataSource`
> If in-scope files changed since this plan was written, compare the "Current
> state" facts against the live code before proceeding; on a mismatch, treat
> it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW — test-only changes; any source change is out of scope except
  export-for-testing tweaks explicitly allowed below.
- **Depends on**: 001 (lands tests in the same directory; execute 001 first to
  avoid conflicts in `retrieveStudyMetadata.js`/tests)
- **Category**: tests
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

`extensions/default/src/DicomWebDataSource/` is the primary data ingress for
every OHIF deployment — QIDO study/series search, WADO metadata retrieval,
auth-header and URL assembly. It is ~26KB of orchestration in `index.ts` plus
`qido.js` and `retrieveStudyMetadata.js`, and the directory's only test is
`retrieveRendered.test.ts` (a small helper). A subtle change to query-param
mapping or metadata normalization ships completely unguarded today. This plan
adds unit coverage to the pure/decidable seams — request shapes in, mapped
structures out — with the DICOMweb client mocked.

## Current state

- `extensions/default/src/DicomWebDataSource/index.ts` —
  `createDicomWebApi(dicomWebConfig, servicesManager)` (line 132) builds the
  API object. Notable internals: `getAuthorizationHeader` (line 156),
  `generateWadoHeader` (line 170), `query.studies.search` (line 225, calls
  `mapParams(...)`), `query.series.search` (line 241),
  `query.instances.search` (line 250), `retrieve.bulkDataURI` (line 311),
  `store.dicom` (line 359), `storeInstances` (line 542),
  `getImageIdsForDisplaySet` (line 616), `getImageIdsForInstance` (line 643).
  Most functions close over `dicomWebConfig` and module-scoped clients —
  functions here are tested through `createDicomWebApi` with mocked deps, not
  imported individually.
- `extensions/default/src/DicomWebDataSource/qido.js` — QIDO helpers; imports
  `DICOMWeb` utils (`getString`, `getName`, `getModalities`) from
  `@ohif/core`. Contains the param-mapping and result-processing functions
  (read its exports first — `mapParams`, `processResults`/`processSeriesResults`
  or similar).
- `extensions/default/src/DicomWebDataSource/retrieveRendered.test.ts` — the
  structural pattern to copy: plain Jest, `global.fetch = jest.fn()` in
  `beforeEach`, restore in `afterEach`, one behavior per `it`.
- Jest per-package: `cd extensions/default && pnpm run test:unit:ci`
  (`jest --ci --runInBand --collectCoverage --passWithNoTests`), config
  extends `../../jest.config.base.js` (jsdom, babel-jest, testMatch
  `src/**/*.test.(js|ts)`).
- The heavy external dep is `@ohif/core`'s `dicomweb-client` wrapper —
  `index.ts` instantiates clients from `dicomweb-client` (check the import at
  the top of `index.ts`); mock at module boundary with `jest.mock`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Unit tests (package) | `cd extensions/default && pnpm run test:unit:ci` | exit 0 |
| Focused run | `cd extensions/default && pnpm exec jest src/DicomWebDataSource --ci` | exit 0 |

## Scope

**In scope**:
- `extensions/default/src/DicomWebDataSource/qido.test.js` (create)
- `extensions/default/src/DicomWebDataSource/index.test.ts` (create)
- Export-for-testing tweaks ONLY of this shape: adding `export` to an existing
  top-level function in `qido.js`/`index.ts` without moving or modifying its
  body. Nothing else in source files.

**Out of scope** (do NOT touch):
- Any behavioral change to source. If a test reveals a real bug, write the
  failing expectation as `it.skip` with a `// BUG:` comment, report it, and
  move on.
- `retrieveStudyMetadata.js` and its tests (plan 001 owns them).
- `retrieveRendered.test.ts` and other data sources (`DicomLocalDataSource`,
  `MergeDataSource`, ...).

## Git workflow

- Branch: `advisor/011-dicomweb-tests`
- Conventional commit, e.g. `test(dicomweb): cover QIDO param mapping and data source API surface`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Map the seams

Read `qido.js` end to end and the top 250 lines of `index.ts`. List every
exported (or exportable) pure-ish function and, for each, the inputs/outputs
you can assert without a network. Deliverable: the `describe` skeleton of both
test files with `it.todo` entries.

**Verify**: `cd extensions/default && pnpm exec jest src/DicomWebDataSource --ci` → exit 0 (todos are fine).

### Step 2: qido.test.js

Cover at minimum:
1. Study-search param mapping: patient name / MRN / study date range /
   modalities in → the exact QIDO query object out (attribute IDs, `limit`,
   `offset`, `fuzzymatching`), using a representative `mapParams` input like
   the one `index.ts:228` builds.
2. Result processing: a canned QIDO JSON study entry (build a minimal DICOM
   JSON dataset with tags like 00100010/00200010) → the normalized study
   object (names via `getName`, strings via `getString`, modalities merged).
3. Series-in-study processing incl. the sort behavior imported from
   `sortStudySeries`.
4. Edge cases: empty result array; entry missing optional tags → fields
   default rather than throw.

**Verify**: focused jest run → new tests pass.

### Step 3: index.test.ts — API surface with mocked clients

`jest.mock('dicomweb-client')` (and any `@ohif/core` client factory used) so
`createDicomWebApi` constructs against fakes. Provide a minimal
`servicesManager` stub: `{ services: { userAuthenticationService: { getAuthorizationHeader: jest.fn(() => ({ Authorization: 'Bearer test-token-value' })) }, customizationService: <as needed> } }`
— read `initialize`/`getAuthorizationHeader` in `index.ts` first to see the
exact services touched, and stub exactly those.

Cover at minimum:
1. `getAuthorizationHeader` passes through the user auth service header, and
   the no-auth case returns undefined/empty without throwing.
2. `generateWadoHeader` produces the expected `Accept` header for the
   configured `acceptHeader`/transfer syntax options (read the function; assert
   its actual branches).
3. `query.studies.search` forwards mapped params to the mocked client's
   `searchForStudies` and returns processed results.
4. `getImageIdsForInstance` / `getImageIdsForDisplaySet` produce the
   documented `wadors:`-style imageId strings for a minimal display set fixture
   (2 instances, one multiframe with `frame`).
5. `retrieve.bulkDataURI` calls the mocked `retrieveBulkData` and unwraps the
   value the way line 318's `.then(val => ...)` does.

Use fake config `{ name: 'test-ds', wadoRoot: 'https://pacs.example.test/wado', qidoRoot: 'https://pacs.example.test/qido', ... }` —
never a real endpoint.

**Verify**: focused jest run → new tests pass.

### Step 4: Full package suite + coverage note

Run the package suite with coverage and record the DicomWebDataSource
directory's statement coverage before/after in `plans/README.md` notes.

**Verify**: `cd extensions/default && pnpm run test:unit:ci` → exit 0.

## Test plan

The steps ARE the test plan. Structural pattern: `retrieveRendered.test.ts`.
Aim for behavior-per-`it`, no snapshot tests, no real network, no real timers.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `qido.test.js` and `index.test.ts` exist with ≥ 9 passing `it` blocks total (the case lists above)
- [ ] Zero `it.todo` remaining, or each remaining todo justified in the report
- [ ] `cd extensions/default && pnpm run test:unit:ci` exits 0
- [ ] Only test files (+ allowed `export` keywords) in the diff: `git diff --stat` shows no source-line changes beyond `export` additions
- [ ] Coverage numbers recorded in `plans/README.md` notes
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `createDicomWebApi` cannot be constructed under jsdom with mocked clients
  after two attempts (e.g. a top-level side effect requires browser APIs the
  base jest config doesn't polyfill) — report the exact import chain that
  fails; do not refactor source to make it testable.
- `qido.js`'s functions are not exported and adding `export` breaks the
  build/bundling in any way.
- A test exposes a real behavioral bug — record via `it.skip` + `// BUG:` and
  report (do not fix here).

## Maintenance notes

- These tests define the request-shape contract; when someone adds a QIDO
  param or changes header negotiation, tests here must change in the same PR —
  that is the point.
- Follow-up (deferred): `retrieveStudyMetadata` orchestration tests beyond
  plan 001's cache tests (series-filter path, lazy-load path), and
  `MergeDataSource` routing tests.
- Reviewer should scrutinize: mocks assert on *arguments passed to the
  client*, not just return plumbing — that's where regressions hide.
