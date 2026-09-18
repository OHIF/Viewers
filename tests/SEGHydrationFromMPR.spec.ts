import {
  checkForScreenshot,
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

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await waitForViewportsRendered(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprBeforeSEG
  );

  await leftPanelPageObject.loadSeriesByDescription('SEG');

  // SEG load triggers a progressive labelmap volume upload. waitForViewportsRendered
  // (waitVolumeLoad defaults to true) polls the viewport volume actors until the
  // labelmap reports loadStatus.loaded, then settles, so the screenshot captures the
  // finished upload rather than a mid-stream frame.
  await waitForViewportsRendered(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSEG
  );

  // start watching for viewports to render
  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await viewportRenderCycle;
  // Hydration propagates the labelmap volume to the sagittal/coronal MPR viewports
  // asynchronously, adding new volume actors after the first render cycle resolves.
  // waitForViewportsRendered re-polls every viewport's volume actors until those
  // propagated labelmaps report loadStatus.loaded, then settles.
  await waitForViewportsRendered(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydrated
  );

  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await viewportRenderAfterLayoutChange;
  // The layout change rebuilds the viewports; wait for their volume actors (image
  // + labelmap) to report loaded before settling and capturing.
  await waitForViewportsRendered(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydratedAfterLayoutChange
  );
});
