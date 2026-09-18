---
sidebar_position: 3
sidebar_label: Playwright Viewport Screenshots
title: Playwright viewport screenshot scope
---

# Playwright viewport screenshot scope

Playwright tests whose assertions concern the viewport (rendering, overlays,
measurements, segmentations, etc.) should scope `checkForScreenshot` to the
viewport itself — or, at most, the entire viewport grid. They should **not**
capture the surrounding OHIF UI (toolbar, side panels, study browser, header,
etc.).

## Why

Full-page screenshots that include the app chrome are fragile and noisy:

- Any unrelated UI tweak (toolbar layout, panel styling, icon changes,
  measurement-panel rows, button states) regenerates the baseline and forces
  unrelated screenshot churn across the test suite.
- Diffs become harder to read — a small viewport regression hides inside a
  screenshot dominated by chrome.
- Tests that are nominally about viewport behavior end up gated on UI state
  that has nothing to do with the feature under test.

Scoping the screenshot to the viewport (or viewport grid) keeps baselines
stable, makes failures meaningful, and aligns the screenshot with what the
test is actually asserting.

## Migration

Pass a viewport-scoped locator as the second argument to `checkForScreenshot`:

- **Single viewport** — use `activeViewport.pane` (from
  `viewportPageObject.active`).
- **Whole viewport grid** (e.g. MPR, 3D-four-up, or any test concerned with
  multi-viewport layout) — use `viewportPageObject.grid`.

Avoid passing `page` as the locator for viewport-focused tests — that captures
the full page including all of the OHIF chrome.

**Before — full-page screenshot includes chrome:**

```ts
await checkForScreenshot(
  page,
  page,
  screenShotPaths.length.lengthDisplayedCorrectly
);
```

**After — single viewport:**

```ts
const activeViewport = await viewportPageObject.active;
// ... interact with the viewport ...

await checkForScreenshot(
  page,
  activeViewport.pane,
  screenShotPaths.length.lengthDisplayedCorrectly
);
```

**After — viewport grid (multi-viewport layouts):**

```ts
await mainToolbarPageObject.layoutSelection.MPR.click();

await checkForScreenshot(
  page,
  viewportPageObject.grid,
  screenShotPaths.mpr.mprDisplayedCorrectly
);
```

If a test legitimately needs to assert on chrome (panel content, toolbar
state, measurement-row text), prefer a targeted locator for that element
rather than a full-page screenshot that incidentally includes the viewport.
