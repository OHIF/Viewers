import { test } from 'playwright-test-coverage';
import {
  visitStudy,
  addSegmentationViaOverlayMenu,
  checkForScreenshot,
  screenShotPaths,
} from './utils';
import { press } from './utils/keyboardUtils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should overlay an unhydrated RTSTRUCT over a display set that the RTSTRUCT does reference', async ({
  page,
}) => {
  const segmentationName = 'Contours on PET';

  // Add segmentation to viewport 2 (series referenced by RTStruct)
  await addSegmentationViaOverlayMenu(page, 2, segmentationName);

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 23 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefMiddleImage
  );
});

test('should sequentially overlay an unhydrated RTSTRUCT over display set that the RTSTRUCT does and does NOT reference', async ({
  page,
}) => {
  const segmentationName = 'Contours on PET';

  // Add segmentation to viewport 0
  await addSegmentationViaOverlayMenu(page, 0, segmentationName);

  // Add segmentation to viewport 2 (series referenced by RTStruct)
  // NOTE: this current doesn't load
  await addSegmentationViaOverlayMenu(page, 2, segmentationName);

  // Add segmentation to viewport 1 (not referenced)
  await addSegmentationViaOverlayMenu(page, 1, segmentationName);

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefFirstImage
  );

  // Use panel to focus all images to centre of small sphere segment
  const smallSphereRow = page.getByTestId('data-row').filter({ hasText: 'Small Sphere' });
  await smallSphereRow.click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefMiddleImage
  );
});

test('should sequentially overlay an unhydrated RTSTRUCT over display set that the RTSTRUCT does reference', async ({
  page,
}) => {
  const segmentationName = 'Contours on PET';

  // Add referenced display set to viewport 0
  await page.getByTestId('study-browser-thumbnail').filter({ hasText: 'AC192' }).dblclick();

  // Add segmentation to viewport 0
  await addSegmentationViaOverlayMenu(page, 0, segmentationName);

  // Should it show up on viewport 2 (also referenced)?
  // Either way, should be caught by screenshot

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayDupeRefFirstImage
  );

  // Use panel to focus all images to centre of small sphere segment
  const smallSphereRow = page.getByTestId('data-row').filter({ hasText: 'Small Sphere' });
  await smallSphereRow.click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayDupeRefMiddleImage
  );
});
