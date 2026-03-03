import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should reset the image to its original state', async ({ page, mainToolbarPageObject }) => {
  await mainToolbarPageObject.moreTools.rotateRight.click();
  await mainToolbarPageObject.moreTools.invert.click();
  await mainToolbarPageObject.moreTools.reset.click();
  await checkForScreenshot(page, page, screenShotPaths.reset.resetDisplayedCorrectly);
});
