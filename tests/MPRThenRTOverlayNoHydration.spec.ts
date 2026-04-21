import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated RTSTRUCT chosen from the data overlay menu', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.layoutSelection.MPR.click();

  await mainToolbarPageObject.waitForViewportsRendered();

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenRTOverlayNoHydration.mprPreRTOverlayNoHydration
  );

  // Hover over the middle/sagittal viewport so that the data overlay menu is available.
  const sagittalViewport = await viewportPageObject.getById('mpr-sagittal');
  await sagittalViewport.pane.hover();
  const dataOverlayPageObject = sagittalViewport.overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle();
  await dataOverlayPageObject.addSegmentation('ARIA RadOnc Structure Sets');

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await mainToolbarPageObject.waitForViewportsRendered();

  await checkForScreenshot({
    page,
    screenshotPath: screenShotPaths.mprThenRTOverlayNoHydration.mprPostRTOverlayNoHydration,
    normalizedClip: { x: 0, y: 0, width: 1.0, height: 0.75 }, // clip to avoid any popups concerning surface creation and clipping
  });
});
