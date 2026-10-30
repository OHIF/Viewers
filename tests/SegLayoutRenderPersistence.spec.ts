import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  drawFreehandContour,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  visitStudyAndHydrate,
  waitForRenderCycleForAction,
  waitForViewportsRendered,
} from './utils';
import { expectLabelmapPainted } from './utils/assertions';

const ABDOMEN_STUDY_UID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
const ABDOMEN_SEGMENT_COUNT = 13;
const LIVER_ROW = 5;
// The slice a Liver row click centers the stack on.
const LIVER_SLICE_TEXT = 'I:14 (14/52)';
const NEW_LIVER_HEX = '#1E90FF';
const NEW_LIVER_CSS_RGB = 'rgb(30, 144, 255)';

// A closed loop around the spine on the liver slice.
const CONTOUR_PATH = [
  { x: 0.42, y: 0.62 },
  { x: 0.58, y: 0.62 },
  { x: 0.58, y: 0.78 },
  { x: 0.42, y: 0.78 },
  { x: 0.42, y: 0.62 },
];

// Opens as a 2x2 grid of four MR series that share one frame of reference.
const PROSTATE_STUDY_UID = '1.3.6.1.4.1.14519.5.2.1.3671.4754.298665348758363466150039312520';
const PROSTATE_PANES = [
  'T2 Weighted Axial',
  'DWI',
  'DCE Subtraction',
  'Apparent Diffusion Coefficient',
];
const T2_PANE = 0;
const ADC_PANE = 3;
const T2_SEG_DESCRIPTION = 'T2 Weighted Axial Segmentations';
const T2_SEG_SEGMENTS = ['Normal', 'Peripheral zone of the prostate', 'Lesion', 'Prostate'];
// Segmentations are shared by every viewport in a frame of reference, so each pane lists both.
const PROSTATE_OVERLAY_LABELS = ['T2 WEIGHTED AXIAL SEGMENTATIONS', 'SEGMENTATION 2'];
const ADC_STROKE = { start: { x: 0.4, y: 0.45 }, end: { x: 0.6, y: 0.45 } };
const NEW_ADC_SEGMENT_HEX = '#00FF00';
const NEW_ADC_SEGMENT_CSS_RGB = 'rgb(0, 255, 0)';

const MAX_DIFF_PIXEL_RATIO = 0.002;

// Layout changes and maximize/restore re-create the viewports, which can take a while under load.
const RECREATE_VIEWPORTS_WAIT = { needsRenderTimeout: 20000, renderedTimeout: 60000 };

test.describe('abdominal CT with a hydrated SEG', () => {
  test.beforeEach(
    async ({
      page,
      leftPanelPageObject,
      DOMOverlayPageObject,
      rightPanelPageObject,
      viewportPageObject,
    }) => {
      await visitStudyAndHydrate({
        page,
        leftPanelPageObject,
        DOMOverlayPageObject,
        studyInstanceUID: ABDOMEN_STUDY_UID,
        modality: 'SEG',
      });

      const { panel } = rightPanelPageObject.labelMapSegmentationPanel;
      await expect(panel.rows).toHaveCount(ABDOMEN_SEGMENT_COUNT);
      await waitForViewportsRendered(page);

      // The hydrated slice doesn't show the liver; clicking its row centers the stack on it.
      const liver = panel.nthSegment(LIVER_ROW);
      await expect(liver.title).toHaveText('Liver');
      await waitForRenderCycleForAction(page, () => liver.click());

      const viewport = await viewportPageObject.getById('default');
      await expect(viewport.overlayText.bottomRight.instanceNumber).toHaveText(LIVER_SLICE_TEXT);
    }
  );

  test('keeps the labelmap and a drawn contour on the pane through a 1x1 > 2x2 > 1x1 round trip', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const { contourSegmentationPanel, labelMapSegmentationPanel } = rightPanelPageObject;
    const viewport = await viewportPageObject.getById('default');
    const contourPath = viewport.svg('path');

    await contourSegmentationPanel.addSegmentation();
    await expect(contourSegmentationPanel.panel.rows).toHaveCount(1);
    await drawFreehandContour({
      segmentationPanel: contourSegmentationPanel,
      viewport,
      path: CONTOUR_PATH,
    });
    // The finished contour replaces the drawing preview path once the viewport renders.
    await waitForViewportsRendered(page);
    await expect(contourPath).toHaveCount(1);
    await expect(contourPath).toBeVisible();
    const contourD = await contourPath.getAttribute('d');
    expect(contourD).not.toBeNull();

    // The new contour segmentation is the active one, so the labelmap now draws as inactive.
    await labelMapSegmentationPanel.select();
    await expect(labelMapSegmentationPanel.panel.rows).toHaveCount(ABDOMEN_SEGMENT_COUNT);
    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
    await checkForViewportScreenshot({
      page,
      viewport,
      screenshotPath: screenShotPaths.segLayoutRenderPersistence.oneUpWithContour,
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });

    await waitForRenderCycleForAction(
      page,
      () => mainToolbarPageObject.layoutSelection.grid(2, 2).click(),
      RECREATE_VIEWPORTS_WAIT
    );
    await expect(viewportPageObject.panes).toHaveCount(4);

    // The segmented pane stays top left and active, on the same slice.
    await expect(viewportPageObject.getNthLocator(0)).toHaveAttribute('data-is-active', 'true');
    await expect(viewport.overlayText.bottomRight.instanceNumber).toHaveText(LIVER_SLICE_TEXT);
    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
    await expect(contourPath).toHaveCount(1);
    await expect(contourPath).toBeVisible();
    await expect(labelMapSegmentationPanel.panel.rows).toHaveCount(ABDOMEN_SEGMENT_COUNT);
    await checkForGridScreenshot({
      page,
      viewportPageObject,
      screenshotPath: screenShotPaths.segLayoutRenderPersistence.twoByTwoFromOneUp,
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });

    await waitForRenderCycleForAction(
      page,
      () => mainToolbarPageObject.layoutSelection.grid(1, 1).click(),
      RECREATE_VIEWPORTS_WAIT
    );
    await expect(viewportPageObject.panes).toHaveCount(1);

    await expect(viewport.overlayText.bottomRight.instanceNumber).toHaveText(LIVER_SLICE_TEXT);
    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
    await expect(contourPath).toHaveCount(1);
    await expect(contourPath).toBeVisible();
    await expect(contourPath).toHaveAttribute('d', contourD);
    await expect(labelMapSegmentationPanel.panel.rows).toHaveCount(ABDOMEN_SEGMENT_COUNT);
    await checkForViewportScreenshot({
      page,
      viewport,
      screenshotPath: screenShotPaths.segLayoutRenderPersistence.oneUpWithContour,
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });

    await contourSegmentationPanel.select();
    await expect(contourSegmentationPanel.panel.rows).toHaveCount(1);
  });

  test('keeps a changed segment color on a pane after maximizing and restoring it', async ({
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const { labelMapSegmentationPanel } = rightPanelPageObject;
    const { panel } = labelMapSegmentationPanel;
    const liver = panel.nthSegment(LIVER_ROW);
    const viewport = await viewportPageObject.getById('default');

    await waitForRenderCycleForAction(
      page,
      () => mainToolbarPageObject.layoutSelection.grid(2, 1).click(),
      RECREATE_VIEWPORTS_WAIT
    );
    await expect(viewportPageObject.panes).toHaveCount(2);
    await expect(viewportPageObject.getNthLocator(0)).toHaveAttribute('data-is-active', 'true');

    await waitForRenderCycleForAction(page, () => liver.actions.changeColor(NEW_LIVER_HEX));
    await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);
    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
    await checkForViewportScreenshot({
      page,
      viewport,
      screenshotPath: screenShotPaths.segLayoutRenderPersistence.leftPaneAfterColorChange,
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });

    await waitForRenderCycleForAction(
      page,
      () => viewport.pane.dblclick(),
      RECREATE_VIEWPORTS_WAIT
    );
    await expect(viewportPageObject.panes).toHaveCount(1);
    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
    await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);

    await waitForRenderCycleForAction(
      page,
      () => viewport.pane.dblclick(),
      RECREATE_VIEWPORTS_WAIT
    );
    await expect(viewportPageObject.panes).toHaveCount(2);

    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
    await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);
    await expect(panel.rows).toHaveCount(ABDOMEN_SEGMENT_COUNT);
    await checkForViewportScreenshot({
      page,
      viewport,
      screenshotPath: screenShotPaths.segLayoutRenderPersistence.leftPaneAfterColorChange,
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });
  });
});

test.describe('prostate MR grid of four series', () => {
  test.beforeEach(async ({ page }) => {
    await visitStudy(page, PROSTATE_STUDY_UID, 'segmentation', 2000);
    // The DWI pane is a volume viewport, which reports rendered only once all its frames load.
    await waitForViewportsRendered(page, { timeout: 60000 });
  });

  test("keeps each pane's labelmap and color after another pane is maximized and restored", async ({
    page,
    DOMOverlayPageObject,
    leftPanelPageObject,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    const { labelMapSegmentationPanel } = rightPanelPageObject;
    const { panel } = labelMapSegmentationPanel;
    const panes = await viewportPageObject.getAll();
    const t2 = panes[T2_PANE];
    const adc = panes[ADC_PANE];

    const expectEachPaneUnchanged = async () => {
      await expect(viewportPageObject.panes).toHaveCount(PROSTATE_PANES.length);
      for (const [index, pane] of panes.entries()) {
        await expect(pane.overlayText.topLeft.seriesDescription).toHaveText(PROSTATE_PANES[index]);
        // The data overlay menu is only offered on the active pane.
        await pane.pane.click();
        await expect(pane.pane).toHaveAttribute('data-is-active', 'true');
        const { dataOverlay } = pane.overlayMenu;
        await dataOverlay.toggle();
        await expect(dataOverlay.overlaySegmentationRows).toHaveText(PROSTATE_OVERLAY_LABELS);
        await dataOverlay.toggle();
        await expect(dataOverlay.menu).not.toBeVisible();
      }
    };

    await expect(t2.pane).toHaveAttribute('data-is-active', 'true');
    await leftPanelPageObject.loadSeriesByDescription(T2_SEG_DESCRIPTION);
    await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
    // Accepting while the SEG is still loading can leave a viewport in another orientation.
    await waitForViewportsRendered(page);
    await waitForRenderCycleForAction(page, () =>
      DOMOverlayPageObject.viewport.segmentationHydration.yes.click()
    );
    await expect(panel.getSegmentLabels()).toHaveText(T2_SEG_SEGMENTS);
    await expectLabelmapPainted({ page, viewport: t2, labelMapSegmentationPanel });

    // Paint a stroke into a new segmentation on the ADC pane and recolor it.
    await adc.pane.click();
    await expect(adc.pane).toHaveAttribute('data-is-active', 'true');
    await panel.moreMenu.createNewSegmentation();
    await expect(panel.rows).toHaveCount(1);
    await labelMapSegmentationPanel.tools.brush.click();
    await labelMapSegmentationPanel.tools.brush.setRadius(8);
    await waitForRenderCycleForAction(page, () => adc.normalizedDragAt(ADC_STROKE));
    const adcSegment = panel.nthSegment(0);
    await waitForRenderCycleForAction(page, () =>
      adcSegment.actions.changeColor(NEW_ADC_SEGMENT_HEX)
    );
    await expect(adcSegment.rowDataColorHex).toHaveCSS('background-color', NEW_ADC_SEGMENT_CSS_RGB);
    await expectLabelmapPainted({ page, viewport: adc, labelMapSegmentationPanel });

    // A double-click with the brush armed would paint; Window/Level leaves the image unchanged.
    await mainToolbarPageObject.windowLevel.click();
    await expectEachPaneUnchanged();
    // Each pane carries cine controls with text, so compare canvas digests, not screenshots.
    const t2Digest = await t2.getCanvasDigest();
    const adcDigest = await adc.getCanvasDigest();

    await waitForRenderCycleForAction(page, () => t2.pane.dblclick(), RECREATE_VIEWPORTS_WAIT);
    await expect(viewportPageObject.panes).toHaveCount(1);
    await expect(t2.overlayText.topLeft.seriesDescription).toHaveText(PROSTATE_PANES[T2_PANE]);

    await waitForRenderCycleForAction(page, () => t2.pane.dblclick(), RECREATE_VIEWPORTS_WAIT);
    await expectEachPaneUnchanged();
    await expect.poll(() => t2.getCanvasDigest()).toBe(t2Digest);
    await expect.poll(() => adc.getCanvasDigest()).toBe(adcDigest);
    await expect(panel.rows).toHaveCount(1);
    await expect(adcSegment.rowDataColorHex).toHaveCSS('background-color', NEW_ADC_SEGMENT_CSS_RGB);
  });
});
