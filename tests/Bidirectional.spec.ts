import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the bidirectional tool', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.bidirectional.click();
  await viewportPageObject.active.clickAt([
    { x: 405, y: 277 },
    { x: 515, y: 339 },
  ]);
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.bidirectional.bidirectionalDisplayedCorrectly
  );
});
