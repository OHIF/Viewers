import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils/index';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode);
});

test.describe('MPR Test', async () => {
  test('should display a single DICOM image in a Stack viewport.', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page.locator('div').filter({ hasText: /^MPR$/ }).first().click();
    await checkForScreenshot(page, screenShotPaths.mpr.mprDisplayedCorrectly);
  });
});
