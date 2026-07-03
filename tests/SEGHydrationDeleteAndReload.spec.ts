import {
  checkForScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should fully remove segmentation overlay after repeated load-and-delete cycle', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const activeViewport = await viewportPageObject.active;

  await leftPanelPageObject.loadSeriesByModality('SEG');

  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  let viewportRenderCycle = waitForViewportRenderCycle(page);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await viewportRenderCycle;

  viewportRenderCycle = waitForViewportRenderCycle(page);
  await rightPanelPageObject.labelMapSegmentationPanel.panel.moreMenu.delete();
  await viewportRenderCycle;

  await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(0);

  // reload SEG series
  viewportRenderCycle = waitForViewportRenderCycle(page);
  await leftPanelPageObject.loadSeriesByModality('SEG');
  await viewportRenderCycle;

  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  viewportRenderCycle = waitForViewportRenderCycle(page);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await viewportRenderCycle;

  await checkForScreenshot(
    page,
    activeViewport.pane,
    screenShotPaths.segHydrationDeleteAndReload.viewportAfterSecondHydration
  );

  viewportRenderCycle = waitForViewportRenderCycle(page);
  await rightPanelPageObject.labelMapSegmentationPanel.panel.moreMenu.delete();
  await viewportRenderCycle;

  await expect(rightPanelPageObject.labelMapSegmentationPanel.panel.rows).toHaveCount(0);

  await checkForScreenshot(
    page,
    activeViewport.pane,
    screenShotPaths.segHydrationDeleteAndReload.viewportAfterSecondDelete
  );
});
