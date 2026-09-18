# TASK_INSTRUCTIONS.md — Viewer + Scoring Form Test Task

> This file is the task instruction set for AI coding agents and humans working on this test task.
>
> It is **not** `CLAUDE.md`. In this repository `CLAUDE.md` is a symlink to the upstream OHIF `AGENTS.md`, recreated on every `pnpm install` (`preinstall.js:17-34`) and listed in `.gitignore`. Do not modify `AGENTS.md` or `CLAUDE.md`, and never store task content there.

## Evidence labels

Every factual claim about OHIF internals in our documents carries one of:

- **[PDF]** — an original requirement from `ASSIGNMENT.pdf`, with a page reference. Not ours to change.
- **[VERIFIED]** — read directly from the checked-out source at commit `1ec01348d`; a file path is given.
- **[OURS]** / **[PROPOSED]** — our own design decision. Not a fact about OHIF and not a requirement. Changes must be reflected in `ARCHITECTURE.md` in the same PR.
- **[OPEN]** / **[UNVERIFIED]** — not yet confirmed against real runtime behavior, or not yet decided. Must not be built on until closed. Open items are listed in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 with their target PR. Do not silently promote to [VERIFIED].

## Source of truth

`ASSIGNMENT.pdf` (repository root) is the **primary requirements source**. `TASK.md`, this file, `ARCHITECTURE.md` and `IMPLEMENTATION_PLAN.md` are derived documents — if one of them disagrees with the PDF, the PDF wins and the derived document is corrected.

`ASSIGNMENT.pdf` is a supplied artifact and is **not tracked in Git**.

## Mission

Implement the supplied test task — role as stated in the assignment: **Frontend Developer (React / TypeScript)**, 5 working days — as a small, production-minded integration between:

- an OHIF Viewer fork running in an iframe on a separate origin/port;
- a React + TypeScript host app containing the scoring form;
- a typed `window.postMessage` protocol shared by both sides.

The goal is **not** to redesign OHIF or build a large product. The goal is to demonstrate a clear message contract, correct async behavior, correlation between form rows and OHIF measurements, lifecycle cleanup, origin validation, and code that can be explained and changed live during the interview.

## Read before changing code

1. Read `START_HERE.md`.
2. Read `TASK.md` (requirements with PDF page references).
3. Read `ARCHITECTURE.md` (design, message table, Accepted Decisions).
4. Read `docs/scoring-form/IMPLEMENTATION_NOTES.md` (verified OHIF findings, evidence, open items).
5. Read `IMPLEMENTATION_PLAN.md`.
6. Inspect the actual checked-out OHIF source before using any OHIF API.
7. Treat the checked-out `package.json`, `pnpm-workspace.yaml`, source code, and current OHIF API as the source of truth.
8. Do **not** trust stale README/`AGENTS.md` commands if they conflict with package manifests or source code. Known-stale `AGENTS.md` claims are listed in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §11.
9. Work on **one planned PR at a time**. Do not implement future PRs unless explicitly asked.

## Repository strategy

Use **one repository based on the OHIF fork itself**. Do not create an outer monorepo that contains another OHIF monorepo.

Target custom structure:

```text
<ohif-fork-root>/
├── apps/
│   └── host-app/
├── extensions/
│   └── scoring-form-bridge/
├── packages/
│   └── message-contract/
├── docs/
│   └── scoring-form/
│       ├── README.md               # task setup guide (clone -> working screen)
│       └── IMPLEMENTATION_NOTES.md # verified OHIF findings, evidence, open items
├── START_HERE.md
├── TASK.md
├── TASK_INSTRUCTIONS.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AI-USAGE.md
├── README.md                # upstream OHIF readme — left untouched for now;
│                            # needs a pointer to docs/scoring-form/README.md
│                            # before submission
├── AGENTS.md            # upstream OHIF, do not modify
└── CLAUDE.md -> AGENTS.md   # generated symlink, gitignored, do not modify
```

The existing OHIF `platform/`, `extensions/`, `modes/`, build configuration, and upstream code should remain as close to upstream as reasonably possible.

**[VERIFIED]** `pnpm-workspace.yaml:1-4` declares only `platform/*`, `extensions/*`, `modes/*`. `apps/*` and `packages/*` must be added. `extensions/*` already covers our bridge extension, so no glob change is needed for it.

## OHIF baseline — verified

Phase 0 is complete. The baseline is fixed for the whole task:

| Item | Value | Source |
|---|---|---|
| OHIF version | `3.14.0-beta.29` | `package.json` `version` |
| Baseline commit | `1ec01348d` | `git log` |
| Node | `24.15.0` | `.node-version`; `engines.node: >=24` |
| pnpm | `11.5.2` | `package.json` `packageManager` |
| Viewer dev port | `3000`, override with `OHIF_PORT` | `platform/app/.webpack/webpack.pwa.js:26` |
| Direct study route | `/viewer?StudyInstanceUIDs=...` | verified manually |
| `EllipticalROI` | in the `default` tool group, area reported in `mm²` | `modes/basic/src/initToolGroups.ts:65` |

Do not re-select or move the baseline. Record these values in the final README.

### Workspace facts that change how you install — all [VERIFIED]

`pnpm-workspace.yaml`:

- `frozenLockfile: true` (line 17) — a plain `pnpm install` **fails** as soon as workspace globs or dependencies change. Use the repository's own script:

  ```bash
  pnpm run install:update-lockfile   # = pnpm install --no-frozen-lockfile
  ```

  Commit the updated `pnpm-lock.yaml` in the same PR.
- `minimumReleaseAge: 2880` (line 11, 48 h) — very recently published versions are rejected at install time. Pin exact dependency versions that are at least 48 h old.
- `allowBuilds` (lines 39-46) — postinstall scripts are denied unless allowlisted. `esbuild` is **not** listed. **[UNVERIFIED]** whether a Vite host app needs `esbuild: true` added; the first install will show it. Do not pre-emptively edit the allowlist.
- `nodeLinker: hoisted` (line 7) — a single hoisted `react@18.3.1` at the repo root. **[PROPOSED]** pin the host app to `react`/`react-dom` `18.3.1` to avoid hoist interference with the viewer.

## Hard constraints from the task

Must implement:

- two applications on different ports/origins;
- host app: React + TypeScript;
- OHIF displayed in an iframe;
- communication through `window.postMessage`;
- OHIF bridge implemented as an OHIF extension;
- `VIEWER_READY`;
- `ACTIVATE_TOOL`;
- `DEACTIVATE_TOOL`;
- `MEASUREMENT_ADDED`;
- protocol `version: 1`;
- origin validation on both sides;
- row-to-measurement correlation;
- no lost command when Activate is clicked before viewer readiness;
- cleanup of listeners/subscriptions/armed state;
- unit-safe totals;
- shared TypeScript message definitions;
- repeatable multiple measurements.

Optional work comes only after the required flow is solid.

## Engineering principles

### 1. Prefer explicit state transitions

The host scoring form should use an explicit reducer/state-machine-like model, not scattered booleans.

A row should have a stable `rowId`. Suggested state:

- `waiting`
- `drawing`
- `ready`

Additional internal metadata may include:

- `activationId`
- `measurementId`
- `value`
- `unit`
- `queued`

Do not let multiple rows silently own the drawing tool at the same time.

### 2. Host owns form-row identity

The host creates `rowId` with `crypto.randomUUID()` when a row is added.

On each activation attempt the host creates a new `activationId`.

The viewer creates/receives the OHIF `measurementId` (normally the OHIF measurement/annotation UID).

After `MEASUREMENT_ADDED`, the host stores:

```text
rowId <-> measurementId
```

The viewer also remembers the mapping required for later `MEASUREMENT_UPDATED` events.

Why:

- the host owns the form entity;
- OHIF owns the annotation entity;
- neither side invents the other side's native ID;
- `activationId` prevents a stale measurement event from being accepted after cancel/reactivate races.

### 3. Never guess a measurement payload

The source has now been read. The structure below is **[VERIFIED]**; the *timing* is **[UNVERIFIED]** and is the largest open risk in the task.

**[VERIFIED]** `extensions/cornerstone/src/utils/measurementServiceMappings/EllipticalROI.ts:61-81` — the OHIF measurement object has **no top-level `area`**. It exposes:

- `uid` — equals the Cornerstone `annotationUID` (`extensions/cornerstone/src/initMeasurementService.ts:256`);
- `toolName` — `'EllipticalROI'`;
- `data` — a reference to `annotation.data.cachedStats`, keyed by Cornerstone `targetId` (e.g. `imageId:<imageId>`), each value `{ area, areaUnit, mean, stdDev, max, min, Modality, modalityUnit }`.

So the area is at `Object.values(measurement.data)[0]?.area`, and the unit at `.areaUnit`.

**[VERIFIED]** `MEASUREMENT_ADDED` fires on drawing **completion**, not on first appearance. `platform/core/src/services/MeasurementService/MeasurementService.ts:541-575` only broadcasts when a previous entry already exists; the `ANNOTATION_ADDED` pass stores silently and the `ANNOTATION_COMPLETED` pass emits (`extensions/cornerstone/src/initMeasurementService.ts:340-341`). Payload is `{ source, measurement }`.

**[UNVERIFIED] — open question, must be settled with a real logged event before PR 4.** `cachedStats` is computed inside the Cornerstone render pass, not on mouse-up, and updates are throttled (100 ms, trailing):

- `node_modules/@cornerstonejs/tools/dist/esm/tools/annotation/EllipticalROITool.js:408-421` — stats computed in `renderAnnotation`;
- `:606` — `_throttledCalculateCachedStats`, 100 ms trailing;
- `:186` — `triggerAnnotationCompleted` fires from `_endCallback` (mouse-up).

Therefore, at `MEASUREMENT_ADDED` time the area may be `null` (very fast click-drag-release) or up to ~100 ms stale (not the final geometry). `measurement.data` is also a **live reference** that keeps mutating after the event.

Required approach:

1. Log one real `MEASUREMENT_ADDED` (and the following `MEASUREMENT_UPDATED`) for a slow draw and for a fast draw.
2. Only then choose a mitigation. Candidates, none yet selected: adapter returns `null` on non-finite area and the bridge waits for the first `MEASUREMENT_UPDATED` for that `uid`; or re-read on the next animation frame; or both.
3. Record the chosen mitigation and the evidence in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §5.3, and add the decision to `ARCHITECTURE.md` §10 (Accepted Decisions).

Do not pick one of these without the logged evidence, and do not present a guess as verified.

Create one small adapter in the viewer extension, e.g.:

```text
OHIF measurement -> BridgeMeasurementValue
```

It must extract primitives (never forward the live `cachedStats` reference), verify the tool name, require a finite numeric area, and return `null` for unsupported or not-yet-computed data. Keep OHIF-specific data shape out of the host app.

### 4. Handshake must mean "actually ready"

Do not send `VIEWER_READY` merely because the bridge module file executed.

The bridge must first be able to safely receive `ACTIVATE_TOOL`.

**[VERIFIED]** the lifecycle pieces exist as follows:

- `preRegistration({ servicesManager, serviceProvidersManager, commandsManager, hotkeysManager, extensionManager, appConfig, configuration })` — `platform/core/src/extensions/ExtensionManager.ts:276-286`. Awaited, sequential in `pluginConfig.json` order. Note `peerImport` is declared on the params type (`:34`) but **not passed**; do not rely on it.
- Readiness signal: `viewportGridService.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, ...)` — `platform/core/src/services/ViewportGridService/ViewportGridService.ts:14,139-141`, published from `platform/app/src/components/ViewportGrid.tsx:143-150`. Upstream precedent for subscribing to it from `preRegistration`: `extensions/default/src/init.ts:53-77`.
- `VIEWPORTS_READY` can fire **more than once** (layout changes), so `VIEWER_READY` emission must be idempotent.
- `toolGroupService` is registered by the cornerstone extension's own `preRegistration` (`extensions/cornerstone/src/index.tsx:210-224`). **[PROPOSED]** list the bridge **last** in `pluginConfig.json.extensions` and resolve services/commands lazily at message-handling time rather than at `preRegistration` time.

### 4a. Tool activation must be verified, never assumed

**[VERIFIED]** `extensions/cornerstone/src/commandsModule.ts:1214-1228` — `setToolActive` has three **silent** early returns:

```js
if (!viewports.size) return;
const toolGroup = toolGroupService.getToolGroup(toolGroupId);
if (!toolGroup) return;
if (!toolGroup?.hasTool(toolName)) return;
```

`commandsManager.runCommand` returns `undefined` on both success and each of these failures (`platform/core/src/classes/CommandsManager.ts:153-178`). A "successful" activation call therefore proves nothing.

Required: after issuing activation the bridge must **read back** the actual state — e.g. confirm `toolGroup.getActivePrimaryMouseButtonTool() === 'EllipticalROI'` — and treat a mismatch as a failure rather than arming the row. How a failure is surfaced to the host is **[OPEN]** and not yet designed; see `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10 item 3.

This is the concrete mechanism behind a "lost Activate", and it is the most likely source of that bug. An activation sent immediately after `VIEWER_READY` must not disappear because no viewport or tool group exists yet.

### 5. Avoid missing an early VIEWER_READY

The host must attach its `message` listener before allowing the real viewer iframe to load.

A valid pattern:

1. initialize bridge listener;
2. render/set the iframe URL only after the listener is installed.

Do not rely on timing luck.

### 6. Queue commands before ready

Outgoing host commands issued before `VIEWER_READY` must be retained.

A small in-memory FIFO is acceptable.

However, tool activation is exclusive. The host state must emit coherent transitions. If the user switches from row A to row B before readiness, explicitly cancel/deactivate A before activating B rather than leaving two rows in `drawing`.

On `VIEWER_READY`, flush queued commands in order.

### 7. Validate origin (required) and source window (our addition)

**[PDF** p.3 §5.2**]** requires only that **both** `message` handlers check **`event.origin`** and do not react to foreign messages. A hardcoded origin in config is acceptable; its absence is not.

**[OURS]** we additionally check `event.source`. The PDF does not ask for this. We add it because origin alone cannot distinguish two host tabs that share an origin — and "what happens if two host-app tabs are open at once?" is an explicit defence question.

Host message handler:

- **required [PDF]:** exact `event.origin === VIEWER_ORIGIN`;
- **added [OURS]:** `event.source === iframe.contentWindow`;
- validate the runtime message shape;
- reject unsupported protocol versions.

Viewer message handler:

- **required [PDF]:** exact `event.origin === HOST_ORIGIN`;
- **added [OURS]:** `event.source === window.parent`;
- validate runtime message shape;
- reject unsupported protocol versions.

Never use `"*"` as `targetOrigin`. Keep the required-vs-added distinction visible in code comments as well, so the defence answer is unambiguous about which check the assignment demanded and which is ours.

### 8. TypeScript is not runtime validation

`postMessage` crosses a runtime boundary.

The shared package should provide:

- discriminated TypeScript unions;
- constants;
- lightweight runtime guards/parsers.

Do not add a large schema library unless there is a concrete reason. If the protocol grows substantially, document Zod/JSON Schema as a future scaling option.

### 9. Units are data

Preserve the exact unit received from OHIF.

Never sum unlike units.

**[VERIFIED]** `node_modules/@cornerstonejs/tools/dist/esm/utilities/getCalibratedUnits.js:41-103` — `areaUnit` is:

- `'mm²'` when the image has pixel spacing, `'px²'` when it does not;
- the `²` is **U+00B2**, not ASCII `2`;
- when calibration is present a suffix is appended, e.g. `'mm² ERMF'`, `'cm² US Region'`, `'px² ECG Region'`.

The unit is therefore an **open string set**, not an enum. Group totals by the exact unit string. Do not normalize, do not map to a closed union, and do not blindly append `mm²`.

The host total calculation groups by unit, for example:

```text
mm²: 212.7
px²: 3480
```

If only one unit exists, the UI may show a single total.

### 10. Cleanup is mandatory — and the two sides differ

**[PDF** p.3 §5.5**]** *«Прибирання за собою. `removeEventListener`, відписки від `measurementService`, скасування «озброєного» стану **при unmount**»* — cleanup **on unmount**. Graded in the 15% code-quality block, which names *effect cleanup* explicitly.

**Host side — the requirement applies literally, no exceptions.** React components genuinely unmount. On unmount the host must:

- `window.removeEventListener('message', handler)` — the exact listener reference, not a fresh closure;
- clear the pre-ready command queue;
- reset armed/pending and correlation state;
- cancel any debounced/throttled callbacks.

Write these as the cleanup return of the effect that installed them. An effect that installs without a matching teardown is a defect in this task, not a style preference.

**Viewer side — no unmount hook exists, so document the strategy.** **[VERIFIED]** `platform/core/src/extensions/ExtensionManager.ts:53-54` exposes only `onModeEnter`/`onModeExit`; upstream itself subscribes in `preRegistration` and never unsubscribes (`extensions/default/src/init.ts:53-77`). The bridge therefore:

1. captures every `subscribe()` handle — **[VERIFIED]** `subscribe()` returns `{ unsubscribe }` (`platform/core/src/services/_shared/pubSubServiceInterface.ts:35-37`) — and every `window` listener in **one disposer**;
2. runs that disposer on `pagehide`/`beforeunload`, and exposes it for explicit invocation;
3. **guards installation with a module-level flag** so development hot reload cannot accumulate duplicate `message` listeners or duplicate measurement subscriptions;
4. clears armed and correlation state in the same disposer.

This is a platform-imposed deviation from the literal wording. Document it as such — do not present it as if the requirement did not apply. See `ARCHITECTURE.md` §8 and `docs/scoring-form/IMPLEMENTATION_NOTES.md` §7.

Examples:

- `window.removeEventListener('message', ...)`;
- OHIF `measurementService.subscribe(...).unsubscribe()`;
- clear bridge armed/correlation state;
- cancel debounced callbacks if any;
- dispose any task-specific listener when the relevant lifecycle ends.

If OHIF extension lifecycle differs from a React component lifecycle, document exactly when cleanup happens and why it is sufficient.

### 11. Keep OHIF changes isolated

**[VERIFIED]** the extension mechanism makes this easy — registration is declarative and an extension does **not** need to be a dependency of `platform/app`:

- `platform/app/pluginConfig.json` is the single registration point;
- `platform/app/.webpack/writePluginImportsFile.js:126-225` builds a `resolve.alias` from each declared package name to its workspace directory; an undeclared workspace package is ignored entirely;
- a minimal extension is just `package.json` (`"module": "src/index.tsx"`), `src/id.js`, `src/index.tsx` — **no per-extension webpack build is required**. Precedent: `extensions/test-extension/` has no `.webpack/` directory at all;
- no runtime validation of a mode's `extensionDependencies` exists, so the bridge does **not** need to be added to `modes/basic` or `modes/longitudinal`.

Prefer:

- one custom extension;
- extension registration/config;
- minimal workspace/package changes.

Avoid editing OHIF core, Cornerstone core, or generic OHIF services unless the extension mechanism cannot satisfy a requirement.

If a core edit appears necessary, stop and explain why before making it.

### 12. Keep UI intentionally simple

Native controls/basic CSS are enough.

Prioritize:

1. correctness;
2. architecture;
3. explainability;
4. deterministic startup;
5. documentation.

Do not spend task time on a design system.

## Shared protocol shape

Use the contract in `ARCHITECTURE.md` as the starting point.

The exact TypeScript may evolve during implementation, but protocol changes must be reflected in `ARCHITECTURE.md` in the same PR.

Do not add message types casually.

## Tool activation

Required tool:

```text
EllipticalROI
```

**[VERIFIED]** it is registered in the `default` tool group's `passive` list — `modes/basic/src/initToolGroups.ts:65`; the tool group id is the literal string `'default'` (`:312`).

Use the checked-out OHIF `commandsManager` / `toolbarService` API and the current command context. Do not bypass OHIF services through `window`.

**[VERIFIED]** available integration points:

| Purpose | API | Source |
|---|---|---|
| Activate as if the user clicked the toolbar (runs the command **and** refreshes toolbar state) | `toolbarService.recordInteraction('EllipticalROI', { refreshProps: { viewportId } })` | `platform/core/src/services/ToolBarService/ToolbarService.ts:226-289` |
| Lower-level activation | `commandsManager.runCommand('setToolActiveToolbar', { toolName }, 'CORNERSTONE')` then `toolbarService.refreshToolbarState({ viewportId })` | `extensions/cornerstone/src/commandsModule.ts:1199-1208`, `:2619` |
| Cancel an in-progress drawing | `commandsManager.runCommand('cancelMeasurement', {}, 'CORNERSTONE')` | `extensions/cornerstone/src/commandsModule.ts:317-322` |

**[PROPOSED]** prefer `recordInteraction` so the toolbar highlight stays in sync; a direct `setToolActive` call leaves the toolbar UI stale.

Activation success must be read back, not assumed — see principle 4a.

### Returning to the default interaction — decided

**[PDF** p.3 §4.3 step 6**]** *«інструмент у переглядачі вимикається сам (повертається Pan/дефолт)»*. The binding obligation is that the drawing tool **switches itself off**; "Pan/default" is a parenthetical offering two options, whose slash shows the author treats them as the same thing.

**[VERIFIED]** `modes/basic/src/initToolGroups.ts:20-37` — the `default` tool group's active **primary** tool is `WindowLevel`. `Pan` is bound to `MouseBindings.Auxiliary` (middle mouse button), not the primary button. So the assignment's **«дефолт»** branch is the accurate one here.

**Decision:** after a measurement completes, or after `DEACTIVATE_TOOL`, deactivate `EllipticalROI` and activate **`WindowLevel`**. This satisfies the requirement **through the default option**, not the Pan option — it is not a deviation from the assignment. Hold the target tool in **one named constant** so it can be changed live in seconds.

This replaces the earlier capture-and-restore design, which was rejected: if the user had another annotation tool active before pressing Activate (e.g. `Length`), restoring it would leave a *drawing* tool armed and violate «вимикається сам». Full rationale and the other rejected alternatives: `docs/scoring-form/IMPLEMENTATION_NOTES.md` §4.

`DEACTIVATE_TOOL` must cancel the bridge's armed state even if no annotation has been created, cancel any in-progress drawing, and restore `WindowLevel` the same way.

**[VERIFIED] edge case to handle:** `EllipticalROITool.cancel()` also fires `ANNOTATION_COMPLETED` (`node_modules/@cornerstonejs/tools/dist/esm/tools/annotation/EllipticalROITool.js:332`), so an Escape-cancelled partial ellipse can still produce a `MEASUREMENT_ADDED`.

## Measurement events

Required:

- subscribe to `MEASUREMENT_ADDED`.

Recommended optional star task after required scope:

- subscribe to `MEASUREMENT_UPDATED` and send `MEASUREMENT_UPDATED`.

Before forwarding an event, ensure it belongs to the bridge-managed annotation.

Ignore unrelated annotations created directly through the OHIF toolbar.

## Echo-loop rule

For any two-way feature, distinguish:

- local user intent;
- remote synchronization event.

Never respond to a remote synchronization event by blindly emitting the same command back.

For future two-way updates/deletes, use origin/source metadata or explicit reducer actions so remote events update local state without re-triggering outbound commands.

## Testing

**[PDF** p.5 §8**]** Project-wide tests are explicitly **not** wanted. *«Якщо хочете показати вміння — достатньо кількох юніт-тестів на логіку суми та на серіалізацію повідомлень»* — a few unit tests on the sum logic and on message serialization are enough.

| Test | Status |
|---|---|
| Total calculation groups by unit | **named by the PDF** |
| Protocol runtime guard / serialization round-trip | **named by the PDF** |
| Reducer ignores a stale `activationId` | **[OURS]** optional extra |
| Pre-ready queue flush ordering | **[OURS]** optional extra |

Write the two PDF-named tests. The two extras are worth having but must not crowd out the mandatory path — and must not be described as requirements.

Manual integration verification is still required with a real OHIF iframe.

**[VERIFIED]** the root Jest config only picks up `platform/*/jest.config.js` and `extensions/*/jest.config.js` (`jest.config.js:10-14`). A test placed in `packages/message-contract` will **not** run under the root `pnpm test`. Either colocate contract tests in the bridge extension (which then needs its own `jest.config.js`) or add a `packages/*` project glob. Decide this in the PR that adds the first test, not earlier.

### TypeScript checks — scoped, not repository-wide

**[VERIFIED]** a repository-wide typecheck is not achievable on this baseline and must not be used as a gate:

- `tsconfig.json:6` sets `emitDeclarationOnly: true`, so `tsc -p tsconfig.json --noEmit` fails immediately with `TS5053`;
- forcing it through (`--emitDeclarationOnly false --declaration false --noEmit`) reports **6,981 pre-existing `error TS` lines** in upstream OHIF code;
- there is **no** `typecheck` script anywhere in the repository;
- `tsconfig.json:33-39` `include` covers only `platform/**`, `extensions/**`, `modes/**`, `tests/**` — neither `apps/**` nor `packages/**`.

This is a limitation of the upstream baseline, **not** a relaxation of our standards. Our own code is held to a stricter bar than the surrounding repository:

- every package/app we add owns its own `tsconfig.json` with `strict: true` and `noEmit`;
- `apps/host-app` and `packages/message-contract` must typecheck **clean — zero errors** — via their own configs;
- `packages/message-contract` is additionally referenced from the root `tsconfig.json` `paths`/`include` so the bridge extension can import it with types;
- a PR is not done if any file we authored produces a type error.

Never "fix" a check by widening scope to include upstream errors, and never claim a repository-wide typecheck passed.

## Definition of done for required scope

Before calling the core task complete, verify manually:

1. clean clone/install works;
2. viewer opens a specific study URL;
3. host shows viewer iframe + form;
4. click Add Measurement three times;
5. activate row;
6. draw ellipse;
7. correct row receives value and unit;
8. `EllipticalROI` is deactivated automatically and `WindowLevel` is active again (the baseline default — not `Pan`);
9. repeat for at least three rows;
10. total updates correctly;
11. activate then cancel works;
12. activate while iframe is still loading does not lose the command;
13. wrong-origin messages are ignored;
14. unrelated OHIF measurement is not assigned to a row;
15. reload/startup produces no leaked duplicate listeners;
16. scoped typecheck of every app/package we added passes with zero errors, and `pnpm run build` (the viewer production build) still succeeds.

## Claude Code working style

For each requested PR:

1. inspect relevant existing files;
2. state the implementation plan in 5–10 bullets;
3. state any API uncertainty;
4. verify uncertain OHIF behavior against actual source before coding;
5. make the smallest coherent change;
6. run focused checks;
7. summarize:
   - files changed;
   - architectural decisions;
   - manual verification steps;
   - known limitations;
   - suggested PR title/body.

Do not hide uncertainty. If actual OHIF behavior contradicts these notes, stop, show the evidence from the checked-out source, and propose the smallest adjustment.
