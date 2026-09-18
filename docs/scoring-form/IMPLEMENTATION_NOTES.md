# Implementation Notes — Viewer + Scoring Form bridge

> Companion to the root `ARCHITECTURE.md`. That document is deliberately short and reviewer-oriented, as the assignment asks (`ASSIGNMENT.pdf` p.4 §7.2: *«Достатньо 1–2 сторінок, але по суті»*). This file holds the supporting evidence so nothing is lost.
>
> Everything here was read from the checked-out OHIF source at commit `1ec01348d` (OHIF `3.14.0-beta.29`) during a read-only audit performed before any feature code was written.

## Evidence labels

| Label | Meaning |
|---|---|
| **[VERIFIED]** | Read directly from the checked-out source; `file:line` given. Safe to build on. |
| **[PDF]** | An original requirement from `ASSIGNMENT.pdf`, with page reference. |
| **[OURS]** | Our own design decision. Not a requirement, not a fact about OHIF. |
| **[OPEN]** | Not yet confirmed against real runtime behavior. Must not be built on until decided. See §10. |

---

## 1. Baseline and install mechanics

### 1.1 Recorded baseline — [VERIFIED]

| Item | Value | Source |
|---|---|---|
| OHIF version | `3.14.0-beta.29` | `package.json` `version` |
| Baseline commit | `1ec01348d` | `git log` |
| Node | `24.15.0` | `.node-version`; `engines.node: >=24` |
| pnpm | `11.5.2` | `package.json` `packageManager` |
| Viewer dev port | `3000`, override with `OHIF_PORT` | `platform/app/.webpack/webpack.pwa.js:26` |
| Viewer dev command | `pnpm run dev` | `package.json` `scripts.dev` |
| Default data source | public AWS S3 static WADO, `defaultDataSourceName: 'ohif'` | `platform/app/public/config/dev.js:111-125` |
| Direct study route | `/viewer?StudyInstanceUIDs=...` | verified manually |
| `EllipticalROI` | present in the `default` tool group (`passive`), area in `mm²` | `modes/basic/src/initToolGroups.ts:65` |

The baseline is fixed. Do not re-select or move it.

### 1.2 Workspace settings that change how you install — [VERIFIED]

`pnpm-workspace.yaml`:

| Setting | Value | Consequence |
|---|---|---|
| `frozenLockfile` | `true` (line 17) | A plain `pnpm install` **fails** as soon as workspace globs or dependencies change. Use `pnpm run install:update-lockfile` (`package.json:32` → `pnpm install --no-frozen-lockfile`) and commit `pnpm-lock.yaml`. |
| `minimumReleaseAge` | `2880` (line 11, 48 h) | Packages published in the last 48 h are rejected at install time. Pin exact versions at least 48 h old. |
| `allowBuilds` | allowlist (lines 39-46) | Postinstall scripts are denied unless listed. `esbuild` is **not** listed. See §10 item 4. |
| `nodeLinker` | `hoisted` (line 7) | Flat tree; a single hoisted `react@18.3.1` at the repo root. **[OURS]** pin the host app to `react`/`react-dom` `18.3.1` to avoid hoist interference. |
| `verifyDepsBeforeRun` | `false` (line 20) | Stale installs are not detected for you. |

`pnpm-workspace.yaml:1-4` declares only `platform/*`, `extensions/*`, `modes/*`. `apps/*` and `packages/*` must be added; `extensions/*` already covers the bridge extension.

### 1.3 `CLAUDE.md` is generated — [VERIFIED]

`CLAUDE.md` is a symlink to the upstream OHIF `AGENTS.md`, recreated on every `pnpm install` by `preinstall.js:17-34`, and listed in `.gitignore`. Task content placed there is destroyed by the next install and never committed. Our instructions live in `TASK_INSTRUCTIONS.md`. Never modify `AGENTS.md` or `CLAUDE.md`.

---

## 2. Extension registration mechanism — [VERIFIED]

Registration is declarative, and an extension does **not** need to be a dependency of `platform/app`:

- `platform/app/pluginConfig.json` is the single registration point.
- `platform/app/.webpack/writePluginImportsFile.js:126-225` builds a `resolve.alias` (`<pkgName>$ → <workspaceDir>`) for every plugin declared there. A workspace package **not** declared in `pluginConfig.json` is ignored entirely — so adding `apps/*` / `packages/*` workspace globs cannot alter the viewer build.
- Generated `platform/app/src/pluginImports.js` (gitignored) → `platform/app/src/index.js:18` → `appInit.js:93` → `appInit.js:123` `extensionManager.registerExtensions(...)`.
- A minimal extension is `package.json` with `"module": "src/index.tsx"`, `src/id.js`, and `src/index.tsx` exporting `{ id, preRegistration }`. **No per-extension webpack build is required** — precedent: `extensions/test-extension/` has no `.webpack/` directory at all.
- No runtime validation of a mode's `extensionDependencies` exists, so the bridge does **not** need adding to `modes/basic` or `modes/longitudinal`.

`preRegistration` signature — `platform/core/src/extensions/ExtensionManager.ts:276-286`:

```ts
preRegistration({ servicesManager, serviceProvidersManager, commandsManager,
                  hotkeysManager, extensionManager, appConfig, configuration })
```

Awaited, sequential in `pluginConfig.json` order. Note `peerImport` appears on the params type (`:34`) but is **not** passed — do not rely on it.

**[OURS]** list the bridge **last** in `pluginConfig.json.extensions`, because `toolGroupService` is registered inside the cornerstone extension's own `preRegistration` (`extensions/cornerstone/src/index.tsx:210-224`) and therefore does not exist during an earlier extension's `preRegistration`. Resolve services and commands lazily at message-handling time rather than capturing them at registration time.

---

## 3. Viewer readiness

### 3.1 The readiness signal — [VERIFIED]

- `ViewportGridService.EVENTS.VIEWPORTS_READY` — `platform/core/src/services/ViewportGridService/ViewportGridService.ts:14`, broadcast by `publishViewportsReady()` (`:139-141`).
- Published from `platform/app/src/components/ViewportGrid.tsx:143-150`, only when `getGridViewportsReady()` is true **and** the layout hash changed.
- It can therefore fire **more than once** (layout changes) — `VIEWER_READY` emission must be idempotent.
- Upstream precedent for subscribing from `preRegistration`: `extensions/default/src/init.ts:53-77`.

### 3.2 Activation fails silently — [VERIFIED]

`extensions/cornerstone/src/commandsModule.ts:1214-1228`:

```js
const { viewports } = viewportGridService.getState();
if (!viewports.size) return;
const toolGroup = toolGroupService.getToolGroup(toolGroupId);
if (!toolGroup) return;
if (!toolGroup?.hasTool(toolName)) return;
```

Three silent early returns. And `platform/core/src/classes/CommandsManager.ts:153-178` — `runCommand` returns `undefined` on success, on a missing command, and on each early return. **The return value carries no success information.**

This is the concrete mechanism behind a "lost Activate". The bridge must **read back** the real state after issuing activation (confirm the tool group's active primary tool is `EllipticalROI`) and treat a mismatch as a failure rather than arming the row.

---

## 4. Tool activation and restoration

### 4.1 The baseline default primary tool is `WindowLevel`, not `Pan` — [VERIFIED]

`modes/basic/src/initToolGroups.ts:20-37` — in the `default` tool group (id is the literal string `'default'`, `:312`):

| Tool | Binding |
|---|---|
| `WindowLevel` | **`MouseBindings.Primary`** — the default primary interaction |
| `Pan` | `MouseBindings.Auxiliary` (middle button) |
| `Zoom` | `MouseBindings.Secondary` |
| `StackScroll` | `MouseBindings.Wheel` |
| `EllipticalROI` | in the `passive` list (`:65`) — not bound until activated |

### 4.2 How this maps onto the assignment's wording

**[PDF]** p.3 §4.3 step 6: *«інструмент у переглядачі вимикається сам (повертається Pan/дефолт)»* — "the tool in the viewer switches itself off (returns to Pan/default)".

Clause analysis:

- **«вимикається сам»** is the binding obligation: the drawing tool must deactivate by itself, with no user action.
- **«(повертається Pan/дефолт)»** is a parenthetical gloss. The slash shows the author treats "Pan" and "default" as interchangeable, i.e. assumes OHIF's default primary tool *is* Pan.

On this baseline the default primary tool is `WindowLevel`, so the assignment's **«дефолт»** branch is the accurate one. The chosen behavior (§4.3) satisfies the requirement through that branch — it is not a deviation from the assignment.

### 4.3 Chosen behavior — [OURS], decided

On `MEASUREMENT_ADDED` or `DEACTIVATE_TOOL`, the bridge:

1. deactivates `EllipticalROI` (the obligation);
2. activates `WindowLevel`, the verified baseline default primary tool.

The target tool is held in **one named constant** in the bridge, so it can be changed in seconds — which also makes the assignment's live-change exercise (p.5 §9) cheap to demonstrate.

Alternatives considered and rejected:

| Alternative | Why rejected |
|---|---|
| Capture the previously active primary tool and restore it | Was the earlier draft. **Rejected:** if the user had another annotation tool active before pressing Activate (e.g. `Length`), restoring it leaves a *drawing* tool armed, which violates «інструмент вимикається сам». Also adds state for no user-visible benefit. |
| Always activate `Pan` | Matches the assignment's literal first word, but contradicts the verified baseline default and would be a behavior the viewer never otherwise has. |
| `toolGroup.getPrevActivePrimaryToolName()` | **[VERIFIED]** exists at `node_modules/@cornerstonejs/tools/dist/esm/store/ToolGroupManager/ToolGroup.js:382`, but it is Cornerstone-internal state we do not control, and it inherits the same "previous tool was an annotation tool" flaw. |

### 4.4 Integration points — [VERIFIED]

| Purpose | API | Source |
|---|---|---|
| Activate, and refresh toolbar highlight, as if the toolbar was clicked | `toolbarService.recordInteraction(toolName, { refreshProps: { viewportId } })` | `platform/core/src/services/ToolBarService/ToolbarService.ts:226-289` |
| The API the assignment names explicitly | `commandsManager.runCommand('setToolActive', ...)` | **[PDF]** p.6 §11; implementation at `extensions/cornerstone/src/commandsModule.ts:1209-1243` |
| Toolbar-aware variant, fans out over tool groups | `commandsManager.runCommand('setToolActiveToolbar', { toolName }, 'CORNERSTONE')` | `extensions/cornerstone/src/commandsModule.ts:1199-1208`, `:2619` |
| Cancel an in-progress drawing | `commandsManager.runCommand('cancelMeasurement', {}, 'CORNERSTONE')` | `extensions/cornerstone/src/commandsModule.ts:317-322` |

Commands module `defaultContext` is `'CORNERSTONE'` (end of `extensions/cornerstone/src/commandsModule.ts`). Passing the context explicitly is deterministic; `getCommand` otherwise searches all created contexts (`platform/core/src/classes/CommandsManager.ts:131-144`).

See §10 item 2 for the open choice between `setToolActiveToolbar` and `recordInteraction`.

### 4.5 Cancel still completes the annotation — [VERIFIED]

`node_modules/@cornerstonejs/tools/dist/esm/tools/annotation/EllipticalROITool.js:332` — `cancel()` also calls `triggerAnnotationCompleted(annotation)`. An Escape-cancelled partial ellipse can therefore still produce a `MEASUREMENT_ADDED`. The bridge must tolerate this.

---

## 5. Measurement data and event timing

### 5.1 Verified structure — [VERIFIED]

`extensions/cornerstone/src/utils/measurementServiceMappings/EllipticalROI.ts:61-81` — the OHIF measurement object has **no top-level `area`**:

```text
uid          // === Cornerstone annotationUID (initMeasurementService.ts:256)
toolName     // 'EllipticalROI'
type         // 'value_type::ellipse'
data         // === annotation.data.cachedStats, keyed by Cornerstone targetId:
             //    { 'imageId:<imageId>': { area, areaUnit, mean, stdDev,
             //      max, min, Modality, modalityUnit } }
displayText  // { primary: string[], secondary: string[] }
displaySetInstanceUID, referenceSeriesUID, referenceStudyUID, SOPInstanceUID,
FrameOfReferenceUID, referencedImageId, frameNumber, points, textBox, label,
metadata, getReport()
```

Area is at `Object.values(measurement.data)[0]?.area`; unit at `.areaUnit`.

### 5.2 Verified event timing — [VERIFIED]

`MEASUREMENT_ADDED` fires on drawing **completion**, not on first appearance:

- `extensions/cornerstone/src/initMeasurementService.ts:340-341` wires both `ANNOTATION_ADDED` and `ANNOTATION_COMPLETED` to the same handler;
- `platform/core/src/services/MeasurementService/MeasurementService.ts:541-575` broadcasts `MEASUREMENT_ADDED` only when a previous entry already exists and `isUpdate === false`. The `ANNOTATION_ADDED` pass stores silently ("Measurement started").

Payload is `{ source, measurement }`. `source.name === CORNERSTONE_3D_TOOLS_SOURCE_NAME` for tool-drawn annotations — a useful extra filter.

Event names — `MeasurementService.ts:71-83`: `MEASUREMENT_ADDED`, `MEASUREMENT_UPDATED`, `RAW_MEASUREMENT_ADDED`, `MEASUREMENT_REMOVED`, `MEASUREMENTS_CLEARED`, `JUMP_TO_MEASUREMENT`, `INTERNAL_MEASUREMENT_UPDATED`.

`subscribe()` returns `{ unsubscribe }` — `platform/core/src/services/_shared/pubSubServiceInterface.ts:35-37`.

### 5.3 ⚠ `cachedStats` timing — [OPEN], blocks PR 4

`cachedStats` is **not** computed on mouse-up. It is computed inside the Cornerstone render pass, and updates are throttled:

- **[VERIFIED]** `node_modules/@cornerstonejs/tools/dist/esm/tools/annotation/EllipticalROITool.js:408-421` — stats computed in `renderAnnotation`;
- **[VERIFIED]** `:606` — `_throttledCalculateCachedStats`, 100 ms, trailing;
- **[VERIFIED]** `:186` — `triggerAnnotationCompleted` fires from `_endCallback` (mouse-up), immediately after the render trigger.

Consequences — the first is structural and certain, the other two are plausible from the source but **unmeasured**:

1. `measurement.data` is a **live reference** to `cachedStats` and keeps mutating after the event fires. *(certain)*
2. A very fast click-drag-release may deliver `{ area: null, areaUnit: null }`. *(unmeasured)*
3. Otherwise the area may be up to ~100 ms stale — not the final geometry. *(unmeasured)*

**Required procedure before choosing a mitigation:**

1. log one real `MEASUREMENT_ADDED` plus the following `MEASUREMENT_UPDATED` for a **slow** draw;
2. repeat for a **fast** click-drag-release;
3. record both payloads and whether `area` was finite and final;
4. only then select a mitigation and record it here with the evidence.

Candidate mitigations — **none selected**:

| Candidate | Trade-off |
|---|---|
| Adapter returns `null` on non-finite area; bridge defers the host message until the first `MEASUREMENT_UPDATED` for that `uid` | Correct value, but delays the host update and complicates armed-state teardown |
| Re-read the same `cachedStats` reference on the next animation frame | Cheap, keeps a single message, but relies on frame timing |
| Always wait for one `MEASUREMENT_UPDATED` before emitting | Simplest to reason about; fails if no update event ever arrives |

### 5.4 Adapter contract — [OURS]

```ts
function toBridgeArea(measurement): BridgeMeasurementValue | null
```

- verify the tool/measurement is `EllipticalROI`;
- extract a **finite** numeric area, return `null` otherwise;
- extract the area unit as an exact string;
- copy primitives out — never forward the live `cachedStats` reference across `postMessage`;
- return `null` for unsupported, malformed or not-yet-computed data.

---

## 6. Units are an open string set — [VERIFIED]

`node_modules/@cornerstonejs/tools/dist/esm/utilities/getCalibratedUnits.js:41-103`:

- `areaUnit` is `'mm²'` when the image has pixel spacing, `'px²'` when it does not;
- the `²` character is **U+00B2**, not ASCII `2`;
- when calibration is present a suffix is appended: `'mm² ERMF'`, `'cm² US Region'`, `'px² ECG Region'`;
- the `UNIT_MAPPING` table also yields `cm`, `dB`, `percent`, `seconds`, `hertz`, `degrees`, `mV`.

So the unit is an **open string set**, not a closed union. `Record<string, number>` keyed by the exact unit string is the right model, and typing `unit` as `string` at the protocol boundary is deliberate rather than lazy.

Unit aliases must **not** be normalized: `'mm²'` and `'mm² ERMF'` have genuinely different provenance, and collapsing them would silently merge unlike measurements — exactly what **[PDF]** p.3 §5.6 forbids.

`getDisplayUnit` (`extensions/cornerstone/src/utils/measurementServiceMappings/utils/getDisplayUnit.js`) is only a null-guard: `unit == null ? '' : unit`.

---

## 7. Lifecycle and cleanup

**[PDF]** p.3 §5.5 requires cleanup **«при unmount»** (on unmount): `removeEventListener`, `measurementService` unsubscribes, and clearing the armed state.

### 7.1 Host side — the requirement applies literally

React components genuinely unmount. `removeEventListener`, queue clearing and armed/correlation state reset on unmount are straightforwardly required and must be implemented as written. Code quality is 15% of the grade and names *effect cleanup* explicitly (**[PDF]** p.6 §10).

### 7.2 Viewer side — no unmount hook exists — [VERIFIED]

`ExtensionManager` exposes only `onModeEnter` / `onModeExit` as lifecycle hooks (`platform/core/src/extensions/ExtensionManager.ts:53-54`). There is no per-extension teardown equivalent to a React unmount, and upstream relies on that: `extensions/default/src/init.ts:53-77` subscribes to `ViewportGridService` events inside `preRegistration` and never unsubscribes.

**[OURS] documented strategy** — this is a deviation from the literal wording, made necessary by the platform, not a dismissal of the requirement:

1. every `subscribe()` handle and `window` listener is captured in a single disposer;
2. the disposer runs on `window` `pagehide`/`beforeunload` and is exposed for explicit invocation;
3. installation is **guarded by a module-level flag** so development hot reload cannot accumulate duplicate `message` listeners or duplicate measurement subscriptions;
4. armed and correlation state is cleared by the same disposer.

---

## 8. Iframe embeddability — [VERIFIED]

The OHIF dev server can be embedded cross-origin as configured:

- no `X-Frame-Options`, CSP or COOP/COEP headers are emitted (`.webpack/webpack.base.js`, `platform/app/.webpack/webpack.pwa.js:193-236`); the CSP reference at `platform/app/public/html-templates/index.html:5` is a comment only;
- nothing registers a service worker — `platform/app/src/service-worker.js` only *unregisters* existing ones;
- `showWarningMessageForCrossOrigin` is set in `platform/app/public/config/dev.js:34` and declared in `platform/core/src/types/AppTypes.ts:213`, but is **read nowhere in the source** — dead config, so no cross-origin modal will appear inside the iframe.

**[OURS]** set `OHIF_OPEN=false` for the viewer dev server so it does not auto-open a second browser tab alongside the host (`platform/app/.webpack/webpack.pwa.js:32`).

Ports: viewer `3000` via `OHIF_PORT` (`webpack.pwa.js:26`); host `5173` with `strictPort: true` **[OURS]**, so a clash fails loudly instead of silently moving the origin and breaking origin validation. `playwright.config.ts:52` uses `3335` for e2e — unrelated to dev.

---

## 9. Test and typecheck constraints

### 9.1 A repository-wide typecheck is not achievable — [VERIFIED]

- `tsconfig.json:6` sets `emitDeclarationOnly: true`, so `tsc -p tsconfig.json --noEmit` fails immediately with `TS5053`;
- forcing it through (`--emitDeclarationOnly false --declaration false --noEmit`) reports **6,981 pre-existing `error TS` lines** in upstream OHIF code;
- there is **no** `typecheck` script anywhere in the repository;
- `tsconfig.json:33-39` `include` covers only `platform/**`, `extensions/**`, `modes/**`, `tests/**` — neither `apps/**` nor `packages/**`.

This is an upstream limitation, **not** a relaxation of our standard. Our own code is held to a stricter bar: per-package `tsconfig.json` with `strict: true` and `noEmit: true`, **zero** errors. Never widen scope to swallow upstream errors, and never report a scoped pass as repository-wide.

### 9.2 Jest project globs — [VERIFIED]

`jest.config.js:10-14` collects only `platform/*/jest.config.js` and `extensions/*/jest.config.js`. A test placed in `packages/message-contract` will **not** run under the root `pnpm test`. See §10 item 5.

### 9.3 Test scope per the assignment

**[PDF]** p.5 §8: project-wide tests are explicitly **not** wanted. If you want to show skill, *«достатньо кількох юніт-тестів на логіку суми та на серіалізацію повідомлень»* — a few unit tests on the **sum logic** and on **message serialization** are enough.

| Test | Status |
|---|---|
| Totals grouped by unit | **[PDF]** named |
| Message guard / serialization round-trip | **[PDF]** named |
| Reducer ignores a stale `activationId` | **[OURS]** optional extra |
| Pre-ready command queue ordering | **[OURS]** optional extra |

---

## 10. Open items — [OPEN]

None of these may be silently resolved. Resolving one means: gather the stated evidence, decide, record the decision and evidence in `ARCHITECTURE.md` → "Accepted Decisions", and say so in the PR body.

| # | Question | Target PR | Evidence needed to close |
|---|---|---|---|
| 1 | **`cachedStats` timing** — is `area` finite and final at `MEASUREMENT_ADDED`? How often is it `null` or stale? | **PR 4** | Logged `MEASUREMENT_ADDED` + following `MEASUREMENT_UPDATED` for a slow draw and a fast click-drag-release (§5.3) |
| 2 | **Activation API** — `commandsManager.runCommand('setToolActiveToolbar', …)` (the assignment names `setToolActive`, p.6 §11) or `toolbarService.recordInteraction` (keeps the toolbar highlight in sync)? | **PR 3** | A decision, not a source question. Whichever is chosen, the read-back verification of §3.2 applies. Current lean: the `commandsManager` path, because it is the API the assignment names and `setToolActiveToolbar` already refreshes toolbar state. |
| 3 | **Activation-failure reporting** — how does a failed activation reach the host? Retry after the next `VIEWPORTS_READY`, a new `ACTIVATION_FAILED` message, or leave the row `waiting`? | **PR 3** | A protocol decision. Adding a message type is a deliberate contract change and must be recorded in the message table. |
| 4 | **Readiness fallback** — `VIEWPORTS_READY` never fires if the study or hanging protocol fails, so `VIEWER_READY` would never be sent. Timeout, secondary signal, or explicit error message? | **PR 2** | Observe a deliberately broken `StudyInstanceUIDs` in the iframe |
| 5 | **Contract test location** — `packages/*` is outside the root Jest project globs. Colocate contract tests in the bridge extension (needs its own `jest.config.js`) or add a `packages/*` project glob? | **PR 5** (first test PR) | Decide when the first test is written (§9.2) |
| 6 | **`esbuild` build scripts** — does the Vite host app need `esbuild: true` in `pnpm-workspace.yaml` `allowBuilds`? | **PR 1** | The first `pnpm run install:update-lockfile` plus a host dev-server start. Do not pre-emptively edit the allowlist; if needed, add it with a comment explaining why. |

Closed during documentation finalization:

| Question | Resolution |
|---|---|
| Which tool to restore after a measurement | Deactivate `EllipticalROI`, activate `WindowLevel` (§4.3). Replaces the earlier capture-and-restore design, which could leave another annotation tool armed. |
| `ARCHITECTURE.md` length vs the assignment's "1–2 pages" | `ARCHITECTURE.md` kept concise and reviewer-oriented; supporting evidence moved to this file. |
| Role wording | Aligned with `ASSIGNMENT.pdf` p.1: *Frontend Developer (React / TypeScript)*. |

---

## 11. Known-stale upstream documentation

The upstream `AGENTS.md` (and its `CLAUDE.md` symlink) is authoritative for OHIF conventions but contains claims that do **not** match this checkout. **Do not modify those files** — just do not trust these points:

| `AGENTS.md` claim | Reality at `1ec01348d` |
|---|---|
| "Webpack 5: Module federation for dynamic extension loading" | The build is **rspack 2** (`platform/app/package.json:28`). There is no module federation; extensions are wired via `pluginConfig.json` + `resolve.alias` + dynamic `import()`. |
| "Extensions are self-contained with their own webpack builds" | Not required. `extensions/test-extension/` has no `.webpack/` directory; the app resolves the package `module` field through the generated alias. |
| Extension `cornerstone-dicom-pmp` | The directory is `extensions/cornerstone-dicom-pmap`. |

---

## 12. Source of requirements

`ASSIGNMENT.pdf` (repo root) is the primary requirements source. It is Ukrainian (`test-task-microfrontend-viewer-form.uk.docx`, Skia/Google Docs renderer), 6 pages.

**Not tracked in Git** — it is a supplied artifact, not project output.

One coverage gap in the requirements extraction: page 2 embeds a 1960×880 figure inside §3 *«Архітектура, яку треба побудувати»* which was **not read** (no PDF renderer available in the dev environment). The surrounding §3 text describes the same two-app / two-port / `postMessage` topology, so the figure is most likely illustrative, but this is unconfirmed. To close it: `brew install poppler && pdftoppm -r 150 -png -f 2 -l 2 ASSIGNMENT.pdf /tmp/assignment-p2`.