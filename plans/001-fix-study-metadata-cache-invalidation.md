# Plan 001: Make study-metadata cache invalidation work and stop caching rejected promises

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js extensions/default/src/commandsModule.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

The DICOMweb data source caches study-metadata fetch promises in a module-level
Map so repeated requests for the same study don't re-hit the server. Two bugs
break this cache:

1. **Invalidation is a silent no-op.** Entries are stored under the composite
   key `` `${dicomWebConfig.name}:${StudyInstanceUID}` `` but
   `deleteStudyMetadataPromise` looks up the **bare** `StudyInstanceUID`, which
   can never match. The one production caller — invoked right after storing new
   DICOM instances so the study re-fetches — therefore does nothing: newly
   stored instances never appear until a full page reload.
2. **Rejected promises are cached forever.** The promise is stored before it
   settles and never removed on rejection, so one transient network failure
   makes that study permanently unloadable for the rest of the session. An
   in-file TODO acknowledges this.

## Current state

- `extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js` — the
  whole cache lives here (module-level `StudyMetaDataPromises` Map).
- `extensions/default/src/commandsModule.ts:832` — the caller:
  `resolvedDataSource.deleteStudyMetadataPromise(uid);` (bare StudyInstanceUID).
- `extensions/default/src/DicomWebDataSource/index.ts:615` — the data source
  exposes `deleteStudyMetadataPromise` directly on its API object.
- Other data sources implement the same API name (`DicomLocalDataSource`,
  `DicomJSONDataSource`, `MergeDataSource`, `DicomWebProxyDataSource`) — they
  delegate or no-op and are NOT in scope.

Excerpts as of `973631b7e` (`retrieveStudyMetadata.js`):

```js
// lines 30-32 — the acknowledged rejection bug
// @TODO: Whenever a study metadata request has failed, its related promise will be rejected once and for all
// and further requests for that metadata will always fail. On failure, we probably need to remove the
// corresponding promise from the "StudyMetaDataPromises" map...

// line 41 — composite insert key
const promiseId = `${dicomWebConfig.name}:${StudyInstanceUID}`;

// lines 44-46 — cache hit path
if (StudyMetaDataPromises.has(promiseId)) {
  return StudyMetaDataPromises.get(promiseId);
}

// line 76
StudyMetaDataPromises.set(promiseId, promise);

// lines 87-91 — delete uses the WRONG key (bare UID)
export function deleteStudyMetadataPromise(StudyInstanceUID) {
  if (StudyMetaDataPromises.has(StudyInstanceUID)) {
    StudyMetaDataPromises.delete(StudyInstanceUID);
  }
}
```

Conventions: this file is plain JS (not TS). Keep it JS. Tests in this
directory use Jest with plain describe/it — see
`extensions/default/src/DicomWebDataSource/retrieveRendered.test.ts` for the
structural pattern (mocking globals in beforeEach/afterEach).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install --frozen-lockfile` (repo root) | exit 0 |
| Unit tests (this package) | `cd extensions/default && pnpm run test:unit:ci` | exit 0, all pass |

There is no typecheck or lint gate in this repo yet (see plan 002).

## Scope

**In scope** (the only files you should modify/create):
- `extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js`
- `extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.test.js` (create)

**Out of scope** (do NOT touch):
- `extensions/default/src/commandsModule.ts` — the caller stays as-is; the fix
  must make the bare-UID call work (fix chosen below is suffix matching, so no
  caller change is needed).
- The other data source implementations listed above.
- `extensions/default/src/DicomWebDataSource/index.ts`.

## Git workflow

- Branch: `advisor/001-study-metadata-cache`
- Conventional commits, matching repo style, e.g. `fix(dicomweb): make study metadata cache invalidation and retry work`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete by UID suffix in `deleteStudyMetadataPromise`

Callers pass a bare `StudyInstanceUID` and do not know `dicomWebConfig.name`.
Replace the body so it removes **every** entry whose key is the bare UID or
ends with `:${StudyInstanceUID}`:

```js
export function deleteStudyMetadataPromise(StudyInstanceUID) {
  for (const key of StudyMetaDataPromises.keys()) {
    if (key === StudyInstanceUID || key.endsWith(`:${StudyInstanceUID}`)) {
      StudyMetaDataPromises.delete(key);
    }
  }
}
```

**Verify**: `node -e "const s=require('fs').readFileSync('extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js','utf8'); if(!/endsWith/.test(s)) process.exit(1)"` → exit 0

### Step 2: Evict rejected promises from the cache

Immediately after `StudyMetaDataPromises.set(promiseId, promise);` (line 76),
add a side-branch catch that removes the entry on failure without changing the
promise returned to callers:

```js
promise.catch(() => {
  StudyMetaDataPromises.delete(promiseId);
});
```

Also delete the now-resolved `@TODO` comment block at lines 30-32.

**Verify**: `grep -n "@TODO: Whenever a study metadata request has failed" extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js` → no matches (exit 1)

### Step 3: Add unit tests

Create `extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.test.js`.
Mock the network layer with `jest.mock('./wado/retrieveMetadata.js', ...)` (and
`jest.mock('./utils/retrieveMetadataFiltered.js', ...)` if needed). The cache
Map is module-level state that persists across tests in the file — use a
distinct StudyInstanceUID per test case.

**Verify**: `cd extensions/default && pnpm run test:unit:ci` → exit 0, includes the new test file with all cases passing

## Test plan

New tests in `retrieveStudyMetadata.test.js` (model after
`retrieveRendered.test.ts` in the same directory):

1. **Caching**: two `retrieveStudyMetadata` calls with the same
   `(dicomWebConfig.name, StudyInstanceUID)` invoke the mocked
   `RetrieveMetadata` once and return the same promise.
2. **Regression — invalidation works**: retrieve, then
   `deleteStudyMetadataPromise(bareUID)`, then retrieve again → mocked
   `RetrieveMetadata` called twice (this is the exact bug being fixed; it
   fails on the pre-fix code).
3. **Multiple configs**: cache under two different `dicomWebConfig.name`
   values for the same UID; deleting the bare UID removes both.
4. **Regression — rejection eviction**: make the mocked `RetrieveMetadata`
   reject once; await the rejection; call `retrieveStudyMetadata` again with a
   now-resolving mock → the second call succeeds (fails on pre-fix code).
5. **Guard clauses**: missing `dicomWebClient` or `StudyInstanceUID` throws.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `cd extensions/default && pnpm run test:unit:ci` exits 0; the 5 new test cases exist and pass
- [ ] `grep -c "endsWith" extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js` ≥ 1
- [ ] `grep -n "@TODO: Whenever a study metadata request has failed" extensions/default/src/DicomWebDataSource/retrieveStudyMetadata.js` returns nothing
- [ ] `git status --porcelain` shows changes only to the two in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts above don't match the live file (drift).
- The caller at `extensions/default/src/commandsModule.ts:832` no longer exists
  or now passes something other than a bare StudyInstanceUID.
- `jest.mock` of `./wado/retrieveMetadata.js` fails to take effect (e.g. the
  module resolves differently under babel-jest) after one reasonable attempt —
  report the error rather than restructuring source code to accommodate tests.

## Maintenance notes

- If per-config cache clearing is ever needed (clear only one data source's
  entry), extend `deleteStudyMetadataPromise` with an optional config-name
  argument rather than reverting to exact-key matching.
- Reviewer should scrutinize: the `.catch` side-branch must NOT be chained into
  the returned promise (callers still need to observe the rejection).
- Deferred: `retrieveMetadataFiltered` path shares the same cache; its
  rejection behavior is covered by the same eviction hook — no separate work.
