import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  expect,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate an RTSTRUCT and then launch MPR', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  // Verify hydration prompt is visible
  const hydrationPrompt = DOMOverlayPageObject.viewport.segmentationHydration.locator;
  await expect(hydrationPrompt).toBeVisible({ timeout: 10000 });
  await waitForViewportsRendered(page);

  // start watching for viewports to render
  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await viewportRenderCycle;
  // Hydration adds the contour representation asynchronously after the first
  // render cycle resolves; wait for it before settling and capturing.
  await waitForViewportsRendered(page);

  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rtHydrationThenMPR.rtPostHydration,
  });

  // This loads a large CT study which takes longer than the default 15s to load
  // hence the 60s to allow more time for the render to finish.
  const volumeLoadTimeout = 60000;
  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page, {
    renderedTimeout: volumeLoadTimeout,
  });

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await viewportRenderAfterLayoutChange;

  await waitForViewportsRendered(page, { timeout: volumeLoadTimeout });

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.rtHydrationThenMPR.rtPostHydrationMPRAxialPrimary,
  });
});
