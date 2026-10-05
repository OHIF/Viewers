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

test('should launch MPR with unhydrated RTSTRUCT', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();

  // start watching for viewports to render
  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  await viewportRenderCycle;

  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
  await expect(DOMOverlayPageObject.viewport.modalityLoadBadges).toHaveCount(1);

  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPreMPR,
  });

  // This loads a large CT study which takes longer than the default 15s to load
  // hence the 60s to allow more time for the render to finish.
  const volumeLoadTimeout = 60000;
  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page, {
    renderedTimeout: volumeLoadTimeout,
  });

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await viewportRenderAfterLayoutChange;

  await waitForViewportsRendered(page, { timeout: volumeLoadTimeout });

  // Switching to MPR does not hydrate the RTSTRUCT.
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
  await expect(DOMOverlayPageObject.viewport.modalityLoadBadges).toHaveCount(1);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPostMPR,
  });
});
