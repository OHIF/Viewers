import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths, simulateDrag } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode);
});

test('should display the length tool', async ({ page }) => {
  await page.getByTestId('MeasurementTools-split-button-primary').click();
  const locator = page.locator('.cornerstone-canvas');
  await simulateDrag(page, locator);
  await checkForScreenshot(page, page, screenShotPaths.length.lengthDisplayedCorrectly);
});
