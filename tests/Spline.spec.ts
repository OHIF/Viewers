import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the spline tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.splineROI.click();
  await viewportPageObject.active.clickAt([
    { x: 380, y: 459 },
    { x: 420, y: 396 },
    { x: 523, y: 392 },
    { x: 581, y: 447 },
    { x: 482, y: 493 },
    { x: 383, y: 461 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await checkForScreenshot(page, page, screenShotPaths.spline.splineDisplayedCorrectly);
});
