import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('Axial Primary Test', async () => {
  test('should render Axial Primary correctly.', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page
      .locator('div')
      .filter({ hasText: /^Axial Primary$/ })
      .first()
      .click();
    await checkForScreenshot(
      page,
      page,
      screenShotPaths.axialPrimary.axialPrimaryDisplayedCorrectly,
      200
    );
  });
});
