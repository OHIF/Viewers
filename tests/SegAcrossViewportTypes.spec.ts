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

// Each layout switch rebuilds the viewports and their segmentation representations.
async function switchLayout(page: Page, selectLayout: () => Promise<void>) {
  const renderCycle = waitForViewportRenderCycle(page, { renderedTimeout: 60000 });
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
  });

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.getNthLocator(2)).toBeVisible();

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.mprFromStack,
  });

  // A 1x1 grid keeps the axial MPR pane as a volume viewport; loading the
  // series into it again turns it back into a stack viewport.
  await mainToolbarPageObject.layoutSelection.grid(1, 1).click();
  await expect(viewportPageObject.getNthLocator(1)).toHaveCount(0);
  await waitForViewportsRendered(page);

  await switchLayout(page, () => leftPanelPageObject.loadSeriesByModality('CT'));

  await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(
    SEGMENT_COUNT
  );
  await checkForViewportScreenshot({
    page,
    viewport: await viewportPageObject.active,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.stackAfterMPR,
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
  await expect(viewportPageObject.getNthLocator(2)).toBeVisible();

  await expect(rows).toHaveCount(SEGMENT_COUNT);
  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.mprAfter3D,
  });
});

test('keeps a changed segment color after switching to MPR', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const liver = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(LIVER_ROW);

  const colorChangeCycle = waitForViewportRenderCycle(page);
  await liver.actions.changeColor(NEW_LIVER_HEX);
  await colorChangeCycle;
  await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expect(viewportPageObject.getNthLocator(2)).toBeVisible();

  await expect(liver.rowDataColorHex).toHaveCSS('background-color', NEW_LIVER_CSS_RGB);
  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segAcrossViewportTypes.mprAfterColorChange,
  });
});

test('keeps the selected segment selected across viewport types', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
}) => {
  const { panel } = rightPanelPageObject.labelMapSegmentationPanel;
  const spleen = panel.nthSegment(0);
  const liver = panel.nthSegment(LIVER_ROW);

  // Hydration makes the first segment active.
  await expectRowSelected(spleen);

  await liver.click();
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.MPR.click());
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);

  await switchLayout(page, () => mainToolbarPageObject.layoutSelection.threeDOnly.click());
  await expectRowSelected(liver);
  await expectRowNotSelected(spleen);
});
