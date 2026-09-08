# Contributing to the Playwright E2E tests

This guide covers the conventions for writing and submitting Playwright
end-to-end tests. The idea behind it is to open the testing effort to the
whole community. Every contributed test broadens coverage and raises the
overall quality of the OHIF Viewer. Following these conventions keeps the
suite fast, stable, and reviewable, and makes it much more likely your PR
merges quickly. That is how we get to the larger goal: a viewer whose quality
we can guarantee.

The suite lives in this directory:

```text
playwright.config.ts     → Chromium-only, port 3335, `data-cy` as the test id attribute
tests/
├── *.spec.ts            → One spec per feature/behavior
├── pages/               → Page objects (ViewportPageObject, MainToolbarPageObject, …)
├── utils/               → Shared utilities (visitStudy, checkForViewportScreenshot, …)
│   └── fixture.ts       → Extends the Playwright test runner and injects page objects
└── screenshots/         → Visual regression baselines
```

## Getting started

You might need to run `pnpm exec playwright install` for the first time if you have not.

```bash
# one-time setup
pnpm install
pnpm run test:data                     # pull the DICOM test data submodule
pnpm exec playwright install chromium  # install the browser

# run the whole suite (starts the viewer on port 3335 automatically)
pnpm run test:e2e:ci

# iterate on a single spec
TEST_ENV=true pnpm exec playwright test tests/YourNew.spec.ts

# other useful modes
pnpm run test:e2e:ui                              # Playwright UI mode
pnpm run test:e2e:headed                          # headed browser
pnpm exec playwright show-report tests/playwright-report
```

When passing Playwright flags (`--update-snapshots`, `--reporter`, `-g`),
invoke Playwright directly as above. `pnpm run test:e2e -- <flags>` inserts a
`--` separator that can keep Playwright from parsing them.

## Start from a seed spec

This is the single most important habit. The suite follows consistent idioms
that are easier to mimic than to reinvent. Before writing a new test, find an
existing spec that covers the same area (measurements, segmentation, MPR/3D,
hydration, panels, …), read it end to end, and adapt it. When a spec or this
guide disagrees with the current source under `tests/pages/` or
`tests/utils/`, the source wins.

## The rules at a glance

1. Import `test`, `expect`, and utilities from `./utils`, never from
   `@playwright/test`.
2. Destructure fixture-injected page objects from the test arguments; never
   `new` them.
3. Reach every application control through a page object, with no raw
   `page.getByTestId(...)` or `getByRole(...)` calls in specs.
4. Prefer normalized coordinates (0 to 1) for viewport clicks and drags, so
   the test doesn't depend on viewport size.
5. Load studies with `visitStudy` using a real StudyInstanceUID and the
   correct mode, and handle hydration and tracking prompts.
6. Use web-first, auto-retrying assertions with exact expected values; never
   grab a value and then assert it.
7. After an action that re-renders the viewport, await the render signal
   (`waitForViewportRenderCycle`) instead of sleeping.
8. Assert the actual effect (the image zoomed, the segment is gone), not a
   proxy attribute like `data-active` or a bare count.
9. Screenshots only for canvas-only output: viewport-scoped, text-free
   baselines, named via `screenShotPaths`.
10. `await` every locator action and every assertion.

The sections below explain each rule briefly.

## Test anatomy

Tests are not vanilla Playwright. `tests/utils/fixture.ts` extends the test
runner and injects page objects bound to the right `page`:

```ts
// ✅ Correct: fixtures and utilities come from the barrel
import { test, expect, visitStudy, checkForViewportScreenshot, screenShotPaths } from './utils';

// ❌ Wrong: compiles, but page-object fixtures are never injected
import { test, expect } from '@playwright/test';

test('renames a segment', async ({
  viewportPageObject,
  mainToolbarPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  DOMOverlayPageObject, // note the capital D; fixture keys are exact
}) => {
  // ...
});
```

## Loading a study

Every test starts with `visitStudy` in a `beforeEach`. The UID must exist on
the e2e data server, so do not invent UIDs:

```ts
test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000); // 2s settle delay is the convention
});
```

Commonly used studies:

| StudyInstanceUID | Mode | Used for |
| --- | --- | --- |
| `1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5` | `viewer` | Measurements, annotations, context menu |
| `1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785` | `viewer` | 3D, MPR, crosshairs |
| `1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458` | `viewer` / `segmentation` | Labelmap SEG |
| `1.2.840.113619.2.290.3.3767434740.226.1600859119.501` | `viewer` / `segmentation` / `tmtv` | RTSTRUCT/contour, TMTV (use a `10000` delay in `tmtv`) |
| `1.3.6.1.4.1.14519.5.2.1.7695.4007.324475281161490036195179843543` | `viewer` | SR hydration |

Test in the mode that provides the feature. Segmentation tools, for example,
are not available in `viewer` mode.

Some workflows show prompts that must be handled before anything else works:
loading SEG/RTSTRUCT/SR data asks whether to hydrate, and the first
measurement asks whether to start tracking. Answer them through
`DOMOverlayPageObject` (see an existing hydration spec for the exact
sequence).

## Interacting with the viewport

The viewport is a WebGL canvas, so you cannot select rendered pixels with
CSS. Prefer normalized coordinates (0 to 1, origin top-left) so tests are
independent of viewport size. Reach for absolute pixels only when the target
is genuinely pixel-anchored, and say why in a comment:

```ts
const activeViewport = await viewportPageObject.active;

await activeViewport.normalizedClickAt([{ x: 0.5, y: 0.5 }]);
await activeViewport.normalizedDragAt({ start: { x: 0.3, y: 0.3 }, end: { x: 0.7, y: 0.7 } });
```

## Wait for renders, don't sleep

`page.waitForTimeout(...)` after a viewport-changing action is a flake
source. Too short and the test fails; too long and the suite crawls. The
viewports report when they are done. Wait on that signal, and start the
watcher before the action so you don't miss the cycle:

```ts
// ❌ Sleep-and-pray
await segmentRow.delete();
await page.waitForTimeout(5000);

// ✅ Wait on the actual render signal
const renderCycle = waitForViewportRenderCycle(page);
await segmentRow.delete();
await renderCycle;
```

Capture the promise immediately before the step that triggers the render.
Captured ahead of a multi-step sequence, it resolves on an intermediate
render and the final await becomes a no-op. Use
`waitForViewportsRendered(page)` when the render is already in flight (layout
switch, series load). For DOM-side state (panel rows, dialogs), rely on
auto-retrying assertions instead; they wait for you.

Every remaining `waitForTimeout`, `hover`, or non-obvious interaction in your
spec must be justified, ideally with a code comment, or removed. Expect a
reviewer to ask "why is this needed?" for each one.

## Assertions

Use Playwright's web-first assertions, which auto-retry until they pass or
time out. Never read a value into a variable and assert the variable; that
races the UI:

```ts
// ❌ Grab-then-assert: no retry, flaky
const count = await panel.rows.count();
expect(count).toBe(3);

// ✅ Web-first: retries until the UI settles
await expect(panel.rows).toHaveCount(3);
await expect(segmentRow.title).toHaveText('Segment 5');
```

- Assert exact expected values: `toHaveText`, exact `toHaveCount`,
  `toHaveAttribute`. Avoid `toBeTruthy`, `toContainText`, and `>=`-style
  loose counts.
- `expect(locator).not.toBeNull()` is always a no-op, because a locator is
  never null. Use `toBeVisible()`.
- When a value can only come through a method, use
  `await expect.poll(() => ...)`.
- Reserve capture-then-compare (e.g. saving an SVG `d` to diff before/after)
  for whole-SVG show/hide checks; anything updated incrementally should use
  the retrying `toHaveAttribute`. When you do capture, first assert the
  captured value is not null (`null === null` passes vacuously), and capture
  only after the render settles. A too-early capture snapshots a transient
  preview path that never matches the persisted one.
- Verify the outcome, not a proxy. After deleting a segment, assert the
  deleted name is gone from the list, not merely that the count dropped.
  After activating a tool, drag on the viewport and confirm the image
  responded. Asserting that the toolbar button looks active proves only that
  the button changed, not that the tool does anything to the canvas.
  Assert the side-panel state too (e.g. the clicked segment is highlighted,
  not only that the viewport navigated).
- A drawn annotation must be visible, not merely present. `toHaveCount(n)`
  plus a non-null `d` still passes when a regression hides the path, so add
  `toBeVisible()` after drawing and after navigating back.
- Cover the granular case, not only the bulk one (toggle a single segment,
  not just "toggle all"), and interact out of listed order where order
  shouldn't matter.
- Assert preconditions before relying on hardcoded indices (e.g. expect the
  initial count before addressing "row 4").
- `await` every locator action and assertion. A floating `.click()` or
  un-awaited `toHaveText` lets a broken test pass silently. Custom failure
  messages must describe the check they guard.

## Page objects

Specs must read as intent, not as a pile of selectors. If the control you need
isn't exposed by a page object, extend one (or add a new one) rather than
inlining `page.*` calls:

| What you need | Where it belongs |
| --- | --- |
| A toolbar button or tool | `MainToolbarPageObject` |
| A menu, prompt, or small dialog | `DOMOverlayPageObject` |
| A substantial dialog with its own fields | Its own page object, reached through `DOMOverlayPageObject` (see `DicomTagBrowserPageObject`) |
| A side-panel control | `LeftPanelPageObject` / `RightPanelPageObject` |
| Anything inside a viewport | `ViewportPageObject` |

Conventions that come up in every review:

- Page-object methods return Locators, not extracted values, so specs can
  use web-first assertions. Absence checks go through the page object too
  (e.g. filter a titles locator and expect count 0).
- Put actions on the object that owns the element. A row click belongs on
  the row object, and it should target a safe spot (the title, not wherever a
  visibility toggle might sit).
- Scope child locators to their parent locator, not to `page`. This also
  avoids needing globally unique `data-cy` values.
- Expose one locator per control, anchored on the element that receives
  clicks and carries the interactive state.
- If a control has no `data-cy`, add one to the source component (the config
  maps `getByTestId` to `data-cy`) and call it out in your PR. Follow existing
  `data-cy` naming patterns, include the segmentation representation type
  where relevant, and spell-check the value; a typo passes CI and pollutes
  production code. Don't add new props or attributes to production components
  when an existing hook works.
- When you replace one raw `page.*` call, sweep the spec for every similar
  call and replace them all.
- Remove the `page` fixture from the test signature once nothing uses it.

## Utilities

- Logic repeated across specs belongs in `tests/utils/`. Before adding a
  utility, check whether one already covers it. Don't add wrappers that
  contribute nothing; a function whose only body is a wait shouldn't exist.
- New utilities take a single object parameter with defaults, not positional
  arguments. Some existing helpers (e.g. `visitStudy`) predate this — check
  each utility's signature before calling it.
- Import utilities through the `./utils` barrel. A few helpers are
  intentionally not re-exported; only then import from the deeper path.
- Hoist literals repeated within a spec (e.g. a click-coordinate array) into
  a file-level constant.
- Shared expectations belong in `tests/utils/assertions.ts`.

## Screenshots (visual regression)

Reach for the cheapest faithful signal, in this order:

1. If the result has a DOM or SVG signal, assert on it. Panel counts, dialog
   and overlay text, enabled state, and SVG annotation paths are all DOM; no
   screenshot needed.
2. If the result exists only as pixels on the WebGL canvas, a
   viewport-scoped screenshot is the correct tool.
3. Never substitute a `window.services` state read for a render assertion.
   It passes even when rendering is broken.

Rules for new screenshot assertions:

- Capture viewports with `checkForViewportScreenshot({ page, viewport, screenshotPath })`,
  which hides overlay text before the shot. Keep text out of baselines;
  dates, series descriptions, and W/L values drift and make them fragile.
- Never screenshot the full app. Scope via a locator (a viewport pane or
  `viewportPageObject.grid`); use `checkForScreenshot` (object form) only for
  non-viewport locators.
- Name baselines with `screenShotPaths.<category>.<name>` from
  `tests/utils/screenShotPaths.ts`, not hand-typed strings.
- Pair the screenshot with the DOM assertions that exist for the same outcome
  (e.g. the exact SVG path count). The count verifies topology; the pixels
  verify appearance.
- Don't add `normalizedClip` unless you're targeting a sub-region of a
  locator, and never tune `maxDiffPixelRatio` or `threshold` to make a test
  pass. If a baseline mismatches, fix the flake or regenerate the baseline
  with `--update-snapshots` and review the diff by eye before committing.
- A missing baseline is written on the spot by Playwright. Because
  `checkForScreenshot` retries, the first run then compares against the file it
  just wrote and usually **passes** — an unreviewed baseline can slip in
  silently. Always open the new PNG under `tests/screenshots/chromium/<spec>/`
  and confirm it shows what you expect before committing it.

## Naming

- Spec file names must be unambiguous. Does `ContourSegRename` rename a
  segment or a segmentation? Say which.
- Test titles are precise and non-repetitive; method and parameter names are
  self-explanatory (`newName`, not `text`). Check for an existing naming
  precedent before inventing one, add a doc comment when a method's purpose
  isn't clear from its name, and fix typos before pushing; automated
  reviewers flag every one.
- Remember there are two segmentation representations, contour and labelmap.
  Don't give a helper a generic name if it only handles one, and encode the
  representation type in signatures and `data-cy` values where it matters.
  The inverse holds too. A feature that isn't segmentation-specific shouldn't
  carry segmentation in its name.

## Submitting your PR

- Keep the scope small: one feature or behavior per PR. Small, decoupled PRs
  get reviewed much faster (see the general
  [contributing guidelines](https://docs.ohif.org/development/contributing)).
- Title the PR in [Conventional Commits](https://www.conventionalcommits.org/)
  form — `<type>(<scope>): <subject>`, e.g.
  `test(contour): add segment rename interactions` — not the auto-filled branch
  name. The repo's release tooling parses these to derive the semantic version,
  so the type matters. See this
  [quick reference](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716).

## Agentic development

- The in-repo agent skill at `.agents/skills/ohif-test-agent/` mirrors these
  conventions and adds per-feature seed-spec pointers
  (`references/patterns-by-feature.md`) and a failure-triage guide
  (`references/failure-triage.md`). It's useful reading for humans too, and
  an AI coding agent working in this repo follows the same rules.
- Most test failures are timing or hydration issues, not real regressions,
  so check `references/failure-triage.md` before debugging deeply.
