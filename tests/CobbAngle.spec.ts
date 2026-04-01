import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  await visitStudy(page, studyInstanceUID);
});

test('should display the cobb angle tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.moreTools.cobbAngle.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 515, y: 212 },
    { x: 616, y: 207 },
    { x: 527, y: 293 },
    { x: 625, y: 291 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await checkForScreenshot(page, page, screenShotPaths.cobbangle.cobbangleDisplayedCorrectly);
});
