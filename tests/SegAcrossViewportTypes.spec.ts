import type { Page } from '@playwright/test';

import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudyAndHydrate,
  waitForViewportRenderCycle,
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
  const renderCycle = waitForViewportRenderCycle(page, {
    needsRenderTimeout: 20000,
    renderedTimeout: 60000,
  });
  await selectLayout();
  await renderCycle;
  await waitForViewportsRendered(page, { timeout: 60000 });
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

test('keeps the labelmap drawn through a stack to MPR to stack round trip', async ({
  page,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await checkForViewportScreenshot({
    page,
    viewport: await viewportPageObject.active,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.stackBeforeMPR,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.getNthLocator(1)).toBeVisible();
  await expect(viewportPageObject.getNthLocator(2)).toBeVisible();

  await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(
    SEGMENT_COUNT
  );
  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.mprFromStack,
    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  });

  // Load series into 1x1 grid again to return to a stack viewport.
  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.grid(1, 1).click());
  await expect(viewportPageObject.getNthLocator(1)).toHaveCount(0);
  await expect(viewportPageObject.getNthLocator(2)).toHaveCount(0);

  await waitForViewportsRendered(page);

  await switchLayout(page, () => leftPanelPageObject.loadSeriesByModality('CT'));

  await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(
    SEGMENT_COUNT
  );
  await checkForViewportScreenshot({
    page,
    viewport: await viewportPageObject.active,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.stackAfterMPR,
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
  await expect(rows).toHaveCount(SEGMENT_COUNT);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.getNthLocator(1)).toBeVisible();
  await expect(viewportPageObject.getNthLocator(2)).toBeVisible();

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

  const colorChangeCycle = waitForViewportRenderCycle(page);
  await liver.actions.changeColor(NEW_LIVER_HEX);
  await colorChangeCycle;
  await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.getNthLocator(1)).toBeVisible();
  await expect(viewportPageObject.getNthLocator(2)).toBeVisible();

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

  const segmentClickCycle = waitForViewportRenderCycle(page);
  await liver.click();
  await segmentClickCycle;
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.getNthLocator(1)).toBeVisible();
  await expect(viewportPageObject.getNthLocator(2)).toBeVisible();
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.threeDOnly.click());
  await expect(viewportPageObject.getNthLocator(1)).toHaveCount(0);
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);
});
