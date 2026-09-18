# START_HERE.md

Entry point for the "Viewer + Scoring Form" test task.

## Important: which file holds our instructions

Our task instructions live in **`TASK_INSTRUCTIONS.md`**.

They are **not** in `CLAUDE.md`. In this repository:

- `CLAUDE.md` is a **symlink to the upstream OHIF `AGENTS.md`**;
- it is recreated on every `pnpm install` by `preinstall.js` (see `preinstall.js:17-34`);
- it is listed in `.gitignore`.

Anything written to `CLAUDE.md` is therefore destroyed by the next install and never committed. Never put task content there, and never edit `AGENTS.md` or `CLAUDE.md`.

## Task documents

`ASSIGNMENT.pdf` (repository root) is the **primary requirements source**. Everything below is derived from it — if a derived document disagrees with the PDF, the PDF wins. `ASSIGNMENT.pdf` is a supplied artifact and is **not tracked in Git**.

| File | Purpose |
|---|---|
| `TASK.md` | Requirements extracted from `ASSIGNMENT.pdf`, with page references; grading rubric; out-of-scope |
| `TASK_INSTRUCTIONS.md` | How we work on this task; engineering principles |
| `ARCHITECTURE.md` | **Reviewer-facing deliverable** — diagram, message table with payloads, Accepted Decisions. Deliberately short (the assignment asks for 1–2 substantive pages) |
| `docs/scoring-form/README.md` | Task setup guide: clone → working screen, with a per-step status table |
| `docs/scoring-form/IMPLEMENTATION_NOTES.md` | Verified OHIF source findings with `file:line`, evidence, and the open-items register |
| `IMPLEMENTATION_PLAN.md` | PR-by-PR plan and acceptance criteria |
| `PR_TEMPLATE.md` | PR body template |
| `AI-USAGE.md` | Truthful record of AI assistance |
| `README.md` (root) | **Upstream OHIF**, untouched for now. Needs a pointer to `docs/scoring-form/README.md` before submission (PR 6) |
| `AGENTS.md` / `CLAUDE.md` | **Upstream OHIF**, do not modify |

## Where effort belongs (`ASSIGNMENT.pdf` p.6 §10)

| Block | Weight |
|---|---|
| Working scenario — reproduces from the README with no hints | 25% |
| Bridge architecture — contract, ID correlation, handshake, responsibilities | 25% |
| Defence — explaining decisions and live changes on the call | 25% |
| Code quality — typing, effect cleanup, structure, readability | 15% |
| Communication — PRs, `ARCHITECTURE.md`, video demo | 10% |

Star tasks add up to +15% but cannot offset a failed defence. Role, per the PDF: **Frontend Developer (React / TypeScript)**; 5 working days.

## Status

Phase 0 (baseline verification) and the read-only repository audit are **complete**.

Verified baseline:

| Item | Value | Source |
|---|---|---|
| OHIF version | `3.14.0-beta.29` | `package.json` `version` |
| Baseline commit | `1ec01348d` | `git log` |
| Node | `24.15.0` | `.node-version` (`engines.node: >=24`) |
| pnpm | `11.5.2` | `package.json` `packageManager` |
| Viewer dev port | `3000`, override via `OHIF_PORT` | `platform/app/.webpack/webpack.pwa.js:26` |
| Direct study route | `/viewer?StudyInstanceUIDs=...` | verified manually |
| `EllipticalROI` | present in the default tool group, produces area in `mm²` | `modes/basic/src/initToolGroups.ts:65` |

The audit findings are recorded in `docs/scoring-form/IMPLEMENTATION_NOTES.md`, summarised in `ARCHITECTURE.md`, and scheduled in `IMPLEMENTATION_PLAN.md`.

## Next step

Start **PR 1** exactly as scoped in `IMPLEMENTATION_PLAN.md`.

PR 1 is host-app + shared contract + workspace configuration only. It deliberately contains **no** OHIF extension and **no** working handshake.

## Working rules

- Work **one planned PR at a time**. Do not implement future PRs unless explicitly asked.
- Do not ask for "the whole test task" in one prompt. The repository history is part of the evaluation and the task will be defended live.
- Treat the checked-out source as the source of truth. If a document contradicts the source, show the evidence and propose the smallest correction rather than guessing.
- Every claim about OHIF internals in our documents is labelled `[VERIFIED]`, `[PROPOSED]`, or `[UNVERIFIED]`. Do not promote an `[UNVERIFIED]` item without evidence.