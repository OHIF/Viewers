import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';
import { press } from './utils/keyboardUtils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.3671.4754.298665348758363466150039312520';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should overlay an unhydrated SEG over a display set that the SEG does NOT reference', async ({
  page,
  leftPanelPageObject,
  viewportPageObject,
}) => {
  await leftPanelPageObject.loadSeriesByDescription('Apparent Diffusion Coefficient');

  await viewportPageObject.getById('default').overlayMenu.dataOverlay.toggle();

  await viewportPageObject
    .getById('default')
    .overlayMenu.dataOverlay.addSegmentation('T2 Weighted Axial Segmentations');

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide the overlay menu.
  await viewportPageObject.getById('default').overlayMenu.dataOverlay.toggle();
  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 12 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayMiddleImage
  );
});
