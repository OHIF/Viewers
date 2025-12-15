//import { test } from 'playwright-test-coverage';
import {
  visitStudy,
  addSegmentationViaOverlayMenu,
  checkForScreenshot,
  test,
  screenShotPaths,
} from './utils';
import { press } from './utils/keyboardUtils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.12201.1091.126683095609223531686845324113579088978';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

// >>>>> Test Summaries
// 1. Load RTStruct on referenced DS

// 2. Load RTStruct on referenced DS then unreferenced DS
// 3. Load RTStruct on unreferenced DS then referenced DS (breaks, on panel but not visible)

// 4. On referenced DS (FoR1) load FoR1, then FoR2
// 5. On referenced DS (FoR1) load FoR2, then FoR1 (breaks measurement outline)

// 6. Load RTStruct on referenced DS, then on unreferenced DS with same FoR (works)
// 7. Load RTStruct on referenced DS, then on unreferenced DS with diff FoR (breaks, on panel but not visible)

// 8. Load RTFoR1 on viewport 0, delete (from menu), RTFoR1 missing from overlay dropdown of viewport 0

// 9. Load RTstruct on unreferenced DS, then on referenced DS
//    Load Seg on referenced DS -> runtime error

// 10. Duplicate referenced DS (FoR1)
//    Load RTFoR1 on unreferenced DS, Load RTFor2 on referenced DS
//    Load RTFor1 on duplicated referenced DS, referenced DS overlay multiple, duplicate nothing visible
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

// 2. Load RTStruct on referenced DS then unreferenced DS
test('should sequentially overlay an unhydrated RTSTRUCT over display set that the RTSTRUCT does then display set it does not reference', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const segmentationName = 'FoR 1 RTstruct';

  // Add segmentation to viewport 0 (series referenced by RTStruct)
  const viewportIdRef = await viewportPageObject.getNth(0).viewportId;
  const dataOverlayPageObjectRef = viewportPageObject.getNth(0).overlayMenu.dataOverlay;
  await dataOverlayPageObjectRef.toggle(viewportIdRef);
  await dataOverlayPageObjectRef.addSegmentation(segmentationName, viewportIdRef);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObjectRef.toggle(viewportIdRef);

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

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefFirstImage
  );

  // Use panel to focus all images to centre of segmentation
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourSegmentationPanel.panel.nthSegmentation(0).click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefMiddleImage
  );
});

// 3. Load RTStruct on unreferenced DS then referenced DS (breaks, on panel but not visible)
test('should sequentially overlay an unhydrated RTSTRUCT over display set that the RTSTRUCT does not then display set it does reference', async ({
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

  // Add segmentation to viewport 0 (series referenced by RTStruct)
  await viewportPageObject.getNth(0).pane.click();
  const viewportIdRef = await viewportPageObject.getNth(0).viewportId;
  const dataOverlayPageObjectRef = viewportPageObject.getNth(0).overlayMenu.dataOverlay;
  await dataOverlayPageObjectRef.toggle(viewportIdRef);
  await dataOverlayPageObjectRef.addSegmentation(segmentationName, viewportIdRef);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObjectRef.toggle(viewportIdRef);

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayUnrefRefFirstImage
  );

  // Use panel to focus all images to centre of segmentation
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourSegmentationPanel.panel.nthSegmentation(0).click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayUnrefRefMiddleImage
  );
});

// 4. On referenced DS (FoR1) load FoR1, then FoR2
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

// 5. On referenced DS (FoR1) load FoR2, then FoR1 (breaks measurement outline)
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

// 6. Load RTStruct on referenced DS, then on unreferenced DS with same FoR (works)
test('segmentation should load sequentially on referenced DS then unreferenced DS with same FoR', async ({
  page,
  viewportPageObject,
  rightPanelPageObject,
}) => {
  const segmentationNameFoR1 = 'FoR 1 RTstruct';

  // Add segmentation with FoR1 to viewport 0 (series referenced by RTStruct)
  const viewportIdRef = await viewportPageObject.getNth(0).viewportId;
  const dataOverlayPageObject = viewportPageObject.getNth(0).overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle(viewportIdRef);
  await dataOverlayPageObject.addSegmentation(segmentationNameFoR1, viewportIdRef);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObject.toggle(viewportIdRef);

  // Add segmentation with FoR1 to viewport 1 (unreferenced with same FoR)
  await viewportPageObject.getNth(1).pane.click();
  const viewportIdUnref = await viewportPageObject.getNth(1).viewportId;
  const dataOverlayPageObjectUnref = viewportPageObject.getNth(1).overlayMenu.dataOverlay;
  await dataOverlayPageObjectUnref.toggle(viewportIdUnref);
  await dataOverlayPageObjectUnref.addSegmentation(segmentationNameFoR1, viewportIdUnref);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObjectUnref.toggle(viewportIdUnref);

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefSameFORFirstImage
  );

  // Use panel to focus all images to centre of segmentation
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourSegmentationPanel.panel.nthSegmentation(0).click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration
      .overlayRefUnrefSameFORMiddleImage
  );
});

// 7. Load RTStruct on referenced DS, then on unreferenced DS with diff FoR (breaks, on panel but not visible)
test('segmentation should load sequentially on referenced DS then unreferenced DS with different FoR', async ({
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

  // Add segmentation with FoR1 to viewport 2 (unreferenced DS with different FoR)
  await viewportPageObject.getNth(2).pane.click();
  const viewportIdDiffFOR = await viewportPageObject.getNth(2).viewportId;
  const dataOverlayPageObjectUnref = viewportPageObject.getNth(2).overlayMenu.dataOverlay;
  await dataOverlayPageObjectUnref.toggle(viewportIdDiffFOR);
  await dataOverlayPageObjectUnref.addSegmentation(segmentationNameFoR1, viewportIdDiffFOR);

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide overlay menu.
  await dataOverlayPageObjectUnref.toggle(viewportIdDiffFOR);

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration.overlayRefUnrefDiffFORFirstImage
  );

  // Use panel to focus all images to centre of segmentation
  const contourSegmentationPanel = rightPanelPageObject.contourSegmentationPanel;
  await contourSegmentationPanel.panel.nthSegmentation(0).click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtDataOverlayForReferencedDisplaySetNoHydration
      .overlayRefUnrefDiffFORMiddleImage
  );
});

// 8. Load RTFoR1 on viewport 0, delete (from menu), RTFoR1 missing from overlay dropdown of viewport 0
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

  // >>> Repeat of first test, might not be needed

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
