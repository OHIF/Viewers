import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  await visitStudy(page, studyInstanceUID);
});

test('should rotate the image to the right', async ({ page, mainToolbarPageObject }) => {
  await mainToolbarPageObject.moreTools.rotateRight.click();
  await checkForScreenshot(page, page, screenShotPaths.rotateRight.rotateRightDisplayedCorrectly);
});
