import type { Page } from '@playwright/test';

import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudyAndHydrate,
  waitForRenderCycleForAction,
  waitForViewportsRendered,
} from './utils';
import { expectRowNotSelected, expectRowSelected } from './utils/assertions';

const STUDY_UID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
const SEGMENT_COUNT = 13;

// The liver is large enough to show on every MPR plane.
const LIVER_ROW = 5;
const NEW_LIVER_HEX = '#1E90FF';
const NEW_LIVER_CSS_RGB = 'rgb(30, 144, 255)';

const MAX_DIFF_PIXEL_RATIO = 0.002;

async function switchLayout(page: Page, selectLayout: () => Promise<void>) {
  await waitForRenderCycleForAction(page, selectLayout, {
    needsRenderTimeout: 20000,
    renderedTimeout: 60000,
  });
}

test.beforeEach(
  async ({ page, leftPanelPageObject, DOMOverlayPageObject, rightPanelPageObject }) => {
    await visitStudyAndHydrate({
      page,
      leftPanelPageObject,
      DOMOverlayPageObject,
      studyInstanceUID: STUDY_UID,
      modality: 'SEG',
    });

    await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(
      SEGMENT_COUNT
    );
    await waitForViewportsRendered(page);
  }
);

test('keeps the labelmap drawn from a stack through MPR and back to one viewport', async ({
  page,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const initialStack = await viewportPageObject.active;
  await expect.poll(() => initialStack.getViewportType()).toBe('stack');
  await checkForViewportScreenshot({
    page,
    viewport: initialStack,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.stackBeforeMPR,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.panes).toHaveCount(3);

  await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(
    SEGMENT_COUNT
  );
  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.mprFromStack,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });

  // Switch back to a 1x1 grid, then reload the CT series. The 1x1 grid keeps MPR's volume
  // viewport, so the series reloads into a volume viewport, not a stack.
  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.grid(1, 1).click());
  await expect(viewportPageObject.panes).toHaveCount(1);

  await switchLayout(page, () => leftPanelPageObject.loadSeriesByModality('CT'));

  await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(
    SEGMENT_COUNT
  );
  await checkForViewportScreenshot({
    page,
    viewport: await viewportPageObject.active,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.oneUpAfterMPR,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });
});

test('keeps every segment when switching from 3D to MPR', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const { rows } = rightPanelPageObject.labelMapSegmentationPanel.panel;

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.threeDOnly.click());
  await expect
    .poll(async () => (await viewportPageObject.active).getViewportType())
    .toBe('volume3d');
  await expect(rows).toHaveCount(SEGMENT_COUNT);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.panes).toHaveCount(3);

  await expect(rows).toHaveCount(SEGMENT_COUNT);
  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.mprAfter3D,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });
});

test('keeps a changed segment color after switching to MPR', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const liver = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(LIVER_ROW);
  await expect(liver.title).toHaveText('Liver');

  // The hydrated slice doesn't show the liver; clicking its row centers the stack on it.
  await waitForRenderCycleForAction(page, () => liver.click());

  await waitForRenderCycleForAction(page, () => liver.actions.changeColor(NEW_LIVER_HEX));
  await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);
  await checkForViewportScreenshot({
    page,
    viewport: await viewportPageObject.active,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.stackAfterColorChange,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.panes).toHaveCount(3);

  await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);
  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.mprAfterColorChange,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });
});

test('keeps the selected segment selected across viewport types', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const { panel } = rightPanelPageObject.labelMapSegmentationPanel;
  const spleen = panel.nthSegment(0);
  const liver = panel.nthSegment(LIVER_ROW);
  await expect(spleen.title).toHaveText('Spleen');
  await expect(liver.title).toHaveText('Liver');

  // Hydration makes the first segment active.
  await expectRowSelected(spleen);
  await expectRowNotSelected(liver);

  await waitForRenderCycleForAction(page, () => liver.click());
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.panes).toHaveCount(3);
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.threeDOnly.click());
  await expect
    .poll(async () => (await viewportPageObject.active).getViewportType())
    .toBe('volume3d');
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);
});
