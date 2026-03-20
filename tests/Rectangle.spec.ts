import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  await visitStudy(page, studyInstanceUID);
});

test('should display the rectangle tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.rectangleROI.click();
  await viewportPageObject.active.clickAt([
    { x: 476, y: 159 },
    { x: 591, y: 217 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await checkForScreenshot(page, page, screenShotPaths.rectangle.rectangleDisplayedCorrectly);
});
