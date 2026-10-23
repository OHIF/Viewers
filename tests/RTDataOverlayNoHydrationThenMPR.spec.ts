import {
  checkForGridScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
} from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated RTSTRUCT chosen from the data overlay menu', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  const dataOverlayPageObject = (await viewportPageObject.getById('default')).overlayMenu
    .dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation('ARIA RadOnc Structure Sets');

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();
  await waitForViewportsRendered(page);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.rtDataOverlayNoHydrationThenMPR.rtDataOverlayNoHydrationPreMPR,
  });

  // This loads a large CT study which takes longer than the default 15s to load
  // hence the 60s to allow more time for the render to finish.
  const volumeLoadTimeout = 60000;
  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page, {
    renderedTimeout: volumeLoadTimeout,
  });

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await viewportRenderAfterLayoutChange;

  await waitForViewportsRendered(page, { timeout: volumeLoadTimeout });

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath: screenShotPaths.rtDataOverlayNoHydrationThenMPR.rtDataOverlayNoHydrationPostMPR,
  });

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });
});
