import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
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
