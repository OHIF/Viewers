import { screenShotPaths, test, visitStudyRendered } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  await visitStudyRendered(page, studyInstanceUID);
});

test('should properly display MPR for MR', async ({
  DOMOverlayPageObject,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await mainToolbarPageObject.waitForViewportsRendered();
  await viewportPageObject.checkForScreenshot(screenShotPaths.segHydrationFromMPR.mprBeforeSEG);

  await leftPanelPageObject.loadSeriesByDescription('SEG');

  await viewportPageObject.checkForScreenshot(screenShotPaths.segHydrationFromMPR.mprAfterSEG);

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await mainToolbarPageObject.waitForViewportsRendered();

  await viewportPageObject.checkForScreenshot(
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydrated
  );

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await mainToolbarPageObject.waitForViewportsRendered();
  await viewportPageObject.checkForScreenshot(
    screenShotPaths.segHydrationFromMPR.mprAfterSegHydratedAfterLayoutChange
  );
});
