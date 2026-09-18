# IMPLEMENTATION_PLAN.md

> Evidence labels used throughout: **[VERIFIED]** = read from the checked-out source at `1ec01348d` (path given); **[PROPOSED]** = our design decision; **[UNVERIFIED]** = assumption that must be confirmed before code depends on it. Open items are tracked in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10, and summarised in `ARCHITECTURE.md` §11.
>
> Our working instructions are in `TASK_INSTRUCTIONS.md`, not `CLAUDE.md` (that is a generated symlink to upstream OHIF's `AGENTS.md`).

## Working rule

Implement and merge the task in small feature PRs. The test explicitly values PR history as evidence of reasoning.

Do not build the entire solution in one branch and retroactively split commits.

Each PR should:

- leave the repository understandable;
- have a focused purpose;
- include a meaningful description;
- state what was verified;
- update architecture docs if a decision changed.

## Phase 0 — Baseline verification — ✅ COMPLETE

Goal was to remove environment/OHIF uncertainty before writing feature code. Done, plus a read-only repository/architecture audit.

Recorded baseline — all **[VERIFIED]**:

| Item | Value | Source |
|---|---|---|
| OHIF version | `3.14.0-beta.29` | `package.json` `version` |
| Baseline commit | `1ec01348d` | `git log` |
| Node | `24.15.0` | `.node-version`; `engines.node: >=24` |
| pnpm | `11.5.2` | `package.json` `packageManager` |
| Viewer dev port | `3000` (override: `OHIF_PORT`) | `platform/app/.webpack/webpack.pwa.js:26` |
| Viewer dev command | `pnpm run dev` | `package.json` `scripts.dev` |
| Direct study route | `/viewer?StudyInstanceUIDs=...` works | verified manually |
| Default data source | public AWS S3 static WADO (`defaultDataSourceName: 'ohif'`) | `platform/app/public/config/dev.js:111-125` |
| `EllipticalROI` | in the `default` tool group, area in `mm²` | `modes/basic/src/initToolGroups.ts:65` |

Audit corrections that change this plan:

1. **Install command.** `pnpm-workspace.yaml:17` sets `frozenLockfile: true`, so a plain `pnpm install` **fails** once workspace globs or dependencies change. Use the repository's own script and commit the lockfile:

   ```bash
   pnpm run install:update-lockfile    # package.json:32 -> pnpm install --no-frozen-lockfile
   ```

2. **Dependency pinning.** `minimumReleaseAge: 2880` (48 h) rejects freshly published versions. Pin exact versions at least 48 h old.
3. **Default primary tool is `WindowLevel`, not `Pan`** — `modes/basic/src/initToolGroups.ts:20-37`. See `ARCHITECTURE.md` §6 and §10.7.
4. **Repository-wide typecheck is impossible** (6,981 pre-existing errors, `TS5053` on `--noEmit`, no `typecheck` script). Scoped checks only — see `docs/scoring-form/IMPLEMENTATION_NOTES.md` §9.1.
5. **`setToolActive` fails silently** — `extensions/cornerstone/src/commandsModule.ts:1214-1228`. Activation must be read back. See `ARCHITECTURE.md` §6 and `docs/scoring-form/IMPLEMENTATION_NOTES.md` §3.2.
6. **`cachedStats` timing is an open risk** blocking PR 4 — `docs/scoring-form/IMPLEMENTATION_NOTES.md` §5.3 and §10 item 1.

Baseline is fixed. Do not re-select or move it.

## PR 1 — `chore: bootstrap host app and task workspace`

### Goal

Create the host shell, the shared protocol package, and the workspace wiring — with **zero OHIF behavior change**.

### Explicitly OUT of scope for PR 1

This PR contains **no OHIF extension and no working handshake**. Specifically excluded:

- `extensions/scoring-form-bridge` (any file);
- any edit to `platform/app/pluginConfig.json`;
- any edit to OHIF source under `platform/`, `extensions/`, `modes/`;
- a viewer that emits `VIEWER_READY` — nothing sends it yet, so the host will never become ready in this PR, and that is the expected state;
- `ACTIVATE_TOOL` / `DEACTIVATE_TOOL` / `MEASUREMENT_ADDED` handling;
- the row reducer, row UI, Add Measurement / Activate buttons;
- the OHIF measurement adapter;
- total calculation;
- the pre-ready command queue (the contract may *define* the message types; nothing sends or queues them yet).

The host-side `message` listener **is** in scope, but only as a validating listener that logs and discards. It is installed so the topology and origin checks are real and testable — not to complete a handshake.

### Files added

```text
apps/host-app/package.json                  react+react-dom pinned 18.3.1; own typescript + vite
apps/host-app/tsconfig.json                 standalone, strict: true, noEmit: true
apps/host-app/vite.config.ts                server.port 5173, strictPort: true
apps/host-app/index.html
apps/host-app/src/main.tsx
apps/host-app/src/App.tsx                   two-column: flexible full-height iframe | scoring panel placeholder
apps/host-app/src/config.ts                 VIEWER_ORIGIN, VIEWER_STUDY_URL, HOST_ORIGIN
apps/host-app/src/bridge/useViewerBridge.ts listener installed BEFORE iframe src is set;
                                            validates origin + event.source + protocol + version; logs and discards
apps/host-app/.env.example
packages/message-contract/package.json      no runtime deps, no .babelrc
packages/message-contract/tsconfig.json     strict: true, noEmit: true
packages/message-contract/src/index.ts      PROTOCOL_NAME, PROTOCOL_VERSION = 1, message-type constants,
                                            BridgeEnvelope<TType, TPayload>, discriminated unions,
                                            runtime guards, BridgeMeasurementValue
```

### Files modified

```text
pnpm-workspace.yaml    + apps/*, + packages/*   (only these two lines)
pnpm-lock.yaml          via `pnpm run install:update-lockfile`
tsconfig.json           + paths/include entry for packages/message-contract
docs/scoring-form/README.md
                       fill in the host-app start command and the known-good StudyInstanceUID;
                       flip the affected rows of its status table
ARCHITECTURE.md        message table rows for every type defined in this PR;
                       Accepted Decisions entries for what was actually decided here
```

The repository root `README.md` is **upstream OHIF's and stays untouched in this PR**. The task setup guide lives at `docs/scoring-form/README.md`. Adding a discoverable pointer from the root README is a submission requirement tracked in PR 6.

**[VERIFIED]** no `pluginConfig.json` change is needed for the host app or contract package — `platform/app/.webpack/writePluginImportsFile.js:126-225` ignores any workspace package not declared there, so adding workspace globs cannot alter the viewer build.

### Important implementation details

- Install the host `message` listener **before** the real iframe URL is assigned, so an early `VIEWER_READY` could not be missed later. Do not rely on timing luck.
- Origin validation is real from day one: exact `event.origin === VIEWER_ORIGIN` **and** `event.source === iframe.contentWindow`. Never `'*'` as `targetOrigin`.
- Pin `react`/`react-dom` to `18.3.1`: **[VERIFIED]** `nodeLinker: hoisted` with a single hoisted `react@18.3.1` at the repo root.
- `strictPort: true` on Vite so a port clash fails loudly rather than silently moving the host origin and breaking origin validation.
- **[UNVERIFIED]** `esbuild` may need `allowBuilds: { esbuild: true }` in `pnpm-workspace.yaml`. Only add it if the install/dev-server actually fails, and comment why. (`docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 item 6.)

### Acceptance criteria

Functional:

1. `pnpm run install:update-lockfile` completes; `pnpm-lock.yaml` is updated and committed; any ignored build scripts are noted in the PR body.
2. `pnpm run dev` still serves the viewer on `:3000`, and `/viewer?StudyInstanceUIDs=<uid>` still loads the study — proving the workspace change broke nothing.
3. The host dev server serves on `:5173`.
4. The host page renders two columns: a flexible full-height iframe on the left showing the OHIF study route, and a scoring-panel placeholder on the right.
5. Devtools confirms two distinct origins (`localhost:5173` parent, `localhost:3000` child).
6. The host `message` listener is installed before the iframe `src` is set — demonstrated by an ordering assertion or a log line, not asserted by prose.
7. A hand-crafted `postMessage` from the wrong origin, or with a wrong `protocol`/`version`, is rejected by the host guard (shown via a log line).
8. Host state remains "viewer not ready" for the whole session. Expected: nothing emits `VIEWER_READY` yet.

Quality:

9. `apps/host-app` typechecks with **zero** errors via its own `tsconfig.json`.
10. `packages/message-contract` typechecks with **zero** errors via its own `tsconfig.json`.
11. `pnpm run build` (viewer production build) still succeeds.
12. No file under `platform/`, `extensions/`, `modes/`, `AGENTS.md` or `CLAUDE.md` is modified. `git diff --stat` in the PR body proves it.
13. No repository-wide `tsc` is claimed or attempted — see `docs/scoring-form/IMPLEMENTATION_NOTES.md` §9.1.

Documentation:

14. `docs/scoring-form/README.md` records the verified baseline and the exact install/start commands, is accurate when read **literally**, and its status table truthfully reflects what does and does not work after this PR.
15. `ARCHITECTURE.md` carries the message-table rows for every type defined here plus the Accepted Decisions actually taken, and still contains the diagram / consolidated payload table / "Accepted Decisions" section required by the assignment (p.4 §7.2).
16. No documentation added or changed in this PR claims that unimplemented behaviour already works.

### Suggested PR body

```md
## What
Bootstraps the Vite/React host app, the shared bridge contract package, and the
workspace/tsconfig wiring. Adds the host-side message listener with the
assignment-required event.origin check plus our additional event.source check.

## Why
Establishes the two-origin topology and a single source of truth for message
types (assignment §5.7) before any OHIF behaviour is touched. Keeping the OHIF
side untouched makes this PR trivially reviewable and proves the workspace
change is inert.

## Not in this PR
No OHIF extension, no pluginConfig change, no VIEWER_READY. The host will
correctly stay in the "viewer not ready" state — the handshake lands in PR 2.
The setup guide's status table says so explicitly; nothing claims to work yet.

## Verified
- pnpm run install:update-lockfile (frozenLockfile:true means plain install fails)
- viewer dev server on :3000, study route still loads
- host dev server on :5173, iframe renders the study, two distinct origins
- listener installed before iframe src; wrong-origin/wrong-version messages rejected
- scoped typecheck: apps/host-app and packages/message-contract, zero errors
- pnpm run build succeeds; git diff --stat shows no OHIF source changes
```

## PR 2 — `feat: add OHIF bridge extension and readiness handshake`

### Goal

Create the viewer-side bridge and a trustworthy `VIEWER_READY`.

### Already established by the audit — [VERIFIED], no re-inspection needed

- Minimal extension shape: `package.json` with `"module": "src/index.tsx"`, `src/id.js`, `src/index.tsx` exporting `{ id, preRegistration }`. **No per-extension webpack build is required** — precedent `extensions/test-extension/` has no `.webpack/` directory.
- Registration: add one entry to `platform/app/pluginConfig.json` `extensions`. The extension need **not** be a dependency of `platform/app` (`platform/app/.webpack/writePluginImportsFile.js:126-225` builds the resolve alias). `extensions/*` is already a workspace glob.
- No mode change needed: no runtime validation of a mode's `extensionDependencies` exists.
- `preRegistration` signature and params: `platform/core/src/extensions/ExtensionManager.ts:276-286`. `peerImport` is on the type but not passed.
- Readiness: `ViewportGridService.EVENTS.VIEWPORTS_READY` (`platform/core/src/services/ViewportGridService/ViewportGridService.ts:14,139-141`, published from `platform/app/src/components/ViewportGrid.tsx:143-150`). Can fire more than once.
- Subscription cleanup: `subscribe()` returns `{ unsubscribe }` (`platform/core/src/services/_shared/pubSubServiceInterface.ts:35-37`). Extension lifecycle is app-lifetime — precedent `extensions/default/src/init.ts:53-77`.

### Changes

- add `extensions/scoring-form-bridge`;
- add one entry to `platform/app/pluginConfig.json` — **[PROPOSED]** as the **last** `extensions` entry, so `toolGroupService` (registered by the cornerstone extension's own `preRegistration`, `extensions/cornerstone/src/index.tsx:210-224`) already exists;
- resolve services/commands **lazily** at message-handling time rather than capturing them during `preRegistration`;
- add viewer-side `message` listener;
- strict host `origin` check;
- `event.source === window.parent`;
- runtime contract validation;
- subscribe to `VIEWPORTS_READY`; emit `VIEWER_READY` **once** (idempotent) and only when activation is achievable;
- cleanup bridge listeners/subscriptions; guard installation so hot reload cannot duplicate them.

### Must resolve in this PR

**[OPEN]** `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 item 4 — readiness fallback. `VIEWPORTS_READY` never fires if the study or hanging protocol fails, so `VIEWER_READY` would never be sent. Reproduce with a deliberately broken `StudyInstanceUIDs`, choose a fallback (timeout / secondary signal / explicit error message), and record the decision with evidence.

### Verification

- host receives exactly one valid `VIEWER_READY`;
- reload and a layout change do not produce a duplicate `VIEWER_READY` or duplicate listeners;
- fake wrong-origin / wrong-version / unrelated messages are ignored on both sides;
- viewer still loads a normal study with the extension registered;
- broken-study case behaves per the chosen fallback.

## PR 3 — `feat: activate and cancel ellipse from scoring form`

### Goal

Implement host -> viewer command path.

### Host changes

- add row model and `useReducer`;
- Add Measurement button;
- row ID generation;
- Activate button;
- per-activation `activationId`;
- pre-ready command queue;
- one active drawing intent at a time;
- Cancel action sends `DEACTIVATE_TOOL`.

### Viewer changes

- handle `ACTIVATE_TOOL`;
- store armed `{ rowId, activationId }`;
- after the flow ends, **deactivate `EllipticalROI` and activate `WindowLevel`** — the verified baseline default primary tool, held in one named constant (`ARCHITECTURE.md` §6, §10.7);
- activate `EllipticalROI` — **[PROPOSED]** via `toolbarService.recordInteraction('EllipticalROI', { refreshProps: { viewportId } })` (`platform/core/src/services/ToolBarService/ToolbarService.ts:226-289`) so the toolbar highlight stays in sync;
- **verify the activation actually took effect** by reading back the tool group's active primary tool; treat a mismatch as failure and do **not** arm the row. **[VERIFIED]** `setToolActive` has three silent early returns and `runCommand` returns `undefined` regardless (`extensions/cornerstone/src/commandsModule.ts:1214-1228`, `platform/core/src/classes/CommandsManager.ts:153-178`);
- handle `DEACTIVATE_TOOL`: clear matching armed state, cancel any in-progress drawing via `commandsManager.runCommand('cancelMeasurement', {}, 'CORNERSTONE')` (`extensions/cornerstone/src/commandsModule.ts:317-322`), then **deactivate `EllipticalROI` and activate `WindowLevel`** — never restore an arbitrary previously active annotation tool;
- tolerate the **[VERIFIED]** edge case that `EllipticalROITool.cancel()` still fires `ANNOTATION_COMPLETED` (`node_modules/@cornerstonejs/tools/dist/esm/tools/annotation/EllipticalROITool.js:332`).

Note: `Pan` is **not** the baseline default primary tool — `WindowLevel` is (`modes/basic/src/initToolGroups.ts:20-37`). Do not hardcode either; restore what was captured.

### Must resolve in this PR

- **[OPEN]** `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 item 3 — how an activation failure is reported to the host. Adding a message type is a deliberate contract change: decide, record it in the `ARCHITECTURE.md` §5 message table, do not improvise.
- **[OPEN]** `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 item 2 — which activation API to use: the `commandsManager` path the assignment names, or `toolbarService.recordInteraction`, which also refreshes the toolbar highlight.

### Verification

Critical cases:

1. viewer ready -> Activate -> `EllipticalROI` becomes active **and the read-back confirms it**;
2. Activate -> Cancel -> bridge is not armed, in-progress drawing cancelled, captured tool restored;
3. click Activate before iframe/viewer readiness -> command is delivered later, not lost;
4. row A then row B activation produces one coherent active row;
5. unknown / wrong-version messages are ignored;
6. an activation attempted with no viewport/tool group is detected as a failure rather than silently arming the row.

## PR 4 — `feat: correlate OHIF measurements with form rows`

### Goal

Implement viewer -> host result path.

### Structure — already [VERIFIED], do not re-derive

`extensions/cornerstone/src/utils/measurementServiceMappings/EllipticalROI.ts:61-81`:

- no top-level `area`; area is at `Object.values(measurement.data)[0]?.area`, unit at `.areaUnit`;
- `measurement.data` **is** `annotation.data.cachedStats`, keyed by Cornerstone `targetId`;
- `measurement.uid` equals the Cornerstone `annotationUID`;
- `MEASUREMENT_ADDED` fires on drawing **completion**, payload `{ source, measurement }`, `source.name === CORNERSTONE_3D_TOOLS_SOURCE_NAME` for tool-drawn annotations (`platform/core/src/services/MeasurementService/MeasurementService.ts:541-575`, `extensions/cornerstone/src/initMeasurementService.ts:340-341`);
- `areaUnit` is an **open string set** (`'mm²'`, `'px²'`, plus calibration suffixes; `²` is U+00B2).

### ⛔ Blocking open issue — resolve before writing the adapter

**[OPEN]** `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 item 1 — `cachedStats` timing. Stats are computed in the Cornerstone render pass and throttled 100 ms trailing, while `ANNOTATION_COMPLETED` fires on mouse-up, so `area` may be `null` or stale at `MEASUREMENT_ADDED`, and `measurement.data` is a live reference that keeps mutating.

Required first step of this PR:

1. log a real `MEASUREMENT_ADDED` **and** the following `MEASUREMENT_UPDATED` for a **slow** draw;
2. repeat for a **fast** click-drag-release;
3. record both payloads and whether `area` was finite and final;
4. only then choose a mitigation and record it, with the logged evidence, in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §5.3 and as an entry in `ARCHITECTURE.md` §10 (Accepted Decisions).

Do not implement a mitigation before step 4, and do not present a guess as verified.

### Viewer changes

- subscribe to `measurementService.EVENTS.MEASUREMENT_ADDED`;
- save the `{ unsubscribe }` handle;
- filter by `toolName === 'EllipticalROI'` and by `source.name`;
- ignore unrelated measurements if no matching armed activation exists;
- adapt the OHIF measurement into the bridge value, copying **primitives only** — never forward the live `cachedStats` reference across `postMessage`;
- apply the mitigation chosen above for non-finite / stale area;
- send `rowId`, `activationId`, `measurementId`, value, unit;
- store `measurementId -> rowId`;
- clear armed state;
- deactivate `EllipticalROI` and activate `WindowLevel` (`ARCHITECTURE.md` §6, §10.7) — satisfies the assignment's "Pan/default" via the *default* option.

### Host changes

- receive/validate `MEASUREMENT_ADDED`;
- verify the row still exists;
- verify current row `activationId` matches;
- ignore stale event otherwise;
- store measurement ID/value/unit;
- mark row ready.

### Verification

- create at least three sequential measurements;
- each value lands in the correct row;
- the reported area matches the value OHIF displays in the viewport (this is the check that catches the `cachedStats` staleness issue);
- a fast click-drag-release also produces a correct value, or is handled per the chosen mitigation;
- annotations created directly from the OHIF toolbar do not hijack a form row;
- an Escape-cancelled partial ellipse does not corrupt a row;
- stale activation event cannot overwrite a newer activation.

## PR 5 — `feat: add unit-safe totals and final required UX`

### Goal

Complete the mandatory scenario.

### Changes

- pure total calculation grouped by unit;
- display total(s);
- deterministic numeric formatting;
- row status labels;
- cancellation UI polish;
- error/unsupported-unit behavior if needed;
- small tests for:
  - totals;
  - protocol guard/serialization;
  - stale activation handling if feasible.

### Verification

Demo script:

1. start both apps;
2. add three rows;
3. measure all three;
4. show totals updating;
5. activate another row and cancel;
6. show early activation while viewer loads;
7. confirm no mixed-unit summation.

At this point the mandatory scope should be submission-quality.

## PR 6 — `docs: finalize architecture, runbook, and AI usage`

### Goal

Make the project reproducible on a clean machine and easy to defend.

### Changes

**Setup guide — `docs/scoring-form/README.md`, finalised:**

- exact OHIF baseline: version `3.14.0-beta.29`, commit `1ec01348d`, Node `24.15.0`, pnpm `11.5.2`;
- prerequisites;
- exact install command — `pnpm run install:update-lockfile` (a plain `pnpm install` fails: `pnpm-workspace.yaml:17` `frozenLockfile: true`);
- exact commands for both ports (viewer `3000` via `pnpm run dev`, host `5173`);
- known-good study URL;
- status table removed or fully green — by this PR every step must actually work.

**Discoverable entry point — required before submission:**

- add a short pointer from the repository root `README.md` to `docs/scoring-form/README.md`.
- The root README is upstream OHIF's and has been deliberately untouched until now. **[PDF** p.4 §7.2**]** says the reviewer's steps will be executed literally from a clean clone; a reviewer who opens the root readme must be able to find the task instructions without being told they exist. This is the minimum edit that achieves that — a few lines near the top, not a rewrite.
- This is the **only** intended modification to an upstream OHIF file in the whole task. Call it out explicitly in the PR body.

**`ARCHITECTURE.md`, final pass:** diagram, consolidated message table with payloads, "Accepted Decisions" (every resolved open item folded in with its evidence), known limitations/trade-offs. Keep it to the assignment's 1–2 substantive pages; depth belongs in `docs/scoring-form/IMPLEMENTATION_NOTES.md`.

**`AI-USAGE.md`:** fill in the per-PR table honestly — what AI produced, what was kept, what was rewritten and why. **[PDF** p.4 §7.2**]** the ability to work with AI is *critically assessed*; hiding it is the only penalty.

**Demo-video checklist** (**[PDF** p.5 §7.3**]**, mandatory, 2–4 min, voice-over desirable) — all five scenes required:

1. launching both applications;
2. adding at least **three** measurements in a row;
3. the total updating;
4. **cancelling an activation** (pressed Activate, changed your mind);
5. any implemented star tasks.

### Required before final submission — blocking checklist

All four are hard gates. The assignment states the reviewer's steps will be executed **literally on a clean machine** (**[PDF** p.4 §7.2**]**), and "reproduces from the README without hints" is 25% of the grade (**[PDF** p.6 §10**]**).

- [ ] **Discoverable link from the root `README.md`** to `docs/scoring-form/README.md`. The root README is upstream OHIF's and is untouched until this PR; this is the **only** intended edit to an upstream OHIF file in the whole task, and it must be called out in the PR body. A reviewer opening the root readme must find the task guide without being told it exists.
- [ ] **Replace the placeholder clone command.** `docs/scoring-form/README.md` currently reads `git clone <this-fork>`. Substitute the **actual public fork URL**, and confirm the repository is publicly reachable (the assignment requires an open repository, **[PDF** p.4 §7.1**]**).
- [ ] **Verified exact `StudyInstanceUID` and a working direct viewer URL.** Record the real UID — not a placeholder — and paste the full working URL in the form `http://localhost:3000/viewer?StudyInstanceUIDs=<uid>`. Confirm against the default public DICOMweb source that the study loads and that `EllipticalROI` yields an area in `mm²` on it.
- [ ] **Clean-machine setup verification using only the documented commands.** Fresh clone or clean worktree, no undeclared global dependencies, no hidden local config, nothing carried over from the development checkout. Follow the guide verbatim, top to bottom, and fix the guide — not the machine — wherever it fails. Record in the PR body what was run and on what.

## PR 7 — optional `feat: sync live measurement updates`

Only after PR 1–6 required scope is stable.

### Viewer

- subscribe to `MEASUREMENT_UPDATED`;
- only forward measurements present in `measurementId -> rowId`;
- adapt new area/unit;
- send `MEASUREMENT_UPDATED`.

### Host

- update row from remote event;
- recalculate totals;
- do not emit any reciprocal viewer command from this remote reducer action.

### Performance

OHIF drag updates can be frequent.

Start with direct updates because the UI is tiny.

If actual frequency causes excessive renders, throttle/debounce UI updates while guaranteeing the final update is delivered. Document the trade-off.

## PR 8 — optional `feat: synchronize measurement deletion`

Only if enough time remains.

Requires explicit loop-safe semantics.

Suggested protocol additions:

- `REMOVE_MEASUREMENT` host -> viewer;
- `MEASUREMENT_REMOVED` viewer -> host.

Do not reuse `DEACTIVATE_TOOL` for deletion; activation cancellation and deleting an existing annotation are different operations.

## Final pre-submission checklist

### Required behavior

- [ ] public DICOMweb study loads;
- [ ] direct `StudyInstanceUIDs` URL works;
- [ ] host and viewer use different ports;
- [ ] iframe fills available viewer area;
- [ ] rows can be added indefinitely;
- [ ] Activate triggers EllipticalROI;
- [ ] measurement returns to the correct row;
- [ ] exact unit preserved (open string set; no normalization);
- [ ] unlike units not summed;
- [ ] after a measurement completes or is cancelled, `EllipticalROI` is deactivated automatically and `WindowLevel` (the baseline default primary tool, not `Pan`) is active again;
- [ ] activation is verified by read-back, never assumed;
- [ ] reported area matches what OHIF displays;
- [ ] cancel works;
- [ ] early Activate is not lost;
- [ ] origin checked both ways;
- [ ] source window checked both ways;
- [ ] shared message types;
- [ ] cleanup paths present;
- [ ] no unrelated OHIF annotation correlation.

### Mandatory deliverables (`ASSIGNMENT.pdf` p.4 §7.1–7.2, p.5 §7.3)

- [ ] **≥ 5 feature PRs**, each describing what changed, why exactly this way, and what was verified (a PR described as "changes" is not counted);
- [ ] **setup guide** at `docs/scoring-form/README.md`, tested literally from a clean clone using only the documented commands;
- [ ] **discoverable pointer** from the root `README.md` to that guide;
- [ ] **real public fork URL** in the clone command — no `<this-fork>` placeholder left;
- [ ] **verified exact `StudyInstanceUID`** and a working direct `/viewer?StudyInstanceUIDs=<uid>` URL;
- [ ] **`ARCHITECTURE.md`** containing the diagram, the consolidated message table with payloads, and the "Accepted Decisions" section — kept to 1–2 substantive pages;
- [ ] **`AI-USAGE.md`** filled in honestly per PR (kept / rewritten / why);
- [ ] **video demo**, 2–4 min, voice-over desirable, showing all five required scenes: both apps launching · ≥ 3 measurements in a row · the total updating · **cancelling an activation** · any star tasks.

### Repository quality

- [ ] PR descriptions explain why + verification;
- [ ] `ARCHITECTURE.md` matches code;
- [ ] no documentation claims that unimplemented behaviour already works;
- [ ] no unexplained core OHIF edits; `AGENTS.md` and `CLAUDE.md` untouched;
- [ ] no secrets/local machine paths;
- [ ] `pnpm run build` succeeds;
- [ ] **scoped** typecheck of every app/package we added passes with zero errors (no repository-wide `tsc` claimed — see `docs/scoring-form/IMPLEMENTATION_NOTES.md` §9.1);
- [ ] focused unit tests pass;
- [ ] every `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 open item is either resolved (recorded as an `ARCHITECTURE.md` §10 Accepted Decision, with evidence) or explicitly listed in `ARCHITECTURE.md` §11 as a known limitation;
- [ ] `ARCHITECTURE.md` still contains the diagram, the consolidated message table with payloads, and the "Accepted Decisions" section required by the assignment (p.4 §7.2);
- [ ] the root `README.md` contains a discoverable pointer to `docs/scoring-form/README.md`.

### Defense rehearsal

Be able to make these changes without architecture rewrite:

- [ ] EllipticalROI -> RectangleROI;
- [ ] add perimeter or mean intensity through viewer adapter, protocol, reducer, UI;
- [ ] remove/break `VIEWER_READY` and explain failure path;
- [ ] explain why `WindowLevel` is activated rather than `Pan`, and why that still satisfies the assignment's «повертається Pan/дефолт» through the *default* option;
- [ ] explain how activation success is confirmed given that `setToolActive` fails silently;
- [ ] explain the `cachedStats` timing risk and the mitigation chosen.
