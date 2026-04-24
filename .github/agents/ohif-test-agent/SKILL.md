---
name: ohif-test-agent
description: Generate runnable Playwright E2E tests for the OHIF Viewer using its custom fixture system, page objects, and normalized WebGL viewport coordinates. Use this skill whenever the user asks to write, add, modify, or debug tests in an OHIF/Viewers context — including vague asks like "write a test for X" when working in the OHIF repo, tests touching platform/app/tests/, or anything involving Cornerstone viewports, DICOM studies, measurements, segmentations, or OHIF modes/extensions. Prefer this skill over generic test-writing even if the user doesn't say "Playwright" or "E2E" explicitly.
---

# OHIF Test Agent

This skill teaches you to generate correct, runnable Playwright end-to-end tests for the OHIF Viewer. Follow the workflow below.

## Environment model

This package is designed for any runtime that supports the agentskills.io conventions.

Use this file as the core behavior contract and use `AGENTS.md` in this folder as the runtime entrypoint.

## Workflow: how to write a new OHIF test

1. **Classify the feature.** What area does the test belong to — a measurement tool, segmentation hydration, contour panel interaction, MPR layout, crosshairs, tag browser, etc.? The area determines the mode, the StudyInstanceUID, and the seed spec you'll read.
2. **Read the seed spec.** Consult [references/patterns-by-feature.md](references/patterns-by-feature.md) to find the canonical existing spec for that area. Read it end-to-end before writing. This is the single most important step — OHIF specs follow consistent idioms that are easier to mimic than to reconstruct from first principles. (This mirrors Playwright's own agent guidance: use seed tests as the example for generated tests.)
3. **Scaffold from the template.** Start from [assets/spec-template.ts](assets/spec-template.ts) — or copy the seed spec and adapt.
4. **Look up specifics in the source, not from memory.** The reference files [page-objects.md](references/page-objects.md) and [utilities.md](references/utilities.md) capture the **stable rules** — fixture keys, import conventions, access idioms, the reasons certain things trip people up. They deliberately do not enumerate methods. For the current method surface or a utility's exact signature, open the relevant file under [tests/pages/](tests/pages/) or [tests/utils/](tests/utils/) — the source evolves, and the source is always right. The seed spec you picked in step 2 is usually the fastest second source, because it co-evolves with the API.
5. **Run the test when execution is available.** `yarn test:e2e:ci` runs the whole suite, but for iteration use `yarn playwright test tests/YourNew.spec.ts` (or via the Playwright VS Code extension).
6. **If runtime execution is unavailable, do static validation.** Validate import source, fixture keys, normalized viewport usage, UID/mode pairing, and hydration/tracking prompt handling. Then report clearly that execution was not performed.
7. **If it fails, triage before debugging.** Use [references/failure-triage.md](references/failure-triage.md) — most OHIF test failures are timing / hydration, not real regressions.

## Architecture

OHIF uses Playwright with a custom fixture system. Tests are **not** vanilla Playwright — they import `test`, `expect`, and utilities from `./utils`, which re-exports an extended test runner that injects page objects.

```
playwright.config.ts            → Chromium-only, port 3335, data-cy as testId
  └─ tests/utils/fixture.ts     → Extends playwright-test-coverage, injects page objects
       └─ tests/*.spec.ts       → Each imports { test, expect, ... } from './utils'
            ├─ tests/pages/     → Page objects (ViewportPageObject, MainToolbarPageObject, …)
            └─ tests/utils/     → Utilities (visitStudy, checkForScreenshot, screenShotPaths, …)
```

Why the custom fixture matters: the page objects are created for each test and bound to the right Playwright `page`. If you `new ViewportPageObject(page)` manually, you skip the fixture wiring and some sub-objects won't resolve correctly.

### Import rule

```ts
// Correct
import { test, expect, visitStudy, checkForScreenshot, screenShotPaths } from './utils';

// Wrong — will compile but fixtures won't be injected
import { test, expect } from '@playwright/test';
```

A few utilities (`press`, `downloadAsString`, the `assert*` helpers) are NOT re-exported from `./utils`. See [references/utilities.md](references/utilities.md) for the correct import path per utility.

## The viewport is WebGL

OHIF renders medical images onto a WebGL canvas. You cannot query pixels by CSS selector or assert on overlay drawings via DOM. Use **normalized coordinates** (0–1 range, top-left is `{x:0, y:0}`) for clicks and drags, and **visual regression** (screenshot comparison) for canvas assertions.

```ts
const activeViewport = await viewportPageObject.active;

await activeViewport.normalizedClickAt([{ x: 0.5, y: 0.5 }]);                 // click center
await activeViewport.normalizedClickAt([{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.7 }]); // draw two points
await activeViewport.normalizedClickAt([{ x: 0.5, y: 0.5 }], 'right');         // right-click
await activeViewport.normalizedDragAt({
  start: { x: 0.3, y: 0.3 },
  end:   { x: 0.7, y: 0.7 },
});
```

Pixel coordinates (`clickAt`, `doubleClickAt`) exist but prefer normalized for portability across viewport sizes.

For DOM-rendered state (panel counts, dialog text, overlay text values, button enabled states), assert directly:

```ts
await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('17/');
const count = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
expect(count).toBe(1);
```

## Study loading lifecycle

Every test follows this sequence. Skipping steps causes flakiness:

```ts
test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000); // 2s delay is the community norm
});
```

`visitStudy` navigates to `/{mode}/ohif?StudyInstanceUIDs={uid}`, waits for `domcontentloaded`, then `networkidle`, then the explicit delay. Default delay is `0`, but most specs pass `2000` to let the first render settle.

Delay by scene type (observed across the current suite, not a rule to apply blindly):

| Scene | Delay |
|-------|-------|
| Default (viewer mode, 2D/MPR/3D layouts, crosshairs) | `2000` |
| `mode: 'tmtv'` | `10000` — PET fusion + SUV calculation takes noticeably longer |

Start at the convention for your scene; ramp only if the test flakes on initial render. 3D layouts in `viewer` mode already stay at `2000` — the stabilization problem there is solved with `attemptAction(() => reduce3DViewportSize(page), 10, 100)`, not with a longer `visitStudy` delay.

If the study has DICOM SEG, RT, or SR data, OHIF asks whether to hydrate. Handle it:

```ts
await leftPanelPageObject.loadSeriesByModality('SEG'); // or 'RTSTRUCT', 'SR'
await page.waitForTimeout(3000);                        // allow the prompt to appear
await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
```

The first measurement you create triggers a "start tracking?" prompt:

```ts
await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
```

For 3D / MPR scenes, wrap stabilization in `attemptAction(() => reduce3DViewportSize(page), 10, 100)` or insert a `page.waitForTimeout(...)` after the layout change before asserting.

## Fixture-injected page objects

Destructure these from the test function argument. **Never `new` them manually.**

```ts
test('my test', async ({
  page,
  viewportPageObject,
  mainToolbarPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  DOMOverlayPageObject,          // note the capital D — this matches the fixture key
  notFoundStudyPageObject,
}) => { ... });
```

Two page objects are **not** fixture-injected:
- `DataOverlayPageObject` — reach via `viewportPageObject.getById(id).overlayMenu.dataOverlay`.
- `DicomTagBrowserPageObject` — reach via `DOMOverlayPageObject.dialog.dicomTagBrowser`.

See [references/page-objects.md](references/page-objects.md) for fixture rules and a map of which file covers which concern; read the `.ts` file under [tests/pages/](tests/pages/) for the current method surface.

## Visual regression

For anything drawn onto the WebGL canvas, compare a screenshot:

```ts
await checkForScreenshot(page, page, screenShotPaths.length.lengthDisplayedCorrectly);
```

`checkForScreenshot` retries up to 10 times at 500 ms intervals (defaults), with `maxDiffPixelRatio: 0.02` and `threshold: 0.05`. Raise `maxDiffPixelRatio` to ~0.04 for 3D content, which is noisier. Use `screenShotPaths.<category>.<name>` rather than a hand-typed string — the tree of valid keys lives in [tests/utils/screenShotPaths.ts](tests/utils/screenShotPaths.ts).

## Playwright config facts worth remembering

| Setting | Value | Why |
|---------|-------|-----|
| `baseURL` | `http://localhost:3335` | OHIF e2e uses 3335, not 3000 |
| `testIdAttribute` | `data-cy` | `getByTestId(...)` maps to `[data-cy="..."]` |
| `browser` | Chromium only | Firefox/WebKit disabled (SharedArrayBuffer + stability) |
| `retries` | 3 in CI, 0 locally | Flaky rendering needs CI retries |
| `workers` | 6 in CI, undefined locally | Parallel execution |
| `globalTimeout` / `timeout` | 800_000 ms | Medical image loads are slow |
| `actionTimeout` | 10_000 ms | Per-action cap |
| `webServer.command` | `cross-env APP_CONFIG=config/e2e.js COVERAGE=true OHIF_PORT=3335 nyc yarn start` | e2e config + coverage |

## Test data: which study for which test

| StudyInstanceUID | Mode | Used for |
|------------------|------|----------|
| `1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5` | `viewer` | General measurements, annotations, context menu |
| `1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785` | `viewer` | 3D, MPR, crosshairs |
| `1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458` | `viewer` or `segmentation` | Labelmap SEG |
| `1.2.840.113619.2.290.3.3767434740.226.1600859119.501` | `viewer` / `segmentation` / `tmtv` | RTSTRUCT/contour and TMTV |
| `1.3.6.1.4.1.14519.5.2.1.7695.4007.324475281161490036195179843543` | `viewer` | SR hydration |

Full mapping in [references/patterns-by-feature.md](references/patterns-by-feature.md). **Do not invent UIDs** — they must exist on the e2e data server.

## Rules (short, so they're actually read)

1. Import `test`, `expect`, and utilities from `./utils`, not `@playwright/test`.
2. Destructure fixture-injected page objects; don't `new` them.
3. Use normalized coordinates (0–1) for viewport interactions.
4. Use `visitStudy` with a real UID, correct mode, and a non-zero delay (2000 is conventional).
5. Handle hydration and measurement-tracking prompts where applicable.
6. Visual regression for canvas, DOM assertions for panels/dialogs/overlay text.
7. Use `data-cy` selectors (already wired via `testIdAttribute`).
8. When an assertion needs retry tolerance, wrap it in `expect.toPass({ timeout })`.
9. Test in the correct mode — segmentation tools aren't available in `viewer` mode.
10. If a utility isn't exported from `./utils`, import from the deeper path (see [references/utilities.md](references/utilities.md)).

## Pre-output self-check (mandatory)

Before returning a generated OHIF test, confirm all items:

1. Imports `test`/`expect` from `./utils` (not `@playwright/test`).
2. Uses fixture-injected keys and exact casing (especially `DOMOverlayPageObject`).
3. Uses normalized viewport interactions (`normalizedClickAt` / `normalizedDragAt`) unless there is a strong reason otherwise.
4. Uses a valid canonical StudyInstanceUID and compatible mode.
5. Handles hydration or measurement tracking prompts when the workflow requires them.
6. Uses visual regression for canvas assertions and DOM assertions for panel/dialog/overlay text state.
7. If execution was skipped, states that explicitly and provides concrete run commands.

## Output contract (for non-executing agents)

When execution cannot be performed in the current environment, the response should include:

1. The test code.
2. Assumptions made (if any).
3. Static checks that were verified.
4. What still must be run locally and exact commands to run.

## When to consult each reference

- **Before writing** → [references/patterns-by-feature.md](references/patterns-by-feature.md). Pick the seed spec for the feature area and read it. The seed spec is the closest thing to a live API example because it co-evolves with the code.
- **For a stable rule or idiom** (fixture keys, import paths, panel-access order, capital-D quirk, object-param convention) → [references/page-objects.md](references/page-objects.md), [references/utilities.md](references/utilities.md).
- **For a method name, property, or signature** → read the source under [tests/pages/](tests/pages/) or [tests/utils/](tests/utils/). Do not rely on a static table for these; they drift as the code is refactored.
- **When a test fails** → [references/failure-triage.md](references/failure-triage.md).
