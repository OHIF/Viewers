import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';
import { press } from './utils/keyboardUtils';

test('should display added, selected and removed segmentation promptly', async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.32722.99.99.239341353911714368772597187099978969331';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  // Add a segmentation overlay and ensure the overlay menu reflects this change.
  await page.getByTestId('dataOverlayMenu-default-btn').click();
  await page.getByTestId('AddSegmentationDataOverlay-default').click();
  await page.getByText('SELECT A SEGMENTATION').click();
  await page.getByTestId('2d-tta_nnU-Net_Segmentation').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath:
      screenShotPaths.dataOverlayMenu.overlayMenuWith2d_tta_nnU_Net_SegmentationSelected,
  });

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  // navigate to the 51st image and ensure the correct overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 50 });

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlay2d_tta_nnU_Net_Segmentation,
  });

  // Show the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  // Change the segmentation overlay to a different one and ensure the overlay menu reflects this change.
  await page.getByTestId('overlay-ds-select-value-2D-TTA_NNU-NET_SEGMENTATION').click();
  await page.getByTestId('Segmentation-SEG').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlayMenuWithSegmentationSelected,
  });

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  // navigate to the 51st image and ensure the correct overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 50 });

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlaySegmentation,
  });

  // Show the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  // Remove the segmentation overlay and ensure the overlay menu reflects this change.
  await page.getByTestId('overlay-ds-more-button-SEGMENTATION').click();
  await page.getByTestId('overlay-ds-remove-button-SEGMENTATION').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.overlayMenuWithSegmentationOverlaysRemoved,
  });

  // Hide the overlay menu.
  await page.getByTestId('dataOverlayMenu-default-btn').click();

  // navigate to the 51st image and ensure no overlay is displayed
  await press({ page, key: 'ArrowDown', nTimes: 50 });

  await page.waitForTimeout(5000);

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.dataOverlayMenu.noOverlay,
  });
});
