# Plan 014: Reduce legacy @ohif/ui to a single consumer and write the deletion decision memo

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- extensions/default/src/customizations/contextMenuUICustomization.ts extensions/default/src/Panels/DataSourceSelector.tsx extensions/default/src/ViewerLayout/ToolbarButtonNestedMenu.tsx platform/app/src/routes/LegacyWorkList`
> Also re-run the import census (Step 0) — if the count differs from 5, the
> migration moved; reconcile before proceeding.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED — three of the surfaces are user-facing (context menu, data
  source selector, toolbar nested menu); visual/behavioral parity is required.
- **Depends on**: none
- **Category**: tech-debt / migration
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

The ui→ui-next design-system migration is ~97% done: only **5 imports in 4
files** still use `@ohif/ui`, versus ~200 imports of `@ohif/ui-next`. Yet the
entire legacy `platform/ui` workspace (its own build, its own 780-line
Tailwind config, an unused `moment` dependency) is maintained and shipped for
those 4 files. Finishing the last mile collapses two design systems into one
and unblocks deleting the workspace. One consumer — `LegacyWorkList` — is an
intentionally retained pre-3.13 study list behind a config switch, so its fate
is a maintainer decision; this plan migrates everything mechanical and
produces a precise decision memo for that last piece instead of guessing.

## Current state

The complete census of `@ohif/ui` imports at `973631b7e` (verified):

1. `extensions/default/src/ViewerLayout/ToolbarButtonNestedMenu.tsx:3` —
   `import { ToolbarButton } from '@ohif/ui';`
2. `extensions/default/src/Panels/DataSourceSelector.tsx:6` —
   `import { Button, ButtonEnums } from '@ohif/ui';`
3. `extensions/default/src/customizations/contextMenuUICustomization.ts:1` —
   `import { ContextMenu } from '@ohif/ui';`
4. `platform/app/src/routes/LegacyWorkList/LegacyWorkList.tsx:14-22` —
   `import { StudyListExpandedRow, EmptyStudies, StudyListTable, StudyListPagination, StudyListFilter, Button, ButtonEnums } from '@ohif/ui';`
   and `:41` — `import { Types } from '@ohif/ui';` (used as
   `Types.PatientInfoVisibility`, line 45). Note this file ALREADY imports
   heavily from `@ohif/ui-next` (lines 24-39: Header, Icons, Tooltip, ...).
5. `LegacyWorkList` is reachable: `platform/app/src/routes/index.tsx:128` —
   `const WorkListComponent = workListVariant === 'legacy' ? LegacyWorkList : WorkList;`
   (config-selected fallback "the pre-3.13 study list", per the comment at
   line 7). It is NOT dead code.

- `platform/ui-next/src` is the canonical library; components live under
  `platform/ui-next/src/components/`. Before porting each import, check what
  ui-next actually exports (`grep -rn "export" platform/ui-next/src/index.ts`
  or the components' index files).
- Repo rule (AGENTS.md): "To override an OHIF component, create a new
  component in your extension's `components/` directory" — porting within
  `extensions/default` should follow existing local component patterns there.
- Tailwind: legacy `platform/ui` has its own `tailwind.config.js`; ui-next
  styling is the target. Class names differ between the systems — do not mix
  legacy class tokens into ui-next components.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Import census | `grep -rn "from '@ohif/ui'" platform extensions modes --include="*.ts*" \| grep -v node_modules \| grep -v ui-next` | shrinking list |
| Unit tests | `pnpm -r run test:unit:ci` | exit 0 |
| Dev server (visual parity) | `pnpm run dev:fast` | serves on :3000 |
| E2E (context-menu related) | `pnpm exec playwright test -g "ContextMenu"` (with serve) | pass |

## Scope

**In scope**:
- The 3 `extensions/default` files listed above (port to ui-next or local components)
- `platform/app/src/routes/LegacyWorkList/LegacyWorkList.tsx` — ONLY the
  `Button`, `ButtonEnums`, and `Types.PatientInfoVisibility` imports (the
  small, mechanical subset)
- `extensions/default/package.json` (drop the `@ohif/ui` dependency once its
  imports are gone)
- Decision memo: `plans/reports/014-legacy-ui-decision.md` (create)

**Out of scope** (do NOT touch):
- Porting `StudyListTable` / `StudyListFilter` / `StudyListPagination` /
  `StudyListExpandedRow` / `EmptyStudies` — that IS the decision memo's
  subject, not this plan's work.
- Deleting `platform/ui` — blocked on the memo's decision.
- `platform/app/src/routes/index.tsx` and the `workListVariant` mechanism.
- Restyling anything beyond what parity requires.

## Git workflow

- Branch: `advisor/014-ui-next-last-mile`
- One commit per ported file, e.g. `refactor(default): port DataSourceSelector to ui-next Button`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Census + equivalence table

Re-run the import census. Then, for each symbol to port (`ToolbarButton`,
`Button`+`ButtonEnums`, `ContextMenu`, `Types.PatientInfoVisibility`), locate
the ui-next equivalent and record old→new mapping (component name, prop
diffs). Where NO equivalent exists (plausible for `ContextMenu` and
`ToolbarButton`), the fallback is a minimal local component in
`extensions/default/src/components/` that reproduces current markup/behavior
using ui-next primitives.

**Verify**: mapping table written (it becomes part of the decision memo).

### Step 1: Port `DataSourceSelector.tsx`

Replace `Button, ButtonEnums` with the ui-next button (ui-next `Button` uses
variant props instead of `ButtonEnums` — map `ButtonEnums.type/size` values to
the nearest ui-next variants per the Step 0 table). Visual context: this panel
renders the data-source picker list.

**Verify**: `grep -c "@ohif/ui'" extensions/default/src/Panels/DataSourceSelector.tsx` → 0; `pnpm -r run test:unit:ci` exits 0; dev-server smoke: the data source selector route renders (see Test plan).

### Step 2: Port `ToolbarButtonNestedMenu.tsx`

Same recipe for `ToolbarButton`. If ui-next has no direct `ToolbarButton`,
check how ui-next-based toolbars render buttons elsewhere in
`extensions/default` / `platform/app` and reuse that component.

**Verify**: `grep -c "@ohif/ui'" extensions/default/src/ViewerLayout/ToolbarButtonNestedMenu.tsx` → 0; unit suite green.

### Step 3: Port `contextMenuUICustomization.ts`

This wires the legacy `ContextMenu` component into the customization system.
Find where ui-next-era code renders context menus (search
`platform/ui-next/src` for ContextMenu/DropdownMenu and search for other
customizations rendering menus). If a straight swap exists, do it; if the
legacy component's API (items/submenus/positioning) has no ui-next analog,
build the minimal local wrapper. Behavior parity requirement: right-click
menu on a measurement shows the same items and nested submenus.

**Verify**: `grep -c "@ohif/ui'" extensions/default/src/customizations/contextMenuUICustomization.ts` → 0; run `pnpm exec playwright test -g "ContextMenu"` if the environment allows (there is Cypress/Playwright context-menu coverage — find the spec by grep) — pass; otherwise record the manual check.

### Step 4: Trim LegacyWorkList's mechanical imports

Replace its `Button`/`ButtonEnums` uses with the ui-next Button it already
imports alongside, and replace `Types.PatientInfoVisibility` with the
equivalent from `@ohif/core` types or an inlined local type per the Step 0
mapping (check what `Types.PatientInfoVisibility` actually is in
`platform/ui/src/types` first). After this, LegacyWorkList's ONLY remaining
`@ohif/ui` import must be the five StudyList* components on lines 14-22.

**Verify**: `grep -n "@ohif/ui'" platform/app/src/routes/LegacyWorkList/LegacyWorkList.tsx` → exactly 1 import statement (the StudyList* block).

### Step 5: Drop the dependency where possible + decision memo

1. If `extensions/default` has zero `@ohif/ui` imports now, remove
   `@ohif/ui` from `extensions/default/package.json` and run
   `pnpm install --no-frozen-lockfile`.
2. Write `plans/reports/014-legacy-ui-decision.md` for the maintainer:
   - Current end state: `platform/ui`'s sole consumer is LegacyWorkList's five
     StudyList* components (list exact files in `platform/ui/src` they pull in,
     with a transitive-import sketch).
   - Option A: port/vendor those five components into
     `platform/app/src/routes/LegacyWorkList/` and delete `platform/ui`
     (estimate the file count from the transitive sketch).
   - Option B: delete the `legacy` workListVariant entirely and with it
     LegacyWorkList + `platform/ui` (one-paragraph blast-radius: who sets
     `workListVariant: 'legacy'`? grep configs + docs).
   - Recommendation with one-line rationale.

**Verify**: census shows `@ohif/ui` imports ONLY in LegacyWorkList.tsx; memo exists with both options + recommendation.

## Test plan

- `pnpm -r run test:unit:ci` after every step.
- Visual parity is human-verified — provide this recipe in the PR description:
  (1) open the viewer with multiple data sources configured → data source
  selector renders and switches sources; (2) toolbar nested menus open/close
  and activate tools; (3) right-click a measurement → context menu items and
  submenus match pre-change screenshots; (4) set `workListVariant: 'legacy'`
  in config → legacy worklist still renders and paginates.
- Playwright: run any specs matching `-g "ContextMenu|DataSource|Toolbar"`
  when the environment allows.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] Import census: `@ohif/ui` imports exist ONLY in `LegacyWorkList.tsx` (1 import statement)
- [ ] `pnpm -r run test:unit:ci` exits 0
- [ ] `plans/reports/014-legacy-ui-decision.md` exists with Options A/B + recommendation
- [ ] `@ohif/ui` removed from `extensions/default/package.json` (if step 5.1 applied)
- [ ] `git status --porcelain` touches only in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 0 finds a ported symbol has NO reasonable ui-next equivalent AND a
  local wrapper would exceed ~150 lines — that file's port is bigger than this
  plan priced; report with the mapping table.
- The context-menu customization is consumed by modes/extensions outside this
  repo's census (search `getCustomizationModule` usages of the customization
  id) in a way that pins the legacy component's exact API.
- Any Playwright spec covering these surfaces goes red and the cause isn't an
  obvious selector/class change you introduced.

## Maintenance notes

- The decision memo is the actual unblocking artifact — the maintainer picks
  A or B, and THAT plan (a follow-up) deletes `platform/ui`, its Tailwind
  config, and its unused `moment` dependency (`platform/ui/package.json:44` —
  declared but never imported; verified).
- Until deletion, `platform/ui` should receive no new consumers: consider a
  lint rule (`no-restricted-imports` on `@ohif/ui`) once plan 002's ESLint
  gate exists — one line in `.eslintrc.json`.
- Reviewer should scrutinize: ButtonEnums → variant mappings (easy to silently
  change a button's visual weight) and context-menu keyboard/positioning
  behavior.
