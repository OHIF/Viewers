import {
  checkForScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
} from './utils';
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

  const dataOverlayPageObject = (await viewportPageObject.getById('default')).overlayMenu
    .dataOverlay;
  await dataOverlayPageObject.toggle();

  // Start watching for viewport to render
  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await dataOverlayPageObject.addSegmentation('T2 Weighted Axial Segmentations');

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();

  await viewportRenderCycle;

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 12 });

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayMiddleImage
  );
});
