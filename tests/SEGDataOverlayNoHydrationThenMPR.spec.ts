import {
  checkForGridScreenshot,
  checkForViewportScreenshot,
  screenShotPaths,
  test,
  visitStudy,
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
  await dataOverlayPageObject.addSegmentation('Segmentation');

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle();

  await page.waitForTimeout(5000);
  await waitForViewportsRendered(page, { timeout: 60000 });

  const activeViewport = await viewportPageObject.active;

  await checkForViewportScreenshot({
    page,
    viewport: activeViewport,
    screenshotPath:
      screenShotPaths.segDataOverlayNoHydrationThenMPR.segDataOverlayNoHydrationPreMPR,
  });

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await page.waitForTimeout(5000);
  await waitForViewportsRendered(page, { timeout: 60000 });

  await checkForGridScreenshot({
    page,
    viewportPageObject,
    screenshotPath:
      screenShotPaths.segDataOverlayNoHydrationThenMPR.segDataOverlayNoHydrationPostMPR,
  });

  // Adding an overlay should not show the LOAD button.
  assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });
});
