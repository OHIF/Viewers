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

  const segOverlayLabels = [
    '2D-TTA_NNU-NET_SEGMENTATION',
    'SEGMENTATION',
    '3D_LOWRES-TTA_NNU-NET_SEGMENTATION',
  ];
  const segAndRTOverlayLabels = [...segOverlayLabels, 'SERIES 3 - RTSTRUCT'];

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

  await expect(dataOverlayPageObject.overlaySegmentationRows).toHaveText(segOverlayLabels);

  // Hide the overlay menu and then show it again. The overlays from before should still be listed.
  await dataOverlayPageObject.toggle(); // hide
  await expect(dataOverlayPageObject.menu).not.toBeVisible();
  await dataOverlayPageObject.toggle(); // show
  await expect(dataOverlayPageObject.overlaySegmentationRows).toHaveText(segOverlayLabels);

  // Hide the overlay menu so the baseline holds only the rendered overlays.
  await dataOverlayPageObject.toggle();
  await expect(dataOverlayPageObject.menu).not.toBeVisible();

  const activeViewport = await viewportPageObject.active;

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

  await expect(dataOverlayPageObject.overlaySegmentationRows).toHaveText(segAndRTOverlayLabels);

  // Hide the overlay menu so the baseline holds only the rendered overlays.
  await dataOverlayPageObject.toggle();
  await expect(dataOverlayPageObject.menu).not.toBeVisible();

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.overlaySEGsAndRTDisplayed,
  });

  // Show the overlay menu again. The overlays from before should still be listed.
  await dataOverlayPageObject.toggle();
  await expect(dataOverlayPageObject.overlaySegmentationRows).toHaveText(segAndRTOverlayLabels);
});
