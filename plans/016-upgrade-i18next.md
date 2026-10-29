# Plan 016: Upgrade i18next / react-i18next / language-detector across the monorepo

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- platform/i18n platform/app/package.json`
> If the i18n package or app deps changed since this plan was written, re-check
> the pinned versions below against the live manifests before proceeding.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED — i18next major bumps change `init()` option names and
  namespace/plural behavior; the whole UI's translated strings depend on it.
- **Depends on**: 002 (typecheck helps validate the react-i18next type surface)
- **Category**: dependencies / migration
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

The i18n stack is pinned several majors behind while the app runs React
18.3.1: `i18next@17.3.1`, `react-i18next@12.3.1`,
`i18next-browser-languagedetector@3.1.1`. Staying behind forfeits type
improvements, bug/security fixes, and risks incompatibility with modern React
tooling. The versions are declared in multiple manifests that must move
together (a split would break peer-dependency resolution).

## Current state

Version declarations to change (all must move in lockstep — verified):

- `platform/i18n/package.json`:
  - `peerDependencies`: `i18next 17.3.1`,
    `i18next-browser-languagedetector 3.1.1`, `react-i18next 12.3.1` (lines
    32-36)
  - `devDependencies`: same three (lines 46-50)
- `platform/app/package.json`: `i18next 17.3.1` (71),
  `i18next-browser-languagedetector 3.1.1` (72), `react-i18next 12.3.1` (81)

The initialization code (the risk surface):

- `platform/i18n/src/index.js` — TWO `.init(...)` calls (lines ~79 and ~115),
  each preceded by `.use(LanguageDetector)` (import line 5) and
  `.use(initReactI18next)` (import line 6, from `react-i18next`). Read BOTH
  init option objects fully before upgrading — deprecated/renamed options
  across majors live here.
- `platform/i18n/src/config.js`, `utils.js`, `debugger.js` — supporting config.
- 124 source files consume `react-i18next` (`useTranslation`) or `i18next`
  across the repo — the public hook API (`useTranslation`, `t`, `Trans`) is
  stable across these majors, so consumers should NOT need changes; if they
  do, that is a STOP condition (scope explosion).
- `platform/i18n` has NO unit tests (`test:unit` is an echo stub) — validation
  is typecheck + build + runtime smoke, not jest.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Discover current majors | `npm view i18next version && npm view react-i18next version && npm view i18next-browser-languagedetector version` | prints latest |
| Install | `pnpm install --no-frozen-lockfile` | exit 0 |
| Typecheck (if plan 002 landed) | `pnpm run typecheck` | no NEW i18n-related errors |
| Build the app | `pnpm run build` | exit 0 (slow) |
| Dev smoke | `pnpm run dev:fast` | app loads, strings render |
| Unit sanity | `pnpm -r run test:unit:ci` | exit 0 |

## Scope

**In scope**:
- `platform/i18n/package.json`, `platform/app/package.json` (version bumps)
- `platform/i18n/src/index.js`, `config.js`, `utils.js` (init-option migration)
- `pnpm-lock.yaml` (regenerated)

**Out of scope** (do NOT touch):
- The 124 consumer files — if the hook API forces changes, STOP.
- `i18next-locize-backend` / `locize-*` deps (separate ecosystem; bump only if
  the new i18next major hard-requires it, and then note it).
- Translation JSON under `platform/i18n/src/locales/`.
- Adding i18n unit tests (worthwhile but separate).

## Git workflow

- Branch: `advisor/016-i18next-upgrade`
- Conventional commit, e.g. `chore(deps): upgrade i18next stack to latest majors`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Determine target versions and read migration notes

Run the `npm view` commands to get current latest majors of all three
packages. Record them. Read the i18next and react-i18next migration guides for
each major crossed (from 17→latest and 12→latest) and list, in the commit body
or a scratch note, the init-option and behavior changes that touch
`platform/i18n/src/index.js`'s two init objects (common ones historically:
`whitelist`→`supportedLngs`, `keySeparator`/`nsSeparator` defaults, plural
handling, `react.wait`/`react.useSuspense`).

**Verify**: target versions recorded; a change list specific to the two init
objects exists.

### Step 2: Bump versions in lockstep and install

Set all three packages to the target versions in BOTH manifests (peer + dev in
`platform/i18n`, deps in `platform/app`). Keep them byte-identical across
manifests. `pnpm install --no-frozen-lockfile`.

**Verify**: `grep -rn "i18next\|react-i18next" platform/i18n/package.json platform/app/package.json` shows the SAME target version everywhere; `pnpm install` exits 0; `pnpm-lock.yaml` updated.

### Step 3: Migrate the init options

Apply the Step 1 change list to both `.init(...)` calls in
`platform/i18n/src/index.js` (and `config.js` if it holds init options). Rename
deprecated options; set `react.useSuspense` explicitly if the new default
would change loading behavior. Do not change translation keys or namespaces.

**Verify**: if plan 002 landed, `pnpm run typecheck` shows no new errors in
`platform/i18n` or i18n type usages; otherwise `pnpm run build` exits 0.

### Step 4: Build + runtime smoke

1. `pnpm -r run test:unit:ci` → exit 0.
2. `pnpm run build` → exit 0.
3. `pnpm run dev:fast`, open the app, and verify: default-language strings
   render (no raw keys like `MeasurementTable:empty` showing through),
   switching language works if the UI exposes it, and the browser console has
   no i18next initialization errors/warnings about unknown options.

**Verify**: all three pass; console clean of i18next option warnings.

## Test plan

No unit tests exist for i18n and adding them is out of scope. Validation is:
typecheck (post-002) + production build + the runtime smoke checklist in Step
4. Provide the Step-4 checklist in the PR description for the human reviewer to
repeat.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] All three packages at the same target major in both manifests (grep check)
- [ ] `pnpm install` clean; lockfile regenerated
- [ ] `pnpm -r run test:unit:ci` exits 0
- [ ] `pnpm run build` exits 0
- [ ] Runtime smoke checklist (Step 4.3) passes; console free of i18next option warnings
- [ ] Zero consumer files (outside `platform/i18n`, `platform/app/package.json`) modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Consumers of `useTranslation`/`Trans` require code changes to compile or run
  — the blast radius exceeds this plan; report the breaking API.
- The new i18next major hard-requires bumping `i18next-locize-backend` or the
  `locize-*` packages to versions that themselves have breaking changes.
- Runtime shows missing translations or raw keys after the upgrade and the
  cause isn't an obvious renamed init option.
- `npm view` shows the current major is only 1 ahead (not "several") — the
  finding was over-stated; do a smaller patch/minor bump and note it.

## Maintenance notes

- Pin the three packages together forever; a future split reintroduces the
  peer-dependency hazard. Consider a single source of truth (only
  `platform/i18n` declares them, app consumes transitively) as a follow-up.
- Reviewer should scrutinize: the two init-option diffs and the runtime
  console (i18next logs unknown options as warnings, easy to miss in a build
  that still "succeeds").
- Deferred: unit tests for `platform/i18n` (the `test:unit` echo stub is a
  standing gap).
