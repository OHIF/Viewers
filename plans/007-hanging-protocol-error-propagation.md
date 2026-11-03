# Plan 007: Preserve original errors in HangingProtocolService instead of stringifying them

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 973631b7e..HEAD -- platform/core/src/services/HangingProtocolService/HangingProtocolService.ts`
> If the file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW — rethrowing the original error narrows nothing; callers that
  matched on `error.message` keep working because the message is preserved.
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `973631b7e`, 2026-07-07

## Why this matters

Two catch blocks in `HangingProtocolService` (the service that decides the
entire viewport layout) rethrow via `throw new Error(error)`. Passing an
`Error` object to the `Error` constructor coerces it to a string, producing an
error whose message is `"Error: <original message>"` and whose **stack trace
points at the catch block**, discarding the original stack and error subtype.
The only structured record of the real failure is a `console.log`. Layout
failures are among the harder things to diagnose in this app; this makes them
strictly harder for zero benefit.

## Current state

`platform/core/src/services/HangingProtocolService/HangingProtocolService.ts`:

- Lines 918-937 (`setProtocol`'s catch):

```ts
try {
  const protocol = this._validateProtocol(foundProtocol);
  if (options) { this._validateOptions(options); }
  this._setProtocol(protocol, options);
} catch (error) {
  console.log(error);
  if (errorCallback) { errorCallback(error); }
  throw new Error(error);
}
```

- Lines 1080-1084 (`_setProtocol`'s catch — note it also restores state):

```ts
} catch (error) {
  console.log(error);
  Object.assign(this, old);
  throw new Error(error);
}
```

- This service extends the pub-sub base (`pubSubServiceInterface.ts`);
  there is one existing test dir:
  `platform/core/src/services/HangingProtocolService/` contains a test file
  (plus one under `lib/`) — use it for the structural pattern.
- The `errorCallback(error)` lines already receive the original error — only
  the `throw` sites are wrong.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Unit tests (package) | `cd platform/core && pnpm run test:unit:ci` | exit 0 |

## Scope

**In scope**:
- `platform/core/src/services/HangingProtocolService/HangingProtocolService.ts`
  (the two catch blocks ONLY)
- The existing HangingProtocolService test file (add cases)

**Out of scope** (do NOT touch):
- Any other `catch` in this file or service — only the two cited sites.
- Callers of `setProtocol` — behavior-compatible by design.
- Replacing `console.log` with a logging framework (none exists; see
  Maintenance notes). Changing `console.log` → `console.warn` at these two
  sites IS allowed and encouraged.

## Git workflow

- Branch: `advisor/007-hp-error-propagation`
- Conventional commit, e.g. `fix(core): preserve original error and stack in HangingProtocolService rethrows`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rethrow the original error at both sites

At both catch blocks replace `throw new Error(error);` with `throw error;`
and change the `console.log(error)` to `console.warn(error)`. Everything else
in each block (the `errorCallback` call, the `Object.assign(this, old)` state
restore) stays byte-identical and in the same order.

**Verify**: `grep -n "throw new Error(error)" platform/core/src/services/HangingProtocolService/HangingProtocolService.ts` → no matches.

### Step 2: Add regression tests

In the existing HangingProtocolService test file, add:

1. `setProtocol` with a protocol that fails validation → the thrown value is
   the *same object* the validator threw (`expect(caught).toBe(original)` via
   a validator forced to throw a sentinel `class SentinelError extends Error`),
   and `errorCallback` received that same object.
2. The stage-failure path through `_setProtocol` (drive it via the public API
   with an invalid `stageIndex` in options, matching how the existing tests
   construct protocols) → thrown error message contains the original
   `Can't find applicable stage` text and `instanceof Error` is true.

Follow the mocking/setup style already present in that test file.

**Verify**: `cd platform/core && pnpm run test:unit:ci` → exit 0, including the 2 new cases.

## Test plan

Covered in Step 2. The key assertion is identity (`toBe`), not message
equality — that is what distinguishes the fix from the bug.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "throw new Error(error)" platform/core/src/services/HangingProtocolService/HangingProtocolService.ts` → 0
- [ ] `cd platform/core && pnpm run test:unit:ci` exits 0 with the new cases
- [ ] `git status --porcelain` shows only the service file + its test modified (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Either catch block no longer matches the excerpt (drift).
- Any existing test asserts on the *wrapped* error shape (message beginning
  `"Error: "`) — that would mean something depends on the bug; report it.
- The existing test file's harness cannot construct a protocol that reaches
  `_setProtocol`'s catch after two attempts — land Step 1 with test case 1
  only and record the gap.

## Maintenance notes

- If a structured logging path ever lands in `@ohif/core`, these two
  `console.warn` calls are candidates for it.
- Reviewer should scrutinize: no behavior change other than the thrown
  object's identity; `errorCallback` ordering unchanged (it must fire before
  the throw, as today).
- The same anti-pattern exists at 4 other sites, deliberately out of this
  plan's scope (different owners/blast radius; fix opportunistically with this
  same recipe): `platform/app/src/routes/SignoutCallbackComponent.tsx:18`,
  `platform/app/src/routes/CallbackPage.tsx:6`,
  `extensions/dicom-microscopy/src/DicomMicroscopyANNSopClassHandler.js:82`,
  `extensions/dicom-microscopy/src/DicomMicroscopySRSopClassHandler.js:93`.
