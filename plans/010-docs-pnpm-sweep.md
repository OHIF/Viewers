# Plan 010: Fix stale Yarn/Webpack documentation to match the pnpm/rspack reality

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- AGENTS.md README.md platform/docs/docs/development`
> If these changed since this plan was written, re-run the Step 0 inventory
> and reconcile before proceeding.

## Status

- **Priority**: P2
- **Effort**: S–M (mechanical but wide)
- **Risk**: LOW — docs only; zero runtime surface
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

The repo migrated from Yarn workspaces + webpack to **pnpm 11 + rspack/rsbuild**
(root `package.json`: `"packageManager": "pnpm@11.5.2"`, build scripts run
`rspack build` / `rsbuild dev`; there is no `yarn.lock`), but the three
documentation surfaces newcomers and agents actually read still teach the old
world. Following them fails outright:

- `AGENTS.md` (symlinked as `CLAUDE.md` — the primary agent-onboarding file)
  says `yarn dev` / `yarn build` (lines ~13-22) and claims "**Yarn
  Workspaces**" and "**Webpack 5**: Module federation" (lines ~91-92).
- `README.md` requires "Yarn 1.20.0+" (line 137), tells users to run
  `yarn config set workspaces-experimental true` (lines ~139-140, 164-165) and
  `yarn install --frozen-lockfile` (lines ~150, 168), warns about a `yarn.lock`
  that no longer exists (lines ~153-155), and titles its command table "Yarn
  Commands" (line ~235).
- `platform/docs/docs/development/*.md` (the published docs site) uses `yarn`
  commands across getting-started, testing, contributing, ohif-cli, link, and
  cs3d-integration guides.

## Current state

Ground truth to write against (verified at `973631b7e`):

- Package manager: pnpm ≥ 11 (`"packageManager": "pnpm@11.5.2"`), Node ≥ 24
  (`engines`), lockfile `pnpm-lock.yaml`.
- Command equivalences (from root `package.json` scripts — these scripts
  already exist; docs just need to call them via pnpm):
  - `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`
  - `yarn dev` → `pnpm run dev` (rspack dev server); `pnpm run dev:fast`
    (rsbuild variant) exists and README already mentions it
  - `yarn build` → `pnpm run build`
  - `yarn test:unit` → `pnpm run test:unit`
  - `yarn config set workspaces-experimental true` → delete; pnpm workspaces
    are declared in `pnpm-workspace.yaml`, no machine setup needed
- Build system wording: production builds use **rspack**
  (`platform/app/.webpack/webpack.pwa.js` via `rspack build` — the config dir
  is still named `.webpack`, which is fine to mention); dev has an
  **rsbuild** fast path (`rsbuild.config.ts`). "Module federation" claims
  should be dropped unless verified in the configs.
- `platform/docs/versioned_docs/**` are historical snapshots — DO NOT touch.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Inventory (Step 0) | `grep -rn --include="*.md" -E "\byarn( |$)" AGENTS.md README.md platform/docs/docs/development/` | list of hits |
| Docs site builds | `pnpm run docs:build` | exit 0 (slow; Docusaurus) |

## Scope

**In scope**:
- `AGENTS.md` (NOT `CLAUDE.md` — it's a symlink to AGENTS.md; editing either
  edits both, but only AGENTS.md is the real file)
- `README.md`
- `platform/docs/docs/development/**/*.md` (current docs only)

**Out of scope** (do NOT touch):
- `platform/docs/versioned_docs/**` — historical, versioned snapshots.
- `platform/docs/docs/deployment/**` and other non-development docs sections —
  sweep only `development/` in this plan; report (don't fix) yarn references
  elsewhere.
- Root `package.json` scripts — docs adapt to code, not vice versa.
- `CHANGELOG.md`, code comments mentioning yarn (e.g. `jest.config.base.js`).

## Git workflow

- Branch: `advisor/010-docs-pnpm`
- Conventional commit, e.g. `docs: replace stale yarn/webpack instructions with pnpm/rspack`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Inventory

Run the inventory grep (Commands table) and save the hit list. This is the
work queue and the after-check baseline.

**Verify**: hit list saved; count recorded.

### Step 1: AGENTS.md

- Replace every `yarn <x>` command with its pnpm equivalent from the table
  above.
- Rewrite the "Yarn Workspaces" bullet to "pnpm workspaces
  (`pnpm-workspace.yaml`)" and the "Webpack 5: Module federation" bullet to
  describe rspack (prod) + rsbuild (`dev:fast`) — keep it to one line each,
  matching the file's existing terseness.
- Leave all non-build content (architecture, services, patterns) untouched.

**Verify**: `grep -nE "\byarn\b|Webpack 5" AGENTS.md` → no matches.

### Step 2: README.md

- Requirements: Yarn line → `pnpm 11+` (link: https://pnpm.io/installation);
  Node line → `Node 24+` (match `engines`).
- Remove both `yarn config set workspaces-experimental true` occurrences.
- `yarn install --frozen-lockfile` → `pnpm install --frozen-lockfile`; update
  the supply-chain note to reference `pnpm-lock.yaml`.
- "Yarn Commands" table → "Commands", entries invoked as `pnpm run <script>`.
  Keep the table's script names as-is (they exist in root package.json).

**Verify**: `grep -niE "\byarn\b" README.md` → no matches (if a hit is a
historical/external link that genuinely must stay, record it in the report;
expected count is 0).

### Step 3: platform/docs development guides

For each file in the Step 0 inventory under
`platform/docs/docs/development/`: replace `yarn` command invocations with
pnpm equivalents. Judgment rules:
- `yarn <script>` → `pnpm run <script>` (verify the script exists in the
  relevant package.json before writing it; if it doesn't, flag the doc line in
  the report instead of inventing a command).
- Prose like "yarn workspace" concepts → pnpm workspace equivalents.
- Code blocks showing lockfile names → `pnpm-lock.yaml`.

**Verify**: `grep -rn --include="*.md" -E "\byarn( |$)" platform/docs/docs/development/` → no matches; `pnpm run docs:build` → exit 0.

## Test plan

No unit tests. Gates: the three grep checks plus a successful
`pnpm run docs:build` (proves no broken MDX from the edits).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -nE "\byarn\b" AGENTS.md README.md` → empty (or each residual hit justified in the report)
- [ ] `grep -rn --include="*.md" -E "\byarn( |$)" platform/docs/docs/development/` → empty
- [ ] `pnpm run docs:build` exits 0
- [ ] `git status --porcelain` touches only in-scope .md files (plus `plans/README.md`)
- [ ] Yarn references OUTSIDE the scope (other docs sections) counted and listed in the report
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A documented `yarn <script>` has no corresponding script in any
  package.json — the doc describes a dead workflow; list such lines rather
  than guessing replacements.
- `pnpm run docs:build` fails on files you did not edit (pre-existing docs
  breakage) — report; don't fix unrelated docs.
- You find the docs are generated from another source of truth (frontmatter
  or README notes indicating generation) — edit the source instead, and if
  unclear, stop.

## Maintenance notes

- Follow-up candidates surfaced but out of scope: yarn references in
  `platform/docs/docs/deployment/**`, FAQ, and any `*.md` outside
  development/ (the report's residual list feeds a future sweep).
- When the repo's Node/pnpm floors move, README requirements and AGENTS.md
  must move in the same PR — reviewer should ask for that habit.
- Related: plan 002 adds real lint/typecheck commands; if it lands first,
  mention them in AGENTS.md's commands section (one line each).
