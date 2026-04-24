# Failure triage

Before debugging, classify. Most OHIF test failures are timing or hydration — not real regressions.

| Category | Symptom | Fix |
|----------|---------|-----|
| Timing | Element not visible, action timeout | Add / increase the `delay` param of `visitStudy`; use `waitForTimeout` at known settle points; wrap the assertion in `expect.toPass({ timeout })` |
| Selector | Element not found | Verify `data-cy` on the target; confirm the panel is open (`toggle()` / `select()` before interacting); check for capital `D` in `DOMOverlayPageObject` when destructuring |
| Hydration | Segmentation/RT not interactive | Ensure the `segmentationHydration.yes.click()` fired; add `waitForTimeout(3000)` after `loadSeriesByModality('SEG'\|'RTSTRUCT'\|'SR')` |
| Data | Study not found, empty viewport | Confirm the UID is in the canonical list (see [patterns-by-feature.md](patterns-by-feature.md)); confirm the mode supports the feature (segmentation tools aren't in `viewer` mode) |
| Visual drift | Screenshot mismatch but feature works | Re-generate the baseline with `yarn playwright test --update-snapshots`; consider raising `maxDiffPixelRatio` to `0.04` for 3D content |
| Real regression | Feature is actually broken | Report as a bug — this is the test doing its job |

## The `toPass` pattern

When an assertion needs to wait for async render / propagation:

```ts
await expect(async () => {
  await rightPanelPageObject.labelMapSegmentationPanel.panel.segmentByText('Spleen').click();
  await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('17/');
}).toPass({ timeout: 10_000 });
```

`toPass` reruns the assertion block until it succeeds or the timeout expires — cleaner than a hand-rolled retry loop and surfaces the last failure reason if it times out.

## Common `DOMOverlayPageObject` mistake

The fixture key is capital-D `DOMOverlayPageObject`, not lowercase. If your destructure is silently `undefined`, check the casing.

## `press` import mistake

`press` is NOT re-exported from `./utils`. `import { press } from './utils'` resolves to `undefined` and fails at runtime. Use:

```ts
import { press } from './utils/keyboardUtils';
await press({ page, key: 'ArrowDown', nTimes: 50 }); // object param, not (page, key)
```

## Visual regression iteration

Screenshots live under `tests/screenshots/chromium/<testFilePath>/`. To accept new output as the baseline:

```sh
yarn playwright test tests/YourSpec.spec.ts --update-snapshots
```

Review the resulting PNGs carefully — an agent-accepted baseline that's subtly wrong is worse than a failing test.
