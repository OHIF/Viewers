import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  expect,
  RECREATE_VIEWPORTS_WAIT,
  screenShotPaths,
  test,
  visitStudy,
  waitForRenderCycleForAction,
  waitForViewportsRendered,
} from './utils';
import { expectLabelmapPainted, expectNoLabelmapPainted } from './utils/assertions';

const STUDY_UID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
const SEGMENT_COUNT = 13;
const SCROLL_STEPS = 5;

const MAX_DIFF_PIXEL_RATIO = 0.002;

// The slice each pane shows after hydration, after scrolling SCROLL_STEPS, and on its last slice,
// which lies outside the segments. The axial pane's instance numbers count down as it scrolls.
const MPR_PANES = [
  {
    viewportId: 'mpr-axial',
    hydratedSlice: 'I:27 (26/52)',
    scrolledSlice: 'I:22 (31/52)',
    lastSlice: 'I:1 (52/52)',
    scrolledScreenshotPath: screenShotPaths.segMPRDisplay.axialScrolled,
  },
  {
    viewportId: 'mpr-sagittal',
    hydratedSlice: '257/512',
    scrolledSlice: '262/512',
    lastSlice: '512/512',
    scrolledScreenshotPath: screenShotPaths.segMPRDisplay.sagittalScrolled,
  },
  {
    viewportId: 'mpr-coronal',
    hydratedSlice: '257/512',
    scrolledSlice: '262/512',
    lastSlice: '512/512',
    scrolledScreenshotPath: screenShotPaths.segMPRDisplay.coronalScrolled,
  },
];

test.beforeEach(
  async ({
    page,
    DOMOverlayPageObject,
    leftPanelPageObject,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  }) => {
    await visitStudy(page, STUDY_UID, 'segmentation', 2000);
    await waitForViewportsRendered(page);

    // Switch to MPR before loading the SEG, so it is hydrated straight into the volume panes.
    await waitForRenderCycleForAction(
      page,
      () => mainToolbarPageObject.layoutSelection.MPR.click(),
      RECREATE_VIEWPORTS_WAIT
    );
    await expect(viewportPageObject.panes).toHaveCount(MPR_PANES.length);

    await leftPanelPageObject.loadSeriesByModality('SEG');
    await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
    // Accepting while the SEG is still loading can leave a viewport in another orientation.
    await waitForViewportsRendered(page);
    await waitForRenderCycleForAction(page, () =>
      DOMOverlayPageObject.viewport.segmentationHydration.yes.click()
    );
    // Hydration adds the labelmap to the sagittal and coronal panes after the first render cycle;
    // this waits until those labelmaps report loaded too.
    await waitForViewportsRendered(page, { timeout: 60000 });

    await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(
      SEGMENT_COUNT
    );
  }
);

test('paints the labelmap in all three MPR panes', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const { labelMapSegmentationPanel } = rightPanelPageObject;

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segMPRDisplay.mprAfterHydration,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });

  for (const { viewportId } of MPR_PANES) {
    const viewport = await viewportPageObject.getById(viewportId);
    // The all-segments eye toggle applies to the active pane only.
    await viewport.pane.click();
    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
  }
});

test('keeps the labelmap on the anatomy as each MPR pane scrolls', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const { labelMapSegmentationPanel } = rightPanelPageObject;

  for (const {
    viewportId,
    hydratedSlice,
    scrolledSlice,
    lastSlice,
    scrolledScreenshotPath,
  } of MPR_PANES) {
    const viewport = await viewportPageObject.getById(viewportId);
    const { instanceNumber } = viewport.overlayText.bottomRight;
    // The all-segments eye toggle applies to the active pane only.
    await viewport.pane.click();
    await expect(instanceNumber).toHaveText(hydratedSlice);

    await viewport.sliceNavigation.scrollBy(SCROLL_STEPS);
    await expect(instanceNumber).toHaveText(scrolledSlice);
    await expectLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
    await checkForViewportScreenshot({
      page,
      viewport,
      screenshotPath: scrolledScreenshotPath,
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
    });

    await viewport.sliceNavigation.toLastSlice();
    await expect(instanceNumber).toHaveText(lastSlice);
    await expectNoLabelmapPainted({ page, viewport, labelMapSegmentationPanel });
  }
});
