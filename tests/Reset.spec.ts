import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should reset the image to its original state', async ({ page }) => {
  await page.getByTestId('MoreTools-split-button-secondary').click();
  await page.getByTestId('rotate-right').click();
  await page.getByTestId('MoreTools-split-button-secondary').click();
  await page.getByTestId('invert').click();
  await page.getByTestId('MoreTools-split-button-secondary').click();
  await page.getByTestId('Reset').click();
  await checkForScreenshot(page, page, screenShotPaths.reset.resetDisplayedCorrectly);
});
