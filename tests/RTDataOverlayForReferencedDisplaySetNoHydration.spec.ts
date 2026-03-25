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
// 1. Load RTStruct on referenced DS (works on selected DS, does not visibly load on other viewports - on panel but not visible)

// 2. Load RTStruct on unreferenced DS (works on selected DS, does not visibly load on other viewports - on panel but not visible)
//    -> Skipping for now

// 3. Load RTFoR1 on viewport 0, check doesn't show up on overlay, delete (from menu), check able to add again

// <<<<<<< Test Summaries

// 1. Load RTStruct on referenced DS
test('should overlay an unhydrated RTSTRUCT over a display set that the RTSTRUCT does reference', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const segmentationName = 'FoR 1 RTstruct';

  // Add segmentation to viewport 0 (series referenced by RTStruct)
  const dataOverlayPageObject = viewportPageObject.getNth(0).overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation(segmentationName);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObject.toggle();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefMiddleImage
  );

  //// Use panel to focus all images to centre of segmentation
  //const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel.panel;
  //await contourSegmentationPanel.nthSegment(0).click();
  //await contourSegmentationPanel.moreMenu.button.hover();

  //await page.waitForTimeout(5000);

  //await checkForScreenshot(
  //  page,
  //  viewportPageObject.grid,
  //  screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefMiddleImage
  //);
});

// 2. Load RTStruct on unreferenced DS
test.skip('should overlay unhydrated RTSTRUCT on non-referenced then referenced display sets', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const segmentationName = 'FoR 1 RTstruct';

  // Add segmentation to viewport 1 (series not referenced by RTStruct)
  await viewportPageObject.getNth(1).pane.click();
  const viewportIdUnref = await viewportPageObject.getNth(1).viewportId;
  const dataOverlayPageObjectUnref = viewportPageObject.getNth(1).overlayMenu.dataOverlay;
  await dataOverlayPageObjectUnref.toggle(viewportIdUnref);
  await dataOverlayPageObjectUnref.addSegmentation(segmentationName, viewportIdUnref);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObjectUnref.toggle(viewportIdUnref);

  // Segmentation should be added automatically to other vp

  // Use panel to focus all images to centre of segmentation
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel.panel;
  await contourSegmentationPanel.nthSegment(0).click();
  await contourSegmentationPanel.moreMenu.button.hover();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayUnrefRefMiddleImage
  );
});

// 3. Load RTFoR1 on viewport 0, delete (from menu), check able to add again
test('segmentation should still be available in drop down when deleted from viewport', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const segmentationNameFoR1 = 'FoR 1 RTstruct';

  // Add segmentation with FoR1 to viewport 0 (series referenced by RTStruct)
  const dataOverlayPageObject = viewportPageObject.getNth(0).overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation(segmentationNameFoR1);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObject.toggle();

  // Delete segmentation from right panel
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel.panel;
  await contourSegmentationPanel.moreMenu.delete();

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
    viewportPageObject.active.pane,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefMiddleImage
  );

  //// Use panel to focus all images to centre of segmentation
  //await contourSegmentationPanel.nthSegment(0).click();
  //await contourSegmentationPanel.moreMenu.button.hover();

  //await page.waitForTimeout(5000);

  //await checkForScreenshot(
  //  page,
  //  viewportPageObject.grid,
  //  screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefMiddleImage
  //);
});
