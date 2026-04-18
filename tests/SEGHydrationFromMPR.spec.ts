import {
  checkForScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  waitForAnyViewportNeedsRender,
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

  await waitForViewportsRendered(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSEG
  );

  // start watching for viewport to need render
  let needsRender = waitForAnyViewportNeedsRender(page);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  // wait for render to start
  await needsRender;

  await waitForViewportsRendered(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydrated
  );

  const needsRenderAfterLayoutChange = waitForAnyViewportNeedsRender(page);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await needsRenderAfterLayoutChange;

  await waitForViewportsRendered(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydratedAfterLayoutChange
  );
});
