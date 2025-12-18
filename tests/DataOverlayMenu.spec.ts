import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';
import { press } from './utils/keyboardUtils';

test('should display added, selected and removed segmentation promptly', async ({
  page,
  viewportPageObject,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.32722.99.99.239341353911714368772597187099978969331';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  // Add a segmentation overlay and ensure the overlay menu reflects this change.
  const dataOverlayPageObject = viewportPageObject.getById('default').overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation('2d-tta_nnU-Net_Segmentation');

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath:
      screenShotPaths.dataOverlayMenu.overlayMenuWith2d_tta_nnU_Net_SegmentationSelected,
  });

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();

  // navigate to the 51st image and ensure the correct overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 50 });

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlay2d_tta_nnU_Net_Segmentation,
  });

  // Show the overlay menu.
  await dataOverlayPageObject.toggle();

  // Change the segmentation overlay to a different one and ensure the overlay menu reflects this change.
  await dataOverlayPageObject.changeSegmentation('2d-tta_nnU-Net_Segmentation', 'Segmentation');

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlayMenuWithSegmentationSelected,
  });

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();

  // navigate to the 51st image and ensure the correct overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 50 });

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlaySegmentation,
  });

  // Show the overlay menu.
  await dataOverlayPageObject.toggle();

  // Remove the segmentation overlay and ensure the overlay menu reflects this change.
  await dataOverlayPageObject.remove('SEGMENTATION');

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlayMenuWithSegmentationOverlaysRemoved,
  });

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();

  // navigate to the 51st image and ensure no overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 50 });

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.noOverlay,
  });
});
