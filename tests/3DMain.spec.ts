import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths, reduce3DViewportSize } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('3D main Test', async () => {
  test('should render 3D main correctly.', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page
      .locator('div')
      .filter({ hasText: /^3D main$/ })
      .first()
      .click();
    await reduce3DViewportSize(page);
    await checkForScreenshot(
      page,
      page,
      screenShotPaths.threeDMain.threeDMainDisplayedCorrectly,
      200
    );
  });
});
