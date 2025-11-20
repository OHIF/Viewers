import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the rectangle tool', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.rectangleROI.click();
  await viewportPageObject.active.clickAt([
    { x: 476, y: 159 },
    { x: 591, y: 217 },
  ]);
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();
  await checkForScreenshot(page, page, screenShotPaths.rectangle.rectangleDisplayedCorrectly);
});
