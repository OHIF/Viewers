import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  await visitStudy(page, studyInstanceUID);
});

test('should flip the image horizontally', async ({ page, mainToolbarPageObject }) => {
  await mainToolbarPageObject.moreTools.flipHorizontal.click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.flipHorizontal.flipHorizontalDisplayedCorrectly
  );
});
