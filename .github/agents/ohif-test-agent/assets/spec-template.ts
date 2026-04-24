import {
  checkForScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
} from './utils';

test.beforeEach(async ({ page }) => {
  // Pick the right UID + mode for your feature (see references/patterns-by-feature.md)
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('FEATURE NAME', () => {
  test('describes the behaviour in one sentence', async ({
    page,
    viewportPageObject,
    mainToolbarPageObject,
    rightPanelPageObject,
    DOMOverlayPageObject, // capital D on purpose
  }) => {
    // 1. Arrange — select a tool, open a panel, etc.

    // 2. Act — interact with the viewport.
    //    Prefer normalized (0–1) coordinates:
    //    const activeViewport = await viewportPageObject.active;
    //    await activeViewport.normalizedClickAt([{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.7 }]);

    // 3. Handle prompts (first measurement prompts for tracking; SEG/RT/SR prompts for hydration)
    //    await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

    // 4. Assert canvas output via visual regression
    //    await checkForScreenshot(page, page, screenShotPaths.YOUR_CATEGORY.YOUR_KEY);

    // 5. Assert DOM state directly
    //    const count = await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount();
    //    expect(count).toBe(1);
  });
});
