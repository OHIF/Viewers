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
// 1. Load RTStruct on referenced DS (works on selected DS, rest breaks - on panel but not visible)

// 2. Load RTStruct on unreferenced DS (works on selected DS, rest breaks - on panel but not visible)
//    -> Skipping for now

// 3. On referenced DS (FoR1) load FoR1, then FoR2
// 4. On referenced DS (FoR1) load FoR2, then FoR1 (breaks measurement outline)

// 5. Load RTFoR1 on viewport 0, check doesn't show up on overlay, delete (from menu), check able to add again

// <<<<<<< Test Summaries

// 1. Load RTStruct on referenced DS
test('should overlay an unhydrated RTSTRUCT over a display set that the RTSTRUCT does reference', async ({
  page,
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
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefMiddleImage
  );
});

// 2. Load RTStruct on unreferenced DS
test.skip('should sequentially overlay an unhydrated RTSTRUCT over display set that the RTSTRUCT does not then display set it does reference', async ({
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
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourSegmentationPanel.panel.nthSegment(0).click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayUnrefRefMiddleImage
  );
});

// 3. On referenced DS (FoR1) load FoR1, then FoR2
test('on referenced display set, load RTStruct with same FoR, then RTStruct with different FoR', async ({
  page,
  viewportPageObject,
}) => {
  const segmentationNameFoR1 = 'FoR 1 RTstruct';
  const segmentationNameFoR2 = 'FoR 2 RTstruct';

  // Add segmentation with FoR1 to viewport 0 (series referenced by RTStruct)
  const dataOverlayPageObject = viewportPageObject.getNth(0).overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation(segmentationNameFoR1);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Change segmentation to one with FoR2
  await dataOverlayPageObject.changeRTStruct(segmentationNameFoR1, segmentationNameFoR2);

  // Hide overlay menu.
  await dataOverlayPageObject.toggle();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlaySameFORDiffFORFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlaySameFORDiffFORMiddleImage
  );
});

// 4. On referenced DS (FoR1) load FoR2, then FoR1 (breaks measurement outline)
test('on referenced display set, load RTStruct with different FoR, then RTStruct with same FoR', async ({
  page,
  viewportPageObject,
}) => {
  const segmentationNameFoR1 = 'FoR 1 RTstruct';
  const segmentationNameFoR2 = 'FoR 2 RTstruct';

  // Add segmentation with FoR1 to viewport 0 (series referenced by RTStruct)
  const dataOverlayPageObject = viewportPageObject.getNth(0).overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation(segmentationNameFoR2);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Change segmentation to one with FoR2
  await dataOverlayPageObject.changeRTStruct(segmentationNameFoR2, segmentationNameFoR1);

  // Hide overlay menu.
  await dataOverlayPageObject.toggle();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayDiffFORSameFORFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayDiffFORSameFORMiddleImage
  );
});

// 5. Load RTFoR1 on viewport 0, delete (from menu), check able to add again
test('segmentation should still be available in drop down when deleted from viewport', async ({
  page,
  viewportPageObject,
  rightPanelPageObject,
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
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourSegmentationPanel.segmentationActions.delete();

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
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefFirstImage
  );

  // Navigate to the middle image of the default viewport.
  await press({ page, key: 'ArrowDown', nTimes: 60 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefMiddleImage
  );
});
