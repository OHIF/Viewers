import { test } from 'playwright-test-coverage';
import {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  simulateNormalizedClicksOnElement,
  simulateNormalizedClickOnElement,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should the context menu completely on screen and is not clipped for a point near the bottom edge of the screen', async ({
  page,
}) => {
  await page.getByTestId('MeasurementTools-split-button-secondary').click();
  await page.locator('css=div[data-cy="Length"]').click();
  const locator = page.getByTestId('viewport-pane').locator('canvas');
  await simulateNormalizedClicksOnElement({
    locator,
    normalizedPoints: [
      {
        x: 0.45,
        y: 0.98,
      },
      {
        x: 0.55,
        y: 0.98,
      },
    ],
  });

  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  await checkForScreenshot(page, page, screenShotPaths.contextMenu.preContextMenuNearBottomEdge);

  await simulateNormalizedClickOnElement({
    locator,
    normalizedPoint: {
      x: 0.55,
      y: 0.98,
    },
    button: 'right',
  });

  await checkForScreenshot({
    page,
    locator: page,
    screenshotPath: screenShotPaths.contextMenu.contextMenuNearBottomEdgeNotClipped,
  });
});
