import {
  attemptAction,
  checkForScreenshot,
  reduce3DViewportSize,
  screenShotPaths,
  test,
  visitStudy,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('3D only Test', async () => {
  test('should render 3D only correctly.', async ({ page, mainToolbarPageObject }) => {
    await mainToolbarPageObject.layoutSelection.threeDOnly.click();
    await attemptAction(() => reduce3DViewportSize(page), 10, 100);
    await page.waitForTimeout(5000);
    // Use a 4 percent diff pixel ratio to account for slight color differences in the 3D viewport
    await checkForScreenshot({
      page,
      locator: page,
      screenshotPath: screenShotPaths.threeDOnly.threeDOnlyDisplayedCorrectly,
      maxDiffPixelRatio: 0.04,
    });
  });
});
