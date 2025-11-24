import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils/index.js';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('MPR Test', async () => {
  test('should render MPR correctly.', async ({ page, mainToolbarPageObject }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await checkForScreenshot(page, page, screenShotPaths.mpr.mprDisplayedCorrectly);
  });
});
