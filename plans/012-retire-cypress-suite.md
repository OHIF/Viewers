# Plan 012: Retire the legacy Cypress suite after verifying Playwright parity

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- .circleci/config.yml platform/app/cypress package.json`
> If these changed since this plan was written, compare the "Current state"
> facts against the live files before proceeding; on a mismatch, treat it as a
> STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — deleting E2E coverage that has no Playwright equivalent
  would create a real gap; the parity-mapping step is the control, and its
  outcome gates everything after it.
- **Depends on**: none
- **Category**: tests / ci
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

Two E2E systems run on every PR: the modern, actively developed **Playwright**
suite (85+ specs under `tests/`, GitHub Actions) and a legacy **Cypress**
suite (15 specs under `platform/app/cypress/integration/`, no substantive new
tests in ~18 months) that CircleCI still runs with a paid Cypress Cloud
context (`--record --parallel`). The Cypress suite duplicates areas Playwright
now covers, consumes CI money and wall-clock on every PR, and keeps `cypress`
+ `cypress-file-upload` in the dependency tree. Retiring it — after a per-spec
parity check — removes a whole test framework from the maintenance surface.

## Current state

- Cypress specs (15 files, verified at `973631b7e`):
  - `platform/app/cypress/integration/`: `ImageConsistency.spec.js`,
    `MultiStudy.spec.js`, `OHIFPdfDisplay.spec.js`, `OHIFVideoDisplay.spec.js`
  - `customization/`: `HangingProtocol.spec.js`, `OHIFDoubleClick.spec.js`
  - `study-list/`: `OHIFUserPreferences.spec.js`
  - `measurement-tracking/`: 8 specs incl. `OHIFCornerstoneToolbar.spec.js`,
    `OHIFCornerstoneHotkeys.spec.js`, `OHIFDownloadSnapshotFile.spec.js`,
    `OHIFContextMenuCustomization.spec.js`, ...
- CircleCI wiring (`.circleci/config.yml`): orb `cypress: cypress-io/cypress@3.4.2`
  (line 7); job `CYPRESS:` (line 405, with cypress/install at 432,
  cypress/run-tests at 434, run command with `npx cypress run --record
  --parallel` at 439-440); workflow `PR_CHECKS` (line 522) includes
  `- CYPRESS: { name: 'Cypress Tests', context: cypress }` (lines 529-531)
  alongside `BUILD_PACKAGES_QUICK` and `UNIT_TESTS`.
- Root `package.json` devDependencies: `cypress: 14.5.2`,
  `cypress-file-upload: 5.0.8`. `platform/app/package.json` scripts:
  `test:e2e` (`cypress open`), `test:e2e:local` (cypress run).
- `.eslintrc.json` globals block: `cy`, `Cypress`, etc. (only needed by the
  cypress specs).
- Playwright suite: `tests/*.spec.ts` (85 files) + page objects in
  `tests/pages/`; run via root `pnpm run test:e2e:ci`; GH Actions workflow
  `.github/workflows/playwright.yml`. Guidance skill for writing OHIF
  Playwright tests: `.agents/skills/ohif-test-agent/`.
- Keep in mind: `UNIT_TESTS` and `BUILD_PACKAGES_QUICK` CircleCI jobs must
  SURVIVE this plan — only the Cypress pieces go.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| CircleCI config sanity | `circleci config validate .circleci/config.yml` if the CLI exists; otherwise `python3 -c "import yaml;yaml.safe_load(open('.circleci/config.yml'))"` | exit 0 |
| Playwright suite (needs test data + serve) | `pnpm run test:data`, then `pnpm run test:e2e:serve` (bg) + `pnpm run test:e2e:ci` | pass |
| Unit sanity | `pnpm -r run test:unit:ci` | exit 0 |

## Scope

**In scope**:
- Parity report: `plans/reports/012-cypress-parity.md` (create; the `reports/`
  dir may need creating)
- `platform/app/cypress/` (delete, gated on parity)
- `.circleci/config.yml` (remove Cypress orb/job/workflow entry ONLY)
- Root `package.json` (remove `cypress`, `cypress-file-upload` devDeps),
  `platform/app/package.json` (remove `test:e2e`, `test:e2e:local` cypress
  scripts), `pnpm-lock.yaml` (regenerated)
- `.eslintrc.json` (remove Cypress globals)
- New Playwright specs under `tests/` for any genuine coverage gaps found

**Out of scope** (do NOT touch):
- The rest of `.circleci/config.yml` (UNIT_TESTS, builds, publish,
  DEPLOY_MASTER, docker) — full CI-provider consolidation is a separate
  maintainer decision (see plan 015 / Maintenance notes).
- `.github/workflows/*` — Playwright CI stays exactly as is.
- Existing Playwright specs and page objects (additive changes only).

## Git workflow

- Branch: `advisor/012-retire-cypress`
- One commit per step; e.g. `test(e2e): map cypress specs to playwright coverage`, `chore(ci): remove cypress job and dependencies`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Per-spec parity mapping (the gate)

For EACH of the 15 Cypress specs: read it, list the user-visible behaviors it
asserts, and find the Playwright spec(s) covering each behavior (search
`tests/` by feature keywords; e.g. measurement-toolbar behaviors likely map to
`tests/MeasurementPanel.spec.ts` and toolbar/page-object usage). Record in
`plans/reports/012-cypress-parity.md` a table:

| Cypress spec | Behavior | Playwright equivalent | Verdict (covered / gap / obsolete) |

"Obsolete" = tests a feature that no longer exists (verify by looking for the
feature, not by assumption). Likely gap candidates flagged during the audit:
`ImageConsistency.spec.js`, `OHIFPdfDisplay.spec.js`,
`OHIFVideoDisplay.spec.js`, `OHIFDownloadSnapshotFile.spec.js` — scrutinize
these four hardest.

**Verify**: the report exists and has one row per behavior; every row has a
verdict.

### Step 2: Port the gaps

For every "gap" verdict, write a Playwright spec under `tests/` reproducing
the behavior. Before writing any test, read the OHIF test-agent guidance at
`.agents/skills/ohif-test-agent/` (fixture system, page objects, normalized
viewport coordinates) and model on an adjacent existing spec. If a gap
requires test data the Playwright harness lacks, that's a STOP condition.

**Verify**: new specs pass locally: `pnpm exec playwright test <new files>`
with the serve running. If the local environment cannot run Playwright
(no test data / display), STOP — do not delete coverage you couldn't replace
and verify.

### Step 3: Remove the Cypress CI job

In `.circleci/config.yml`: delete the `cypress` orb line (7), the whole
`CYPRESS:` job block (405-441), and the `- CYPRESS:` entry in `PR_CHECKS`
(529-531). Touch nothing else.

**Verify**: YAML/config validation passes; `grep -in cypress .circleci/config.yml` → no matches.

### Step 4: Delete the suite and dependencies

1. `git rm -r platform/app/cypress`
2. Remove `cypress` and `cypress-file-upload` from root `package.json`
   devDependencies; remove the `test:e2e` and `test:e2e:local` scripts from
   `platform/app/package.json`; `pnpm install --no-frozen-lockfile`.
3. Remove the Cypress globals (`cy`, `Cypress`, `before`, `context`, `assert`)
   from `.eslintrc.json` — but only the ones no other code needs: grep first
   (`grep -rn "\bCypress\." platform extensions tests` etc.).

**Verify**: `pnpm -r run test:unit:ci` → exit 0; `grep -rin cypress package.json platform/app/package.json .eslintrc.json` → no matches; `pnpm exec playwright --version` still works.

## Test plan

- The parity report (Step 1) is the primary artifact — it's what makes the
  deletion safe and reviewable.
- New gap-filling Playwright specs must pass in the same environment as the
  existing suite.
- Full existing Playwright suite should be run once after Step 4 if the
  environment allows; otherwise note it for CI to confirm.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `plans/reports/012-cypress-parity.md` exists; zero rows left with verdict "gap" (all ported or reclassified with justification)
- [ ] `test -d platform/app/cypress` → fails (directory gone)
- [ ] `grep -in cypress .circleci/config.yml` → empty; config validates
- [ ] `grep -in '"cypress' package.json` → empty; lockfile regenerated; `pnpm -r run test:unit:ci` exits 0
- [ ] New Playwright specs (if any) pass
- [ ] `git status --porcelain` touches only in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any gap cannot be ported (missing fixture/test-data/harness capability) —
  deliver the parity report + ported specs you have, leave Cypress in place,
  and mark this plan BLOCKED with the gap list.
- You cannot run Playwright locally to verify ported specs — same as above:
  report instead of deleting unverified.
- `PR_CHECKS` in CircleCI has changed shape since `973631b7e` (drift).
- The `context: cypress` appears to be used by any non-Cypress job (it
  shouldn't be — verify with grep before removing).

## Maintenance notes

- Cancel the Cypress Cloud subscription/record key after this merges —
  maintainer action, flag it in the PR description.
- Follow-up (separate maintainer decision, see also plan 015): move
  `UNIT_TESTS`/build jobs from CircleCI to GitHub Actions so PRs run one CI
  provider. This plan deliberately leaves CircleCI otherwise intact.
- Reviewer should scrutinize: the parity report's "obsolete" verdicts (easiest
  place to rationalize away real coverage) and the four flagged gap candidates.
