import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';
import { viewportLocator } from './utils/locators';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated SEG chosen from the data overlay menu', async ({
  page,
}) => {
  await page.getByTestId('side-panel-header-right').click();

  await page.getByTestId('Layout').click();
  await page.getByTestId('MPR').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenSEGOverlayNoHydration.mprPreSEGOverlayNoHydration
  );

  // Hover over the middle/sagittal viewport so that the data overlay menu is available.
  await viewportLocator({ viewportId: 'mpr-sagittal', page }).hover();
  await page.getByTestId('dataOverlayMenu-mpr-sagittal-btn').click();
  await page.getByTestId('AddSegmentationDataOverlay-mpr-sagittal').click();
  await page.getByText('SELECT A SEGMENTATION').click();
  await page.getByTestId('Segmentation').click();

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-mpr-sagittal-btn').click();

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenSEGOverlayNoHydration.mprPostSEGOverlayNoHydration
  );
});
