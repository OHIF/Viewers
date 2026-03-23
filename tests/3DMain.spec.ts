import {
  attemptAction,
  reduce3DViewportSize,
  screenShotPaths,
  test,
  visitStudyRendered,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  await visitStudyRendered(page, studyInstanceUID);
});

test.describe('3D main Test', async () => {
  test('should render 3D main correctly. shouldUpdateThis', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.threeDMain.click();
    await attemptAction(() => reduce3DViewportSize(page), 10, 100);
    await viewportPageObject.checkForScreenshot(screenShotPaths.threeDMain.threeDMainDisplayedCorrectly);
  });
});
