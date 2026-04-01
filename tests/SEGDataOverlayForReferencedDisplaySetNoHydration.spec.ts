//import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, test, screenShotPaths } from './utils';
import { press } from './utils/keyboardUtils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.12201.1091.126683095609223531686845324113579088978';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

// >>>>> Test Summaries
// 1. Load segmentation on referenced DS

// 2. Load segmentation on unreferenced DS (pixels different on PET - showing CT instead of PET)
//    -> Skipping for now

// 3. Load segmentation on viewport 0, check doesn't show up on overlay, delete (from menu), check able to add again

// <<<<<<< Test Summaries

// 1. Load segmentation on referenced DS
test('should overlay an unhydrated segmentation over a display set that the segmentation does reference', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const segmentationName = 'Segmentation FOR1';

  // Add segmentation to viewport 0 (series referenced by segmentation)
  const dataOverlayPageObject = (await viewportPageObject.getNth(0)).overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation(segmentationName);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObject.toggle();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    (await viewportPageObject.active).pane,
    screenShotPaths.segDataOverlayForReferencedDisplaySetNoHydration.overlayRefFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    (await viewportPageObject.active).pane,
    screenShotPaths.segDataOverlayForReferencedDisplaySetNoHydration.overlayRefMiddleImage
  );

  // Use panel to focus all images to centre of segmentation
  const labelMapSegmentationPanel = rightPanelPageObject.labelMapSegmentationPanel.panel;
  await labelMapSegmentationPanel.nthSegment(0).click();
  await labelMapSegmentationPanel.moreMenu.button.hover(); // Prevent segmentation data overlay

  await page.waitForTimeout(5000);

  // Confirm segmentation visible and centered on all relevant viewports
  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefMiddleImage
  );
});

// 2. Load segmentation on unreferenced DS
test.skip('should overlay unhydrated segmentation on non-referenced then referenced display sets', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const segmentationName = 'Segmentation FOR1';

  // Add segmentation to viewport 1 (series not referenced by segmentation)
  await (await viewportPageObject.getNth(1)).pane.click();
  const dataOverlayPageObjectUnref = (await viewportPageObject.getNth(1)).overlayMenu.dataOverlay;
  await dataOverlayPageObjectUnref.toggle();
  await dataOverlayPageObjectUnref.addSegmentation(segmentationName);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObjectUnref.toggle();

  // Segmentation should be added automatically to other vp

  // Use panel to focus all images to centre of segmentation
  const labelMapSegmentationPanel = rightPanelPageObject.labelMapSegmentationPanel.panel;
  await labelMapSegmentationPanel.nthSegment(0).click();
  await labelMapSegmentationPanel.moreMenu.button.hover(); // Prevent segmentation data overlay

  await page.waitForTimeout(5000);

  // Confirm segmentation visible and centered on all relevant viewports
  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segDataOverlayForReferencedDisplaySetNoHydration.overlayUnrefRefMiddleImage
  );
});

// 3. Load segmentation FOR1 on viewport 0, delete (from menu), check able to add again
test('segmentation should still be available in drop down when deleted from viewport', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const segmentationNameFoR1 = 'Segmentation FOR1';

  // Add segmentation with FoR1 to viewport 0 (series referenced by segmentation)
  const dataOverlayPageObject = (await viewportPageObject.getNth(0)).overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation(segmentationNameFoR1);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObject.toggle();

  // Delete segmentation from right panel
  const labelMapSegmentationPanel = rightPanelPageObject.labelMapSegmentationPanel.panel;
  await labelMapSegmentationPanel.moreMenu.delete();

  // Show overlay menu
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation(segmentationNameFoR1);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObject.toggle();

  await page.waitForTimeout(5000);

  // Double check second add worked properly
  await checkForScreenshot(
    page,
    (await viewportPageObject.active).pane,
    screenShotPaths.segDataOverlayForReferencedDisplaySetNoHydration.overlayRefFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    (await viewportPageObject.active).pane,
    screenShotPaths.segDataOverlayForReferencedDisplaySetNoHydration.overlayRefMiddleImage
  );

  // Use panel to focus all images to centre of segmentation
  await labelMapSegmentationPanel.nthSegment(0).click();
  await labelMapSegmentationPanel.moreMenu.button.hover(); // Prevent segmentation data overlay

  await page.waitForTimeout(5000);

  // Confirm segmentation visible and centered on all relevant viewports
  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefMiddleImage
  );
});
