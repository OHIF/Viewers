import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths, simulateClicksOnElement } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the bidirectional tool', async ({ page }) => {
  await page.getByTestId('MeasurementTools-split-button-secondary').click();
  await page.getByTestId('Bidirectional').click();
  const locator = page.getByTestId('viewport-pane').locator('canvas');

  await simulateClicksOnElement({
    locator,
    points: [
      {
        x: 405,
        y: 277,
      },
      {
        x: 515,
        y: 339,
      },
    ],
  });
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.bidirectional.bidirectionalDisplayedCorrectly
  );
});
