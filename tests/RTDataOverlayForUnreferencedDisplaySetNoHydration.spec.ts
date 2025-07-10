import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should overlay an unhydrated RTSTRUCT over a display set that the RTSTRUCT does NOT reference', async ({
  page,
}) => {
  await page.getByTestId('dataOverlayMenu-default-btn').click();
  await page.getByTestId('AddSegmentationDataOverlay-default').click();
  await page.getByText('SELECT A SEGMENTATION').click();
  await page.getByTestId('Contours on PET').click();

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForUnreferencedDisplaySetNoHydration.overlayFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 23 });

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForUnreferencedDisplaySetNoHydration.overlayMiddleImage
  );
});
