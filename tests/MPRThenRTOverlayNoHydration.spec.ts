import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';
import { viewportLocator } from './utils/locators';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated RTSTRUCT chosen from the data overlay menu', async ({
  page,
}) => {
  await page.getByTestId('Layout').click();
  await page.getByTestId('MPR').click();

  // Wait 5 seconds for MPR to load. This is necessary in particular when screen shots are added or replaced.
  await page.waitForTimeout(10000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenRTOverlayNoHydration.mprPreRTOverlayNoHydration
  );

  // Hover over the middle/sagittal viewport so that the data overlay menu is available.
  await viewportLocator({ viewportId: 'mpr-sagittal', page }).hover();
  await page.getByTestId('dataOverlayMenu-mpr-sagittal-btn').click();
  await page.getByTestId('AddSegmentationDataOverlay-mpr-sagittal').click();
  await page.getByText('SELECT A SEGMENTATION').click();
  await page.getByTestId('ARIA RadOnc Structure Sets').click();

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-mpr-sagittal-btn').click();

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Wait 5 seconds for RT to load. This is necessary in particular when screen shots are added or replaced.
  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.mprThenRTOverlayNoHydration.mprPostRTOverlayNoHydration,
    normalizedClip: { x: 0, y: 0, width: 1.0, height: 0.75 }, // clip to avoid any popups concerning surface creation and clipping
  });
});
