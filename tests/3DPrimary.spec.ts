import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('3D primary Test', async () => {
  test('should render 3D primary correctly.', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page
      .locator('div')
      .filter({ hasText: /^3D primary$/ })
      .first()
      .click();

    await checkForScreenshot(
      page,
      page,
      screenShotPaths.threeDPrimary.threeDPrimaryDisplayedCorrectly,
      200
    );
  });
});
