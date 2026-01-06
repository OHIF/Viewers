import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate an RTSTRUCT from MPR', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
}) => {
  await rightPanelPageObject.toggle();

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await page.waitForTimeout(10000);

  await checkForScreenshot(page, page, screenShotPaths.rtHydrationFromMPR.mprBeforeRT);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.rtHydrationFromMPR.mprAfterRT);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.rtHydrationFromMPR.mprAfterRTHydrated);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtHydrationFromMPR.mprAfterRTHydratedAfterLayoutChange
  );
});
