import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
} from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated SEG chosen from the data overlay menu', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();
  const dataOverlayPageObject = (await viewportPageObject.getById('default')).overlayMenu
    .dataOverlay;
  await dataOverlayPageObject.toggle();

  // start watching for viewports to render
  const viewportRenderCycle = waitForViewportRenderCycle(page);

  await dataOverlayPageObject.addSegmentation('Segmentation');

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();

  await viewportRenderCycle;

  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath:
      screenShotPaths.segDataOverlayNoHydrationThenMPR.segDataOverlayNoHydrationPreMPR,
  });

  const viewportRenderAfterLayoutChange = waitForViewportRenderCycle(page);

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await viewportRenderAfterLayoutChange;
  // The layout change rebuilds the viewports; wait for their volume actors to
  // report loaded before settling and capturing.
  await waitForViewportsRendered(page);

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath:
      screenShotPaths.segDataOverlayNoHydrationThenMPR.segDataOverlayNoHydrationPostMPR,
  });

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });
});
