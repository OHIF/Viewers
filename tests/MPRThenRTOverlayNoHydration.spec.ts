import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated RTSTRUCT chosen from the data overlay menu', async ({
  page,
}) => {
  await page.getByTestId('side-panel-header-right').click();

  await page.getByTestId('Layout').click();
  await page.getByTestId('MPR').click();

  await page.waitForTimeout(5000);
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenRTOverlayNoHydration.mprPreRTOverlayNoHydration
  );

  // Hover over the middle/sagittal viewport so that the data overlay menu is available.
  await page.locator('css=div[data-viewportid="mpr-sagittal"]').hover();
  await page.getByTestId('dataOverlayMenu-mpr-sagittal-btn').click();
  await page.getByTestId('AddSegmentationDataOverlay-mpr-sagittal').click();
  await page.getByText('SELECT A SEGMENTATION').click();
  await page.getByTestId('ARIA RadOnc Structure Sets').click();

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-mpr-sagittal-btn').click();

  await page.waitForTimeout(5000);
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenRTOverlayNoHydration.mprPostRTOverlayNoHydration
  );
});
