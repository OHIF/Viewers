import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7695.4007.324475281161490036195179843543';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate SR reports correctly', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('trackedMeasurements-btn').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await checkForScreenshot(page, page, screenShotPaths.srHydration.srPreHydration);
  await page.getByTestId('yes-hydrate-btn').click();
  await checkForScreenshot(page, page, screenShotPaths.srHydration.srPostHydration);
  await page.getByTestId('measurement-item').first().click();
  await checkForScreenshot(page, page, screenShotPaths.srHydration.srJumpToMeasurement);
});
