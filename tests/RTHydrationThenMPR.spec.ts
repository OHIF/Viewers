import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
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

  // Let the RTSTRUCT load finish rendering before hydrating.
  const viewportRenderAfterLoad = waitForViewportRenderCycle(page);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  await viewportRenderAfterLoad;

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

  // The CT volume behind this RTSTRUCT takes longer than the default 15s to
  // stream into the MPR viewports, so allow more time for the render to finish.
  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page, {
    renderedTimeout: 60000,
  });

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await viewportRenderAfterLayoutChange;
  // The layout change rebuilds the viewports; wait for their volume actors to
  // report loaded before settling and capturing.
  await waitForViewportsRendered(page);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.rtHydrationThenMPR.rtPostHydrationMPRAxialPrimary,
  });
});
