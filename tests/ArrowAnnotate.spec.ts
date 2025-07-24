import { test } from 'playwright-test-coverage';
import {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  simulateClicksOnElement,
  simulateDoubleClickOnElement,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the arrow tool and allow free-form text to be entered', async ({ page }) => {
  await page.getByTestId('trackedMeasurements-btn').click();

  await page.getByTestId('MeasurementTools-split-button-secondary').click();
  await page.getByTestId('ArrowAnnotate').click();

  const locator = page.getByTestId('viewport-pane').locator('canvas');
  await simulateClicksOnElement({
    locator,
    points: [
      {
        x: 164,
        y: 234,
      },
      {
        x: 344,
        y: 232,
      },
    ],
  });

  await page.getByTestId('dialog-input').fill('Ringo Starr was the drummer for The Beatles');
  await page.getByTestId('input-dialog-save-button').click();

  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  await page.waitForTimeout(2000);

  await checkForScreenshot({
    page,
    maxDiffPixelRatio: 0.0075,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly0,
  });

  // Now edit the arrow text and the label should not change.

  await simulateDoubleClickOnElement({
    locator,
    point: {
      x: 164,
      y: 234,
    },
  });

  await page.getByTestId('dialog-input').fill('Neil Peart was the drummer for Rush');
  await page.getByTestId('input-dialog-save-button').click();

  await page.waitForTimeout(2000);

  await checkForScreenshot({
    page,
    maxDiffPixelRatio: 0.0075,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly1,
  });

  // Now edit the label and the text should not change.

  await page.getByTestId('actionsMenuTrigger').click();
  await page.getByTestId('Rename').click();

  await page.getByTestId('dialog-input').fill('Drummer annotation arrow');
  await page.getByTestId('input-dialog-save-button').click();

  await page.waitForTimeout(2000);

  await checkForScreenshot({
    page,
    maxDiffPixelRatio: 0.0075,
    screenshotPath: screenShotPaths.arrowAnnotate.arrowAnnotateDisplayedCorrectly2,
  });
});
