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
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should properly display MPR for MR', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();

  // Let the SEG load finish rendering before hydrating; clicking Yes while the
  // load is still in flight can leave the viewport in a different orientation.
  const viewportRenderAfterLoad = waitForViewportRenderCycle(page);

  await leftPanelPageObject.loadSeriesByDescription('SEG');

  await viewportRenderAfterLoad;

  // start watching for viewports to render
  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await viewportRenderCycle;
  // Hydration adds the labelmap asynchronously after the first render cycle
  // resolves; wait for it to report loaded before settling and capturing.
  await waitForViewportsRendered(page);

  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.segHydrationThenMPR.segPostHydration,
  });

  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await viewportRenderAfterLayoutChange;
  // The layout change rebuilds the viewports; wait for their volume actors
  // (image + labelmap) to report loaded before settling and capturing.
  await waitForViewportsRendered(page);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segHydrationThenMPR.segPostHydrationMPRAxialPrimary,
  });
});
