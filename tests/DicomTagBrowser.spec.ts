import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the dicom tag browser', async ({ page }) => {
  await page.getByTestId('MoreTools-split-button-secondary').click();
  await page.getByTestId('TagBrowser').click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.dicomTagBrowser.dicomTagBrowserDisplayedCorrectly
  );
});
