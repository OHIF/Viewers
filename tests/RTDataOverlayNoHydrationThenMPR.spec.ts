import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated RTSTRUCT chosen from the data overlay menu', async ({
  page,
}) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('dataOverlayMenu-default-btn').click();
  await page.getByTestId('AddSegmentationDataOverlay-default').click();
  await page.getByText('SELECT A SEGMENTATION').click();
  await page.getByTestId('ARIA RadOnc Structure Sets').click();

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayNoHydrationThenMPR.rtDataOverlayNoHydrationPreMPR
  );

  await page.getByTestId('Layout').click();
  await page.getByTestId('MPR').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayNoHydrationThenMPR.rtDataOverlayNoHydrationPostMPR
  );

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });
});
