import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  screenShotPaths,
  test,
  visitStudy,
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
  await leftPanelPageObject.loadSeriesByDescription('SEG');

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  await page.waitForTimeout(5000);
  await waitForViewportsRendered(page, { timeout: 60000 });
  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.segHydrationThenMPR.segPostHydration,
  });

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await page.waitForTimeout(5000);
  await waitForViewportsRendered(page, { timeout: 60000 });
  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.segHydrationThenMPR.segPostHydrationMPRAxialPrimary,
  });
});
