import {
  checkForScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.3671.4754.298665348758363466150039312520';
  await visitStudy(page, `${studyInstanceUID}&useNextViewports=true`, 'viewer', 2000);
});

test('should render overlapping segments from SEG series 1004', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  viewportPageObject,
}) => {
  await leftPanelPageObject.loadSeriesBySeriesNumber(1004);

  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  const viewportRenderCycle = waitForViewportRenderCycle(page);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await viewportRenderCycle;
  await waitForViewportsRendered(page);

  await checkForScreenshot({
    page,
    locator: viewportPageObject.grid,
    screenshotPath: screenShotPaths.overlappingSegmentationRendering.overlappingSegmentsDisplayed,
  });
});
