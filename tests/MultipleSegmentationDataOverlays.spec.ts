import {
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
} from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.32722.99.99.239341353911714368772597187099978969331';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display multiple segmentation overlays (both SEG and RT)', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();

  // Add multiple segmentation overlays and ensure the overlay menu reflects this change.
  const dataOverlayPageObject = (await viewportPageObject.getById('default')).overlayMenu
    .dataOverlay;
  await dataOverlayPageObject.toggle();
  let viewportRenderCycle = waitForViewportRenderCycle(page);
  await dataOverlayPageObject.addSegmentation('2d-tta_nnU-Net_Segmentation');
  await viewportRenderCycle;

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  viewportRenderCycle = waitForViewportRenderCycle(page);
  await dataOverlayPageObject.addSegmentation('Segmentation');
  await viewportRenderCycle;

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  viewportRenderCycle = waitForViewportRenderCycle(page);
  await dataOverlayPageObject.addSegmentation('3d_lowres-tta_nnU-Net_Segmentation');
  await viewportRenderCycle;

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.threeSegOverlaysInOverlayMenu,
  });

  // Hide the overlay menu and then show it again. The overlays from before should still be displayed.
  await dataOverlayPageObject.toggle(); // hide
  await dataOverlayPageObject.toggle(); // show

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.threeSegOverlaysInOverlayMenu,
  });

  await dataOverlayPageObject.toggle(); // hide

  // Navigate to image 56. Keyboard navigation is focus-dependent and lossy,
  // so jump via the app command and pin the landing slice before capturing.
  await activeViewport.sliceNavigation.toSlice(55);

  await waitForViewportsRendered(page);
  await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('I:56');

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.overlaysDisplayed,
  });

  // Now add the RT overlay
  await dataOverlayPageObject.toggle();

  viewportRenderCycle = waitForViewportRenderCycle(page);
  await dataOverlayPageObject.addSegmentation('Series 3 - RTSTRUCT');
  await viewportRenderCycle;

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.overlaySEGsAndRTDisplayed,
  });

  // Hide the overlay menu and then show it again. The overlays from before should still be displayed.
  await dataOverlayPageObject.toggle(); // hide
  await dataOverlayPageObject.toggle(); // show

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.overlaySEGsAndRTDisplayed,
  });
});
