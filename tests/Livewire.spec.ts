import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths, simulateClicksOnElement } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the livewire tool', async ({ page }) => {
  await page.getByTestId('MeasurementTools-split-button-secondary').click();
  await page.getByTestId('LivewireContour').click();
  const locator = page.getByTestId('viewport-pane').locator('canvas');
  await simulateClicksOnElement({
    locator,
    points: [
      {
        x: 380,
        y: 459,
      },
      {
        x: 420,
        y: 396,
      },
      {
        x: 523,
        y: 392,
      },
      {
        x: 581,
        y: 447,
      },
      {
        x: 482,
        y: 493,
      },
      {
        x: 383,
        y: 461,
      },
    ],
  });
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();
  await checkForScreenshot(page, page, screenShotPaths.livewire.livewireDisplayedCorrectly);
});
