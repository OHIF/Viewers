import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should overlay an unhydrated SEG over a display set that the SEG does NOT reference', async ({
  page,
}) => {
  await page.getByTestId('dataOverlayMenu-default-btn').click();
  await page.getByTestId('AddSegmentationDataOverlay-default').click();
  await page.getByText('SELECT A SEGMENTATION').click();
  await page.getByTestId('Segmentation').click();

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 9 });

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayMiddleImage
  );
});
