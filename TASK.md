# TASK.md — Source Requirements

This file is a concise implementation checklist derived from the supplied test-task PDF. It is not a replacement for the original PDF; when wording is ambiguous, preserve the PDF's intent and document the chosen interpretation in `ARCHITECTURE.md`.

Requirement text here is **left as the PDF states it**. Where the checked-out OHIF baseline contradicts the PDF's wording, an *Interpretation* note is added rather than rewriting the requirement.

Our working instructions are in `TASK_INSTRUCTIONS.md` (not `CLAUDE.md` — that is a generated symlink to upstream OHIF's `AGENTS.md`).

## Verified baseline

| Item | Value |
|---|---|
| OHIF version | `3.14.0-beta.29` |
| Baseline commit | `1ec01348d` |
| Node | `24.15.0` (`.node-version`) |
| pnpm | `11.5.2` (`package.json` `packageManager`) |
| Viewer dev port | `3000` (`OHIF_PORT`) |

Full baseline and workspace details: `TASK_INSTRUCTIONS.md` → "OHIF baseline — verified".

## Role and format (`ASSIGNMENT.pdf` p.1)

| Item | Value |
|---|---|
| Role | **Frontend Developer (React / TypeScript)** |
| Deadline | 5 working days |
| Submission | open repository + video demo + defence call (30–45 min) |

## Grading criteria (p.6 §10)

Recorded here because it governs where effort belongs.

| Block | What is judged | Weight |
|---|---|---|
| **Working scenario** | the mandatory part reproduces **from the README with no hints** | **25%** |
| **Bridge architecture** | contract, ID correlation, handshake, separation of responsibilities | **25%** |
| **Defence** | explaining decisions and making live changes on the call | **25%** |
| **Code quality** | typing, **effect cleanup**, structure, readability | **15%** |
| **Communication** | PRs, `ARCHITECTURE.md`, video demo | **10%** |

Star tasks add **up to +15%** on top, but **do not compensate for a failed "Defence" block.**

Two consequences worth stating: 25% depends on a clean-machine README run, so the install path must be exact (see "Submission requirements"); and the defence is the single largest block, so every decision must be explainable and cheap to change live.

## Goal

Build a minimal skeleton of a medical workflow with two independent applications:

- **viewer** — a local fork of OHIF Viewer;
- **host-app** — a React + TypeScript application containing:
  - an iframe with OHIF;
  - a scoring form.

The two applications run on different ports and communicate through `window.postMessage`.

The form asks the viewer to activate a measurement tool. The viewer returns the created measurement result.

## Required architecture

### Viewer

- Fork official OHIF Viewers.
- Run locally.
- Use the public/default DICOMweb source; no custom PACS is required.
- Support direct study URLs:
  - `/viewer?StudyInstanceUIDs=...`
- Add a custom OHIF extension that acts as the bridge.
- The bridge must use OHIF APIs from inside the extension.
- Do not attempt to reach OHIF internals from the parent window.

The supplied task specifically points to:

- `preRegistration`;
- `servicesManager`;
- `commandsManager`;
- `measurementService`;
- `commandsManager.runCommand(...)`.

### Host app

- React + TypeScript.
- Vite is recommended.
- One page.
- Left side: flexible full-height iframe.
- Right side: scoring-form panel.
- Host and viewer must use different ports/origins.

## Required user flow

1. Form has **Add measurement**.
2. Clicking it creates an empty row:
   - status: waiting;
   - button: Activate.
3. Clicking **Activate**:
   - sends `ACTIVATE_TOOL`;
   - activates `EllipticalROI`;
   - row enters drawing state.
4. User draws an ellipse in OHIF.
5. Viewer returns:
   - measured area;
   - measurement unit;
   - identifiers needed to correlate it to the correct form row.
6. Host updates the correct row:
   - value populated;
   - status ready.
7. Viewer returns to Pan/default interaction automatically.
8. Flow is repeatable for any number of rows.
9. Bottom of the form shows automatically recalculated total area.

> **Interpretation of step 7.** The PDF wording is *«інструмент у переглядачі вимикається сам (повертається Pan/дефолт)»* — the binding obligation is that the tool **switches itself off**; "Pan/default" is a parenthetical offering two options, and its slash shows the author treats them as equivalent.
>
> Verified: `Pan` is **not** the default primary tool on this baseline. `modes/basic/src/initToolGroups.ts:20-37` — the `default` tool group's active primary tool is `WindowLevel`; `Pan` is bound to the auxiliary (middle) mouse button.
>
> **Decision:** after a measurement completes or an activation is cancelled, the bridge deactivates `EllipticalROI` and activates **`WindowLevel`** — satisfying the requirement through the **«дефолт» (default)** option rather than the Pan option. The target tool is a single named constant so it can be changed live. Rationale and rejected alternatives: `ARCHITECTURE.md` §6 and §10.7, evidence in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §4.

## Required message types

| Direction | Type | Purpose |
|---|---|---|
| viewer -> host | `VIEWER_READY` | Viewer is ready to accept bridge commands |
| host -> viewer | `ACTIVATE_TOOL` | Activate tool for a specific form row |
| host -> viewer | `DEACTIVATE_TOOL` | Cancel pending drawing |
| viewer -> host | `MEASUREMENT_ADDED` | Measurement created; send value, unit, correlation data |
| viewer -> host | `MEASUREMENT_UPDATED` | Optional/star: live measurement update |

Protocol must include:

```text
version: 1
```

Payload structure is our responsibility and must be documented in `ARCHITECTURE.md`.

## Quality requirements

### Handshake

Host must not send commands to the viewer before `VIEWER_READY`.

If Activate is clicked while the iframe is loading, the command must not be lost.

### Origin checking

**Required (p.3 §5.2):** both `message` handlers must validate **`event.origin`**. A configured hard-coded local origin is acceptable. No origin validation is not acceptable.

**Our addition, not a PDF requirement:** we also validate `event.source` (`iframe.contentWindow` on the host, `window.parent` on the viewer). The PDF does not ask for it; we add it because origin alone cannot distinguish two host tabs that share an origin — which is one of the defence questions. See `ARCHITECTURE.md` §10.6 for the required-vs-added split.

### Correlation — the single most important architectural item

Every form row has its own ID.

Every OHIF annotation/measurement has its own ID.

The implementation must deliberately define:

- which side creates which ID;
- how the IDs are mapped;
- how a viewer event is assigned to the correct row.

> The PDF states directly (p.3 §5.3): **«Це головне архітектурне рішення завдання»** — *this is the main architectural decision of the task.* It is graded under "Bridge architecture" (25%), and the defence explicitly asks who issues the identifier, why that party, and **what breaks if the decision is flipped**. Our answer: `ARCHITECTURE.md` §4 and §10.1.

### No echo loop — conditional

> Conditional in the PDF (p.3 §5.4): **«Якщо ви реалізуєте зіркове завдання 5.1»** — *if you implement star task 5.1* (live update) — ensure that host → viewer → host updates do not create infinite ping-pong. **«Ми це перевіримо»** — they will check this.

The mandatory scope is one-way (command → event) and cannot loop. The requirement becomes live only with optional task 5.1 or 5.2; the loop-prevention rule is designed up front regardless, in `ARCHITECTURE.md` §9.

Any optional two-way synchronization must not create an infinite host -> viewer -> host loop.

### Cleanup — "on unmount"

The PDF wording (p.3 §5.5): *«Прибирання за собою. `removeEventListener`, відписки від `measurementService`, скасування «озброєного» стану **при unmount**»*.

Clean up, on unmount:

- browser message listeners;
- OHIF measurement subscriptions;
- armed/pending bridge state.

Two different lifetimes apply, so the requirement splits:

- **Host app** — React components genuinely unmount, so this applies literally and without exception. "Effect cleanup" is named in the 15% code-quality block.
- **Viewer extension** — verified: OHIF provides no per-extension unmount hook, and upstream itself subscribes in `preRegistration` and never unsubscribes. Our documented strategy (single disposer, run on page unload, installation guarded against hot-reload duplication) is in `ARCHITECTURE.md` §8 with evidence in `docs/scoring-form/IMPLEMENTATION_NOTES.md` §7. This is a platform-imposed deviation, documented rather than ignored.

### Units

Area may be physical area or pixel area depending on DICOM pixel spacing.

Preserve the unit.

Do not add unlike units into one total.

> **Verified.** `node_modules/@cornerstonejs/tools/dist/esm/utilities/getCalibratedUnits.js:41-103` — `areaUnit` is `'mm²'` with pixel spacing and `'px²'` without (`²` is U+00B2), plus a calibration suffix when present (`'mm² ERMF'`, `'cm² US Region'`, …). The unit is an open string set, not an enum. See `ARCHITECTURE.md` §14.

### TypeScript

Message types must be defined in one shared place for both applications, or an explicitly documented alternative must be used.

## Optional/star tasks (p.4 §6)

**All six are optional.** The PDF says to do them **«у порядку інтересу»** (in order of interest); one or two completed substantially affect the grade — **but only if the mandatory part is done well**. Star tasks add up to +15% and cannot offset a failed defence.

| # | Task (PDF wording) | Notes |
|---|---|---|
| 5.1 | **Live update** — user drags an ellipse vertex, the form value updates in real time and the sum recalculates | Enables the conditional echo-loop requirement |
| 5.2 | **Deletion, both ways** — a Delete button in the row removes the annotation in the viewer; and deleting the annotation in the viewer clears the row | Highest loop risk |
| 5.3 | **Focus** — clicking a form row highlights/scrolls to the corresponding annotation in the viewer | |
| 5.4 | **Second tool** — add a `Length` row type; **the sum of lengths is counted separately from the sum of areas** | Exercises the unit-grouping model |
| 5.5 | **Version on the viewport** — display the OHIF version **taken from `package.json` and injected at build time via the bundler config** in the corner of **every** viewport; **if a 2×2 grid is selected, the version must appear on all four** | Full requirement recorded because the detail is easy to under-deliver: it is build-time injection, not a runtime import, and it is per-viewport, not once per page |
| 5.6 | **State restoration** — after a page reload, the form and annotations are restored | |

**Our choice, not a PDF instruction:** if any star task is attempted, live update (5.1) goes first, because it reuses the measurement subscription already built for the mandatory path, demonstrates event-driven synchronization, and naturally exercises the echo-loop reasoning. Deletion (5.2) would come second as the stronger two-way demonstration but is more failure-prone.

## Out of scope (p.5 §8)

The PDF explicitly lists what **not** to build, so that time is not wasted:

- **no** authorisation, backend, database, or server-side persistence;
- **no** own PACS / DICOMweb server;
- **no** design work — *«сірої форми з нативними інпутами повністю достатньо»* (a grey form with native inputs is entirely sufficient);
- **no** project-wide test suite — see "Testing" below;
- **no** reworking of OHIF's own UI (panels, toolbar) — **except what the bridge itself requires**.

The last point is what licenses the bridge to touch tool activation and toolbar state: that is bridge-required behaviour, not a UI redesign.

## Testing (p.5 §8)

Tests across the whole project are explicitly not wanted. If you want to demonstrate skill, *«достатньо кількох юніт-тестів на логіку суми та на серіалізацію повідомлень»*.

| Test | Status |
|---|---|
| Total calculation groups by unit | **named by the PDF** |
| Message serialization / runtime guard | **named by the PDF** |
| Reducer ignores a stale `activationId` | our optional extra |
| Pre-ready command queue ordering | our optional extra |

Manual integration verification against a real OHIF iframe is still required regardless.

## Submission requirements

### Mandatory deliverables (p.4 §7.1–7.2, p.5 §7.3)

| Deliverable | PDF requirement | Where it lives here |
|---|---|---|
| Feature PR history | **Minimum five** feature PRs. Each with a meaningful description: **what changed, why exactly this way, what was verified.** *«PR з описом "changes" не зараховується»* — a PR described as "changes" is not counted. PRs **may be self-merged**; there is no review from them at this stage. What is graded is the history of thinking, not one heap of code. | `IMPLEMENTATION_PLAN.md`, `PR_TEMPLATE.md` |
| `README.md` | How to start both applications from scratch (`git clone` → working screen). **«Ми буквально виконаємо ці кроки на чистій машині»** — *they will literally execute these steps on a clean machine.* | `docs/scoring-form/README.md`. The repository root `README.md` is upstream OHIF's and is left untouched for now — **a discoverable pointer from the root README to the task guide is required before submission** (`IMPLEMENTATION_PLAN.md` PR 6). |
| `ARCHITECTURE.md` | The exchange **diagram**, a **full table of messages with payloads**, and a **separate «Прийняті рішення» (Accepted Decisions) section** covering: who issues IDs, how the handshake works, what is done with commands that arrived too early, how the echo loop is avoided. **«Достатньо 1–2 сторінок, але по суті»** — 1–2 pages is enough, but substantive. | `ARCHITECTURE.md` §2 (diagram), §5 (message table), §10 (Accepted Decisions). Supporting evidence deliberately offloaded to `docs/scoring-form/IMPLEMENTATION_NOTES.md` to keep the main document short. |
| `AI-USAGE.md` | Honest: where AI was used, what of its output was kept unchanged, what was rewritten and why. **Not a minus — the ability to work with AI is critically assessed. The minus is hiding it.** | `AI-USAGE.md` |
| Video demo | **Mandatory.** See below. | to be recorded before submission |

Install note carried into the README: it must use `pnpm run install:update-lockfile`, because a plain `pnpm install` fails — `pnpm-workspace.yaml:17` sets `frozenLockfile: true`.

### Video demo — required scenarios (p.5 §7.3)

**«Обов'язково»** — mandatory. Screen recording of **2–4 minutes**, voice-over desirable, which must show:

1. launching both applications;
2. **adding at least three measurements in a row**;
3. how the total updates;
4. **behaviour when cancelling an activation** — pressed Activate and changed your mind;
5. any implemented star tasks.

All five are required content, not suggestions. Item 4 is the one most easily forgotten, and it is the reason `DEACTIVATE_TOOL` must work before recording.

## Suggested minimum PR sequence

The exact plan is in `IMPLEMENTATION_PLAN.md`.

At minimum preserve separate history for:

1. host bootstrap/iframe/layout;
2. viewer bridge + handshake;
3. host -> viewer activation;
4. viewer -> host measurement;
5. total calculation.

## Defense topics to be ready for (p.5 §9)

The call is **30–45 minutes** and is **«основна частина оцінювання»** — the main part of the assessment (25%). Live changes are performed during the call, **~10 minutes each**.

Be able to explain and point to code for:

- slow iframe / early Activate — **show in the code where this is handled**;
- why `postMessage`;
- what changes if same-origin;
- who creates row/measurement IDs, and **what breaks if that decision is flipped to the opposite**;
- where OHIF measurement subscription lives;
- behavior with two host-app browser tabs;
- where an echo loop could occur;
- why the viewer activates `WindowLevel` rather than `Pan`, and why that satisfies the assignment's «повертається Pan/дефолт» through the *default* option;
- how the bridge knows an activation actually took effect (`setToolActive` fails silently);
- why `cachedStats` timing matters for the reported area;
- changing Ellipse to RectangleROI;
- adding another measurement field through the full chain;
- diagnosing a broken/missing `VIEWER_READY`.
