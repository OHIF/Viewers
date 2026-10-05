import {
  checkForGridScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
} from './utils';
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

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath:
      screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayFirstImage,
  });

  // Navigate to the middle image of the default viewport. Keyboard
  // navigation is focus-dependent and lossy, so jump via the app command.
  const defaultViewport = await viewportPageObject.getById('default');
  await defaultViewport.sliceNavigation.toSlice(12);
  await waitForViewportsRendered(page);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath:
      screenShotPaths.segDataOverlayForUnreferencedDisplaySetNoHydration.overlayMiddleImage,
  });
});
