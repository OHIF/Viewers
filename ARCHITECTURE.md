# ARCHITECTURE.md — Viewer + Scoring Form

Bridge between an OHIF Viewer fork in an iframe and a React scoring form on a different origin, communicating over `window.postMessage`.

> **Status.** Design document. At the current commit the repository contains documentation only — no host app, bridge extension, or contract package exists yet. Behaviour described in the present tense is the **agreed design**, not shipped code; see `docs/scoring-form/README.md` for what actually runs today.
>
> **Scope.** Deliberately short, as the assignment asks (`ASSIGNMENT.pdf` p.4 §7.2 — *"1–2 pages is enough, but substantive"*). Supporting evidence, `file:line` citations and open technical questions live in **`docs/scoring-form/IMPLEMENTATION_NOTES.md`**.
>
> **Labels.** **[PDF]** = original requirement, with page ref · **[VERIFIED]** = read from OHIF source at `1ec01348d` · **[OURS]** = our decision · **[OPEN]** = undecided, see Known Limitations.
>
> Update this document in the same PR as any code that changes a documented contract or decision.

## 1. Baseline

| Item | Value |
|---|---|
| OHIF | `3.14.0-beta.29` @ commit `1ec01348d` |
| Node / pnpm | `24.15.0` / `11.5.2` |
| Viewer origin | `http://localhost:3000` (`OHIF_PORT`) |
| Host origin | `http://localhost:5173` |
| Data source | public DICOMweb shipped with OHIF **[PDF** p.2 §4.1**]** |
| Tool | `EllipticalROI` **[PDF** p.3 §4.3**]** |

## 2. Topology

```text
Browser tab
┌──────────────────────────────────────────────────────────────────────┐
│  host-app   http://localhost:5173        (React + TypeScript, Vite)  │
│                                                                      │
│  ┌──────────────────────────────┐   ┌─────────────────────────────┐   │
│  │ <iframe>  flexible,          │   │ Scoring form                │   │
│  │           full height        │   │                             │   │
│  │ ┌──────────────────────────┐ │   │  row A  waiting  [Activate] │   │
│  │ │ OHIF Viewer              │ │   │  row B  drawing…            │   │
│  │ │ localhost:3000/viewer    │ │   │  row C  ready   124.5 mm²   │   │
│  │ │   ?StudyInstanceUIDs=…   │ │   │  ─────────────────────────  │   │
│  │ │                          │ │   │  Total   mm²: 124.5         │   │
│  │ │ ┌──────────────────────┐ │ │   │          px²: 3480          │   │
│  │ │ │ scoring-form-bridge  │ │ │   └─────────────────────────────┘   │
│  │ │ │ (OHIF extension)     │ │ │              ▲        │            │
│  │ │ └──────────────────────┘ │ │              │        │            │
│  │ └──────────────────────────┘ │              │        │            │
│  └──────────────────────────────┘              │        │            │
│                  ▲    │                        │        │            │
└──────────────────┼────┼────────────────────────┼────────┼────────────┘
                   │    │                        │        │
     VIEWER_READY  │    │ ACTIVATE_TOOL          │        │
 MEASUREMENT_ADDED │    │ DEACTIVATE_TOOL        └────────┘
MEASUREMENT_UPDATED│    ▼                      reducer state
                   └──── window.postMessage ────
                    exact targetOrigin, never "*"
```

The bridge is an **OHIF extension**, not parent-window poking: OHIF internals are unreachable from outside the iframe **[PDF** p.2 §3**]**. The extension receives `servicesManager` and `commandsManager` in `preRegistration` and owns all OHIF-facing work.

## 3. Responsibility boundaries

| Host app owns | Viewer bridge owns | Shared contract owns |
|---|---|---|
| form rows, `rowId` | OHIF services/commands integration | protocol name + `version` |
| per-activation `activationId` | tool activation / deactivation | message type constants |
| user intent (activate / cancel) | the armed `{ rowId, activationId }` | discriminated TS unions |
| pre-ready command queue | filtering OHIF measurement events | runtime guards |
| row UI state, totals | OHIF → bridge value adaptation | `BridgeMeasurementValue` |
| `rowId → measurementId` | `measurementId → rowId` | |

The host never sees a Cornerstone or OHIF measurement object.

## 4. Identity and correlation

> **[PDF** p.3 §5.3**]** *«Це головне архітектурне рішення завдання»* — **this is the main architectural decision of the task.** Graded under "Bridge architecture" (25%).

| ID | Owner | Lifetime | Why that owner |
|---|---|---|---|
| `rowId` | **host**, `crypto.randomUUID()` on row creation | the row | The host owns the form entity. The viewer must never invent a form identity. |
| `activationId` | **host**, new value on every Activate press | one activation attempt | **[OURS]** Guards against a stale measurement event being accepted after a cancel or re-activate race. |
| `measurementId` | **OHIF / Cornerstone** (the annotation UID) | the annotation | OHIF owns the annotation entity. The host must never invent a native OHIF identity. |

Neither side invents the other side's native ID. The mapping is established once, at `MEASUREMENT_ADDED`:

```text
host: rowId=R1, activationId=A1
  │ ACTIVATE_TOOL { R1, A1 }
  ▼
bridge arms { R1, A1 } ──▶ user draws ──▶ OHIF annotationUID = M1
  │ MEASUREMENT_ADDED { R1, A1, M1, … }
  ▼
host accepts only if the row's current activationId === A1
  └─▶ stores R1 ↔ M1          bridge stores M1 → R1 (for later updates)
```

A stale event carrying a superseded `activationId` is dropped by the host. An annotation drawn from the OHIF toolbar while nothing is armed is never assigned to a row.

## 5. Message contract

Names are fixed by the assignment; payloads are ours **[PDF** p.3 §4.4**]**.

### Envelope

Every message is wrapped:

```ts
type BridgeEnvelope<TType extends string, TPayload> = {
  protocol: 'viewer-scoring-bridge';  // ignore unrelated postMessage traffic
  version: 1;                         // [PDF] required
  sender: 'host' | 'viewer';           // direction validation + debugging
  type: TType;
  messageId: string;                   // diagnostics / log correlation
  sentAt: number;                      // diagnostic ONLY — never used for ordering
  payload: TPayload;
};

type BridgeMeasurementValue = {
  kind: 'area';
  value: number;
  unit: string;   // exact string from OHIF — see §7
};
```

Ordering relies on the browser's `postMessage` delivery order between the same two windows; correctness relies on state and IDs, never on `sentAt`.

### Consolidated message table

| Type | Direction | Payload | Sent when | Receiver effect |
|---|---|---|---|---|
| `VIEWER_READY` | viewer → host | `{ viewerInstanceId: string }` | Bridge installed **and** a viewport/tool group can accept a drawing command. Emitted **once** — the underlying OHIF event can fire repeatedly (§6). | Host marks viewer ready, flushes the queued commands in order. |
| `ACTIVATE_TOOL` | host → viewer | `{ rowId: string; activationId: string; toolName: SupportedTool }` | User presses **Activate** on a row. Queued if the viewer is not ready. | Bridge arms `{ rowId, activationId }`, activates the tool, then **verifies activation took effect** (§6). Row → `drawing`. |
| `DEACTIVATE_TOOL` | host → viewer | `{ rowId: string; activationId: string }` | User cancels an activation, or activates a different row while one is armed. | Bridge clears armed state if it matches, cancels any in-progress drawing, restores the default tool (§6). Emits **no** measurement event. |
| `MEASUREMENT_ADDED` | viewer → host | `{ rowId: string; activationId: string; measurementId: string; toolName: SupportedTool; measurement: BridgeMeasurementValue }` | An `EllipticalROI` completes **while the bridge is armed**. | Host stores value + unit + `measurementId` and sets the row `ready`, **only if** `activationId` is still current. Totals recalculate. |
| `MEASUREMENT_UPDATED` | viewer → host | `{ rowId: string; measurementId: string; measurement: BridgeMeasurementValue }` | **Optional — star task 5.1 only.** An already-correlated annotation is edited. | Host updates the row value and totals. Emits **nothing** back (§9). |

`toolName` is typed as a `SupportedTool` union rather than the literal `'EllipticalROI'`, so swapping in `RectangleROI` is a one-line change — one of the assignment's live-change exercises **[PDF** p.5 §9**]**.

After sending `MEASUREMENT_ADDED` the bridge stores `measurementId → rowId`, clears its armed state, and restores the default tool (§6).

### Runtime validation

TypeScript does not cross a `postMessage` boundary, so both sides validate at runtime, in order: value is an object → `protocol` matches → `version === 1` → `sender` is the expected peer → `type` is known → payload fields have the expected primitive shapes. Anything failing is dropped silently (logged in development).

Small explicit guards in the shared package, no schema library — the protocol has five messages. If it grows across teams, Zod or JSON-Schema-generated types become worthwhile; that is a documented future step, not a present need.

## 6. Handshake, activation, and returning to the default tool

**Early commands.** The host installs its `message` listener **before** the iframe `src` is assigned, so an early `VIEWER_READY` cannot be missed; commands issued before readiness go to an in-memory FIFO and flush in order on `VIEWER_READY` **[PDF** p.3 §5.1 — the command must not be lost**]**.

**Exclusive activation.** Only one row may be armed. Activating row B while row A is armed cancels A first, so two rows can never both show `drawing`.

**Readiness means usable, not loaded.** **[VERIFIED]** `setToolActive` has three silent early returns (no viewports / no tool group / tool absent) and `runCommand` returns `undefined` either way — a completed activation call proves nothing. The bridge therefore **reads back** the tool group's active primary tool after activating and treats a mismatch as failure rather than arming the row. Details and citations: `docs/scoring-form/IMPLEMENTATION_NOTES.md` §3.

**Returning to the default interaction.** After a measurement completes, or after `DEACTIVATE_TOOL`, the bridge deactivates `EllipticalROI` and activates **`WindowLevel`**.

**[VERIFIED]** `WindowLevel` — not `Pan` — is the baseline's default primary-mouse tool; `Pan` is bound to the auxiliary (middle) button (`modes/basic/src/initToolGroups.ts:20-37`).

**[PDF** p.3 §4.3 step 6**]** requires *«інструмент у переглядачі вимикається сам (повертається Pan/дефолт)»* — "the tool switches itself off (returns to Pan/default)". The binding obligation is the automatic switch-off; "Pan/default" is a parenthetical offering two options, and its slash shows the author treats them as the same thing. Restoring `WindowLevel` **satisfies that requirement through the «дефолт» (default) option** — it is not a deviation. The target tool is a single named constant in the bridge, so it can be changed live in seconds. Rejected alternatives, including the capture-and-restore design this replaces: `docs/scoring-form/IMPLEMENTATION_NOTES.md` §4.

## 7. Units and totals

**[PDF** p.3 §5.6**]** area arrives in `mm²` or `px²` depending on DICOM pixel spacing; units must not be lost and unlike units must not be summed.

**[VERIFIED]** the unit is an **open string set**, not an enum: `'mm²'` / `'px²'` (with `²` = U+00B2), plus a calibration suffix when present (`'mm² ERMF'`, `'cm² US Region'`). Hence `unit: string` at the protocol boundary.

Totals are therefore grouped by the exact unit string:

```ts
Record<string, number>   // { 'mm²': 212.7, 'px²': 1480 }
```

Values are stored unformatted; formatting is presentation-only. Unit aliases are **not** normalized — `'mm²'` and `'mm² ERMF'` have different provenance, and collapsing them would silently merge unlike measurements. If only one unit is present the UI may show a single total. Evidence: `docs/scoring-form/IMPLEMENTATION_NOTES.md` §6.

## 8. Cleanup and lifecycle

**[PDF** p.3 §5.5**]** requires cleanup **on unmount**: `removeEventListener`, `measurementService` unsubscribes, clearing the armed state.

**Host — applies literally.** React components unmount, so on unmount the host removes its `message` listener, clears the queue, and resets armed/correlation state. No exceptions.

**Viewer — no unmount hook exists.** **[VERIFIED]** `ExtensionManager` exposes only `onModeEnter`/`onModeExit`, and upstream itself subscribes in `preRegistration` and never unsubscribes (`extensions/default/src/init.ts:53-77`). The bridge therefore: captures every `subscribe()` handle and listener in one disposer; runs it on `pagehide`/`beforeunload` and exposes it for explicit invocation; and **guards installation with a module-level flag** so hot reload cannot accumulate duplicate listeners or subscriptions. This is a platform-imposed deviation from the literal wording, documented rather than waved away. Details: `docs/scoring-form/IMPLEMENTATION_NOTES.md` §7.

## 9. Echo-loop prevention

**[PDF** p.3 §5.4**]** — conditional: *"if you implement star task 5.1"* (live update), ensure host → viewer → host does not ping-pong. The required one-way scope (command → event) cannot loop.

The rule for any two-way feature: **remote events update local state and never trigger an outbound command.** Reducer actions are named by origin — a remote-sourced action is a distinct action type from a local user intent — so "update the row" and "tell the viewer to change" can never be the same code path.

Worked example for a future two-way delete (star task 5.2):

```text
user clicks Delete in host → REMOVE_MEASUREMENT → viewer removes M1
  → OHIF emits MEASUREMENT_REMOVED → viewer sends MEASUREMENT_REMOVED
  → host reducer clears the row and STOPS. It must not re-send REMOVE_MEASUREMENT.
```

## 10. Accepted Decisions

*Required section per **[PDF** p.4 §7.2**]**.*

### 10.1 Who issues which ID

The host issues `rowId` and `activationId`; OHIF issues `measurementId` (the annotation UID); the correlation `rowId ↔ measurementId` is established once at `MEASUREMENT_ADDED` and stored on both sides (§4). **Rationale:** each side owns the identity of the entity it owns, so neither has to invent or guess a foreign ID; and `activationId` makes stale-event rejection a comparison rather than a guess. **If flipped** — host-issued measurement IDs — the bridge would have to map a host ID onto a Cornerstone annotation UID it does not control, and every OHIF-originated event (toolbar-drawn, deleted, restored annotations) would need a reverse lookup that can miss. That is the failure mode this split avoids.

### 10.2 How the handshake works

`VIEWER_READY` is emitted once, from the bridge, only when a viewport and tool group can actually accept a drawing command — not merely when the extension module executed. The host installs its listener before assigning the iframe `src`, so the one-shot message cannot be missed (§6).

### 10.3 What happens to commands that arrive too early

They are queued, not dropped. An in-memory FIFO holds outbound commands until `VIEWER_READY`, then flushes in order. Because activation is exclusive, the host's reducer still emits coherent transitions while queued: switching from row A to row B before readiness cancels A explicitly rather than leaving both `drawing` (§6).

### 10.4 How the echo loop is avoided

Remote events only ever update local state; outbound commands originate only from explicit local user intent. Reducer actions are separated by origin so the two cannot share a path (§9). For the mandatory scope the traffic is one-way and cannot loop.

### 10.5 One repository rather than two

The host app lives in the OHIF fork under `apps/host-app`, with the contract in `packages/message-contract`. **Rationale:** one clone for the reviewer, the TypeScript contract is physically shared rather than copied, and host+viewer changes land atomically in one PR. **Trade-off:** it enlarges the fork's surface and couples the host's tooling to OHIF's workspace. For a real product with independent release cadences, two repositories plus a published `@company/viewer-contract` package would be preferable. The assignment explicitly permits either, provided the choice is explained **[PDF** p.4 §7.1**]**.

### 10.6 Origin validation — required vs. added

**[PDF** p.3 §5.2**]** requires **`event.origin`** checks on both sides; a hardcoded origin in config is acceptable, absence is not. We implement that, and **[OURS]** additionally check `event.source`:

| Side | Required **[PDF]** | Added **[OURS]** | Send |
|---|---|---|---|
| Host | `event.origin === VIEWER_ORIGIN` | `event.source === iframe.contentWindow` | `iframe.contentWindow.postMessage(msg, VIEWER_ORIGIN)` |
| Viewer | `event.origin === HOST_ORIGIN` | `event.source === window.parent` | `window.parent.postMessage(msg, HOST_ORIGIN)` |

`targetOrigin` is never `'*'`. The `event.source` check is what makes two simultaneously open host tabs safe: both tabs share an origin, so origin alone cannot distinguish them, but each window pair is distinct. In production these origins come from runtime configuration rather than constants.

### 10.7 Tool restored after a measurement

`WindowLevel`, the verified baseline default — satisfying the assignment's "Pan/default" through the *default* option (§6).

### 10.8 Form state model

React `useReducer`, not Redux or Zustand. One page, small state, explicit event-driven transitions, and stale-event handling that is easy to read and to explain live. Rows move `waiting → drawing → ready`; actions are explicit (`ADD_ROW`, `ACTIVATE_REQUESTED`, `ACTIVATION_QUEUED`, `ACTIVATION_CANCELLED`, `MEASUREMENT_RECEIVED`, …) rather than scattered booleans.

### 10.9 Why `postMessage`

It is the mechanism for cross-origin parent/iframe communication, needs no backend, and makes the trust boundary explicit via `targetOrigin` plus origin checks. Same-origin would technically allow direct object access, but that couples two independently developed apps to each other's internals — a message contract stays worthwhile even then. `BroadcastChannel` suits same-origin tab fan-out rather than targeted parent↔child request/response; a WebSocket or backend adds infrastructure for two contexts on one client; Module Federation solves code composition, not this runtime integration.

## 11. Known limitations and open items

Recorded honestly rather than hidden. Each is tracked with its target PR in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §10, and each must become a decision in §10 above before submission.

| **[OPEN]** item | Target PR |
|---|---|
| `cachedStats` timing — whether the area is final at `MEASUREMENT_ADDED`, or `null`/stale for a fast draw. Needs a logged real event before a mitigation is chosen. | PR 4 |
| Activation API — the `commandsManager` path the assignment names vs. `toolbarService.recordInteraction`, which also refreshes the toolbar highlight. | PR 3 |
| How an activation failure is reported to the host (retry, a new message type, or leave the row `waiting`). | PR 3 |
| Readiness fallback when the study or hanging protocol fails and the OHIF readiness event never fires. | PR 2 |
| Whether the Vite host app needs `esbuild` added to `pnpm-workspace.yaml` `allowBuilds`. | PR 1 |
| Contract test location — `packages/*` sits outside the root Jest project globs. | PR 5 |

Accepted scope limits: one host page with one viewer iframe (multiple iframes would need a channel ID in the envelope); no acknowledgements, retries or idempotency keys; no state persistence across reload unless star task 5.6 is done; `MEASUREMENT_UPDATED` is delivered unthrottled on the assumption that a tiny form can absorb drag-rate updates — to be revisited if measured otherwise.

## 12. Further reading

| Document | Purpose |
|---|---|
| `docs/scoring-form/README.md` | How to run both applications; current status of each step |
| `docs/scoring-form/IMPLEMENTATION_NOTES.md` | Verified OHIF source findings with `file:line`, evidence, open items |
| `TASK.md` | Requirements extracted from `ASSIGNMENT.pdf`, with page references |
| `IMPLEMENTATION_PLAN.md` | PR-by-PR plan and acceptance criteria |
| `AI-USAGE.md` | How AI was used |