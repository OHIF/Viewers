import {
  checkForScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  waitForPaintToSettle,
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
  // SEG load triggers an additional progressive labelmap upload after the
  // viewports first report 'rendered'; let that finish before screenshotting.
  await page.waitForTimeout(1500);
  await waitForPaintToSettle(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSEG
  );

  // start watching for viewports to render
  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await viewportRenderCycle;
  // Hydration propagates the labelmap volume to the sagittal/coronal MPR
  // viewports asynchronously; wait for that propagation to render before
  // capturing.
  await page.waitForTimeout(1500);
  await waitForPaintToSettle(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydrated
  );

  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await viewportRenderAfterLayoutChange;
  await page.waitForTimeout(1000);
  await waitForPaintToSettle(page);

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydratedAfterLayoutChange
  );
});
