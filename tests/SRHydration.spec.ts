import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7695.4007.324475281161490036195179843543';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate SR reports correctly', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('trackedMeasurements-btn').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await page.waitForTimeout(2000);
  await checkForScreenshot(page, page, screenShotPaths.srHydration.srPreHydration);

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

    const viewport = enabledElements[0].viewport;
    if (viewport) {
      viewport.setZoom(4);
      viewport.render();
    }
  });

  await page.getByTestId('yes-hydrate-btn').click();
  await page.waitForTimeout(2000);
  await checkForScreenshot(page, page, screenShotPaths.srHydration.srPostHydration);

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

    const viewport = enabledElements[0].viewport;
    if (viewport) {
      viewport.scroll(20);
      viewport.render();
    }
  });

  await page.getByTestId('data-row').first().click();

  await checkForScreenshot(page, page, screenShotPaths.srHydration.srJumpToMeasurement);
});
