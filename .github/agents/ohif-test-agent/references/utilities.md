# OHIF Test Utility guide

> This file documents the **stable import rules and conventions** around `tests/utils/`. For the current list of exported helpers and their exact signatures, **read [tests/utils/index.ts](tests/utils/index.ts) and the files it re-exports** — the barrel is always current; a static table here is not. Utilities get added, renamed, and refactored; the rules below change much more slowly.

## How to discover what's available

1. Open [tests/utils/index.ts](tests/utils/index.ts). Every symbol exported from the barrel is importable as `import { foo } from './utils'`.
2. If what you need isn't in the barrel, look in the rest of [tests/utils/](tests/utils/) — there are a handful of specialized files (`keyboardUtils.ts`, `assertions.ts`, `download.ts`, …). These need the **deeper import path**; see the rule below.
3. For the actual signature, read the utility's `.ts` file. It's one short function per file in most cases.
4. To see a utility in context, grep `tests/` (`grep -rn visitStudy tests/`) — or open the seed spec for the relevant feature area ([patterns-by-feature.md](patterns-by-feature.md)). Existing specs are the most reliable signature reference because they co-evolve with the API.

Do not guess parameter shapes from memory, and do not treat this file as an API catalog — it intentionally isn't one.

---

## Stable rules

### Barrel vs. deep imports

Two import styles exist. They are not interchangeable.

```ts
// Barrel — anything re-exported from tests/utils/index.ts
import { test, expect, visitStudy, checkForScreenshot, screenShotPaths } from './utils';

// Deep — for files NOT re-exported by the barrel
import { press } from './utils/keyboardUtils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';
import { downloadAsString } from './utils/download';
```

If a symbol isn't in the barrel, `import { x } from './utils'` **compiles**, resolves `x` to `undefined`, and blows up at the first call site. Confirm by opening `tests/utils/index.ts` for your working revision. At the time of this writing, `press`, `downloadAsString`, and the `assert*` helpers live outside the barrel — but maintainers can move things in or out, so treat `index.ts` as the ground truth rather than this note.

### Never import `test` / `expect` from `@playwright/test`

```ts
// ✅ Correct — gets the fixture-extended runner
import { test, expect } from './utils';

// ❌ Wrong — compiles, but every page-object fixture is silently undefined
import { test, expect } from '@playwright/test';
```

If your test function's destructured arguments (like `viewportPageObject`) are `undefined`, this import is almost always why.

### `visitStudy` — 2000 ms is a convention, not a default

```ts
await visitStudy(page, studyInstanceUID, mode, 2000);
```

The function's own default delay is `0`. Nearly every spec passes `2000` to let the first render settle. The one consistent exception is `mode: 'tmtv'`, where the suite uniformly uses `10000` because PET fusion and SUV calculation add real wall-clock cost before the UI is interactive.

Notably, 3D layouts in `viewer` mode (3DOnly, 3DFourUp, 3DMain, 3DPrimary) and MPR also use `2000` — they're not "heavy" in the `visitStudy` sense. Their stabilization problem is solved at the interaction layer with `attemptAction(() => reduce3DViewportSize(page), 10, 100)`, not by a longer visit delay.

So: pick `10000` when the mode is `tmtv`, `2000` otherwise, and only ramp up if a specific test flakes on first-render assertions. The delay is a good first lever for "not visible" flakes, but it's not a universal upgrade.

### `checkForScreenshot` has two call forms

- **Object form** (preferred in newer specs): `checkForScreenshot({ page, screenshotPath, maxDiffPixelRatio?, threshold?, normalizedClip?, fullPage? })`
- **Positional form** (still in use across older specs): `checkForScreenshot(page, locator, screenshotPath, ...)`

The object form exposes tuning knobs the positional form doesn't — `maxDiffPixelRatio`, `threshold`, `normalizedClip`. For 3D content, bump `maxDiffPixelRatio` to around `0.04` because GPU rendering is noisier. Check the current signature in [tests/utils/checkForScreenshot.ts](tests/utils/checkForScreenshot.ts) (or wherever the barrel points) if something looks off.

### `screenShotPaths` — use keys, not raw strings

```ts
await checkForScreenshot(page, page, screenShotPaths.length.lengthDisplayedCorrectly);
```

The full tree of categories lives in [tests/utils/screenShotPaths.ts](tests/utils/screenShotPaths.ts). When you need a new baseline, **add the key there and reference it by name** rather than typing a raw path. A typo in a key becomes a compile error instead of a silent mismatch, and other tests become discoverable through the object.

### Object-param convention

Many OHIF test utilities take a single **object argument** rather than positional arguments — notably `press({ page, key, nTimes? })`, the `simulate*` helpers, and the `assert*` helpers. If a call looks like it should work but throws "cannot read properties of undefined," check whether you're passing positional args to something that expects `{ page, ... }`.

Read the one-line signature at the top of the utility's source file before calling it — it's faster than guessing, and it's always right.

---

## Two utility shapes worth flagging

Most utilities are obvious once you read the source; these two are not, so they earn a mention:

- **`subscribeToMeasurementAdded(page)`** — returns `{ waitFired(timeout?), unsubscribe() }`. Use in freehand/livewire/spline specs to assert the event fired. Always wrap in `try { ... } finally { await sub.unsubscribe() }` so a failing assertion doesn't leak the listener across tests.
- **`attemptAction(action, attempts?, delay?)`** — retries a flaky async action without masking real failures. Mainly used to stabilize 3D scenes (`attemptAction(() => reduce3DViewportSize(page), 10, 100)`).

For everything else, the pattern is: find a spec that uses it (see [patterns-by-feature.md](patterns-by-feature.md)), copy the shape, adapt.
