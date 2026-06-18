import {
  checkForScreenshot,
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

  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.rtDataOverlayNoHydrationThenMPR.rtDataOverlayNoHydrationPreMPR
  );

  await mainToolbarPageObject.layoutSelection.MPR.click();

  // Waiting for the render via waitForViewportRenderCycle appears to wait 'forever', so instead
  // we use the baked in wait for screenshot comparisons.
  await checkForScreenshot(
    page,
    viewportPageObject.grid,
    screenShotPaths.rtDataOverlayNoHydrationThenMPR.rtDataOverlayNoHydrationPostMPR
  );

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });
});
