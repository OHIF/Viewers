import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths, simulateClicksOnElement } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 5000);
});

test('should hydrate in MPR correctly', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('trackedMeasurements-btn').click();

  // get the div that has Body 4.0 Lung I and double click it

  await page.locator(':text("S:7")').first().dblclick();

  await page.waitForTimeout(5000);

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
      viewport.setImageIdIndex(20);
      viewport.render();
    }
  });

  await page.waitForTimeout(5000);

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

  // wait 2 seconds
  await page.waitForTimeout(2000);

  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  // scroll away
  await checkForScreenshot(page, page, screenShotPaths.jumpToMeasurementMPR.initialDraw);

  // Focus on the canvas first, then use mouse wheel to scroll away
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
      viewport.setImageIdIndex(0);
      viewport.render();
    }
  });

  // wait 5 seconds
  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.jumpToMeasurementMPR.scrollAway);

  await page.getByTestId('data-row').first().click();

  await checkForScreenshot(page, page, screenShotPaths.jumpToMeasurementMPR.jumpToMeasurementStack);

  await page.getByTestId('Layout').click();
  await page.locator('div').filter({ hasText: /^MPR$/ }).first().click();

  // wait 5 seconds
  await page.waitForTimeout(5000);

  // jump in viewport again
  await page.getByTestId('data-row').first().click();

  await page.waitForTimeout(3000);

  await checkForScreenshot(page, page, screenShotPaths.jumpToMeasurementMPR.jumpInMPR);

  await page.locator(':text("S:3")').first().dblclick();

  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.jumpToMeasurementMPR.changeSeriesInMPR);

  await page.getByTestId('data-row').first().click();

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.jumpToMeasurementMPR.jumpToMeasurementAfterSeriesChange
  );
});
