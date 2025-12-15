import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

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
}) => {
  await rightPanelPageObject.toggle();

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.segHydrationFromMPR.mprBeforeSEG);

  await leftPanelPageObject.loadSeriesByDescription('SEG');

  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.segHydrationFromMPR.mprAfterSEG);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.segHydrationFromMPR.mprAfterSegHydrated);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await page.waitForTimeout(5000);
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydratedAfterLayoutChange
  );
});
