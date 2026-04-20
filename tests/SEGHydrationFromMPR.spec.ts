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

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydrated
  );

  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await viewportRenderAfterLayoutChange;

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydratedAfterLayoutChange
  );
});
