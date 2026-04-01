import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  await visitStudy(page, studyInstanceUID);
});

test('should display the bidirectional tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.bidirectional.click();
  const activeViewport = await viewportPageObject.active;
  await activeViewport.clickAt([
    { x: 405, y: 277 },
    { x: 515, y: 339 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.bidirectional.bidirectionalDisplayedCorrectly
  );
});
