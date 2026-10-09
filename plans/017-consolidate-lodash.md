# Plan 017: Consolidate the scattered lodash.* micro-packages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- platform/app/package.json platform/core/package.json extensions/default/package.json extensions/cornerstone/package.json extensions/dicom-microscopy/package.json extensions/measurement-tracking/package.json`
> If any of these manifests changed, re-run the Step 0 census before proceeding.

## Status

- **Priority**: P3
- **Effort**: S–M
- **Risk**: LOW — `lodash-es` named exports are behaviorally identical to the
  single-function packages at these versions; risk is import-path mechanics.
- **Depends on**: 002 (lint/typecheck make the sweep verifiable; a
  `no-restricted-imports` rule can then prevent regressions)
- **Category**: dependencies / tech-debt
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

Nine different single-function lodash micro-packages are scattered across six
workspace manifests (`lodash.isequal`, `lodash.clonedeep`, `lodash.debounce`,
`lodash.merge`, `lodash.compact`, `lodash.flatten`, `lodash.zip`, `lodash.get`,
`lodash.uniqby`). Several are effectively unmaintained relative to mainline
lodash, they drift in version across packages, and they fragment what should
be one dependency. Consolidating onto tree-shakeable `lodash-es` named imports
removes the sprawl without growing the bundle (rspack tree-shakes `lodash-es`).

## Current state

Micro-package declarations (verified at `973631b7e`):

| Package | Manifest:line |
|---|---|
| `lodash.isequal 4.5.0` | `platform/app/package.json:73`, `platform/core/package.json:53` |
| `lodash.clonedeep 4.5.0` | `platform/core/package.json:52`, `platform/ui/package.json:41` |
| `lodash.debounce 4.0.8` | `platform/ui/package.json:42`, `extensions/cornerstone/package.json:68`, `extensions/dicom-microscopy/package.json:46`, `extensions/measurement-tracking/package.json:38` |
| `lodash.merge 4.6.2` | `platform/ui/package.json:43` |
| `lodash.get 4.4.2` | `extensions/default/package.json:46` |
| `lodash.uniqby 4.7.0` | `extensions/default/package.json:47` |
| `lodash.compact 3.0.1` | `extensions/cornerstone/package.json:67` |
| `lodash.flatten 4.4.0` | `extensions/cornerstone/package.json:69` |
| `lodash.zip 4.2.0` | `extensions/cornerstone/package.json:70` |

Import style in source (verified counts): `import debounce from 'lodash.debounce'`
(10 sites), `lodash.clonedeep` (3), `lodash.compact`/`flatten`/`zip` (4 each),
plus single sites for `isequal`, `get`, `merge`, `uniqby`. All are
default-import of a single function.

`platform/ui` (legacy) is a special case — it is slated for removal (plan
014's decision memo). Include its three micro-packages here ONLY if plan 014
has NOT yet removed the package; otherwise skip `platform/ui`.

Jest note: `jest.config.base.js` maps `@cornerstonejs/*` but has no lodash
mapping; `lodash-es` is ESM — babel-jest transforms it
(`transformIgnorePatterns: []` means node_modules are transformed), so tests
should resolve it, but verify (Step 3).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Census | `grep -rn "from 'lodash\." platform/*/src extensions/*/src modes/*/src \| grep -v node_modules` | site list |
| Install | `pnpm install --no-frozen-lockfile` | exit 0 |
| Unit tests | `pnpm -r run test:unit:ci` | exit 0 |
| Build | `pnpm run build` | exit 0 (slow) |

## Scope

**In scope**:
- All source files importing a `lodash.<fn>` micro-package (rewrite imports)
- The six (or five, if `platform/ui` is gone) manifests above: remove
  micro-packages, add `lodash-es`
- Root or per-package: add `@types/lodash-es` as a devDependency where TS
  files import it
- `pnpm-lock.yaml`

**Out of scope** (do NOT touch):
- `platform/ui` if plan 014 already removed it.
- Behavior — this is a mechanical import swap; no logic changes.
- Introducing native replacements (e.g. structuredClone for clonedeep) — a
  bigger judgment call, deferred.
- `lodash` (full package) if it appears anywhere as a transitive/other dep —
  only the `lodash.*` micro-packages are in scope.

## Git workflow

- Branch: `advisor/017-lodash-consolidation`
- One commit per workspace package keeps the diff reviewable, e.g.
  `chore(deps): replace lodash micro-packages with lodash-es in cornerstone`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Census

Run the census grep; produce the definitive list of `(file, imported fn)`
pairs. This is the work queue.

**Verify**: list saved; its function set is a subset of the 9 packages above.

### Step 1: Rewrite imports to lodash-es named imports

For each site, convert default import to a named import:

```ts
// before
import debounce from 'lodash.debounce';
// after
import { debounce } from 'lodash-es';
```

Map: `lodash.isequal`→`isEqual`, `lodash.clonedeep`→`cloneDeep`,
`lodash.debounce`→`debounce`, `lodash.merge`→`merge`,
`lodash.compact`→`compact`, `lodash.flatten`→`flatten`, `lodash.zip`→`zip`,
`lodash.get`→`get`, `lodash.uniqby`→`uniqBy`. (Note the camelCase names.)

Do a package at a time; keep call sites unchanged.

**Verify (per package)**: `grep -rn "from 'lodash\." <package>/src` → no
micro-package imports remain; `grep -rn "from 'lodash-es'" <package>/src` →
the expected count.

### Step 2: Update manifests

In each in-scope manifest: remove the `lodash.*` entries, add
`"lodash-es": "^4.17.21"` (single source; align the version across all
manifests). Add `@types/lodash-es` to devDependencies of packages containing
`.ts`/`.tsx` importers. `pnpm install --no-frozen-lockfile`.

**Verify**: `grep -rn '"lodash\.' platform extensions --include=package.json | grep -v node_modules` → empty; `grep -rn '"lodash-es"' platform extensions --include=package.json` → one per in-scope package.

### Step 3: Build, typecheck, test

1. `pnpm -r run test:unit:ci` → exit 0 (confirms babel-jest resolves
   `lodash-es`; if a specific package fails to resolve it, add a
   `moduleNameMapper` for `^lodash-es$` → the CJS `lodash` build in that
   package's jest config as a fallback and note it).
2. If plan 002 landed: `pnpm run typecheck` → no new errors.
3. `pnpm run build` → exit 0 (confirms rspack resolves and tree-shakes).

**Verify**: all pass.

## Test plan

No new tests — behavior is unchanged by construction. The existing unit suites
plus a clean production build are the regression gate. Spot-check in the PR:
one debounced interaction (e.g. the measurement panel search) and one
`isEqual`-driven memoization still behave identically.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "from 'lodash\." platform/*/src extensions/*/src modes/*/src | grep -v node_modules` → empty
- [ ] `grep -rn '"lodash\.' platform extensions --include=package.json | grep -v node_modules` → empty
- [ ] `pnpm -r run test:unit:ci` exits 0
- [ ] `pnpm run build` exits 0
- [ ] `pnpm-lock.yaml` no longer references the `lodash.*` micro-packages: `grep -c "lodash\.\(isequal\|clonedeep\|debounce\|merge\|compact\|flatten\|zip\|get\|uniqby\)" pnpm-lock.yaml` → 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- babel-jest cannot resolve `lodash-es` in a package even with a
  `moduleNameMapper` fallback after one attempt.
- A `lodash.<fn>` version in use has a behavioral quirk the mainline function
  lacks (unlikely at these versions) — surfaced by a failing existing test.
- `platform/ui` is ambiguous (partially removed by an in-flight plan 014) —
  skip it and note the residual micro-packages there.

## Maintenance notes

- After plan 002's ESLint gate exists, add a `no-restricted-imports` rule
  banning `lodash.*` and bare `lodash` (force `lodash-es`) so the sprawl can't
  return — one entry in `.eslintrc.json`.
- Deferred: replacing simple helpers with native equivalents
  (`structuredClone` for `cloneDeep`, `Array.prototype.flat` for `flatten`) —
  case-by-case, not mechanical.
- Reviewer should scrutinize: the camelCase name mapping (e.g.
  `uniqby`→`uniqBy`) and that no call site relied on a micro-package's default
  export identity.
