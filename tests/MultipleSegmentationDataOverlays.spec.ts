import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';
import { press } from './utils/keyboardUtils';
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
  const dataOverlayPageObject = viewportPageObject.getById('default').overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation('2d-tta_nnU-Net_Segmentation');

  // A short wait after each overlay is selected to ensure it loads.
  await page.waitForTimeout(5000);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await dataOverlayPageObject.addSegmentation('Segmentation');

  // A short wait after each overlay is selected to ensure it loads.
  await page.waitForTimeout(5000);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await dataOverlayPageObject.addSegmentation('3d_lowres-tta_nnU-Net_Segmentation');

  // A short wait after each overlay is selected to ensure it loads.
  await page.waitForTimeout(5000);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.threeSegOverlaysInOverlayMenu,
  });

  // Hide the overlay menu and then show it again. The overlays from before should still be displayed.
  await dataOverlayPageObject.toggle(); // hide
  await dataOverlayPageObject.toggle(); // show

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.threeSegOverlaysInOverlayMenu,
  });

  await dataOverlayPageObject.toggle(); // hide

  // Navigate to image 56.
  await press({ page, key: 'ArrowDown', nTimes: 55 });

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.overlaysDisplayed,
  });

  // Now add the RT overlay
  await dataOverlayPageObject.toggle();

  await dataOverlayPageObject.addSegmentation('Series 3 - RTSTRUCT');

  // A short wait after each overlay is selected to ensure it loads.
  await page.waitForTimeout(5000);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.overlaySEGsAndRTDisplayed,
  });

  // Hide the overlay menu and then show it again. The overlays from before should still be displayed.
  await dataOverlayPageObject.toggle(); // hide
  await dataOverlayPageObject.toggle(); // show

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.multipleSegmentationDataOverlays.overlaySEGsAndRTDisplayed,
  });
});
