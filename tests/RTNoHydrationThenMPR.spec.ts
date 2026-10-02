import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportsRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated RTSTRUCT', async ({
  page,
  leftPanelPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

  await page.waitForTimeout(5000);
  await waitForViewportsRendered(page, { timeout: 60000 });

  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath: screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPreMPR,
  });

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await page.waitForTimeout(5000);
  await waitForViewportsRendered(page, { timeout: 60000 });

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPostMPR,
  });
});
