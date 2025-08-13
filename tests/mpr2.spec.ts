import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID =
    '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046&hangingprotocolid=mpr';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 10000);
});

test('should properly display MPR for MR', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  // await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await checkForScreenshot(page, page, screenShotPaths.mpr2.mprDisplayedCorrectly);

  await page.evaluate(() => {
    // Access cornerstone directly from the window object
    const cornerstone = window.cornerstone;
    if (!cornerstone) {
      return;
    }

    const enabledElements = cornerstone.getEnabledElements();
    if (enabledElements.length === 0) {
      return;
    }

    // Apply zoom to all viewports
    for (let i = 0; i < enabledElements.length; i++) {
      const viewport = enabledElements[i].viewport;
      if (viewport) {
        viewport.setZoom(4);
        viewport.render();
      }
    }
  });

  await checkForScreenshot(page, page, screenShotPaths.mpr2.mprDisplayedCorrectlyZoomed);
});
