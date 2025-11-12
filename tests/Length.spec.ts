import {
  checkForScreenshot,
  screenShotPaths,
  simulateClicksOnElement,
  test,
  visitStudy,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the length tool', async ({
  page,
  mainToolbarPageObject,
  viewportGridPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.length.click();
  const activeViewport = viewportGridPageObject.activeViewport;
  await simulateClicksOnElement({
    locator: activeViewport,
    points: [
      { x: 364, y: 234 },
      { x: 544, y: 232 },
    ],
  });
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();
  await checkForScreenshot(page, page, screenShotPaths.length.lengthDisplayedCorrectly);
});
