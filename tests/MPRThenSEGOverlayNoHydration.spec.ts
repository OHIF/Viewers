import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';
import { assertNumberOfModalityLoadBadges } from './utils/assertions';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated SEG chosen from the data overlay menu', async ({
  page,
  rightPanelPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.toggle();

  await mainToolbarPageObject.layoutSelection.MPR.click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenSEGOverlayNoHydration.mprPreSEGOverlayNoHydration
  );

  // Hover over the middle/sagittal viewport so that the data overlay menu is available.
  await viewportPageObject.getById('mpr-axial').pane.hover();
  const dataOverlayPageObject = viewportPageObject.getById('mpr-axial').overlayMenu.dataOverlay;
  await dataOverlayPageObject.toggle('mpr-axial');
  await dataOverlayPageObject.addSegmentation('Segmentation', 'mpr-axial');

  // Hide the overlay menu.
  await dataOverlayPageObject.toggle('mpr-axial');

  // Adding an overlay should not show the LOAD button.
  await assertNumberOfModalityLoadBadges({ page, expectedCount: 0 });

  await page.waitForTimeout(5000);

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.mprThenSEGOverlayNoHydration.mprPostSEGOverlayNoHydration
  );
});
