import { test } from 'playwright-test-coverage';
import {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  reduce3DViewportSize,
  attemptAction,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
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

    await attemptAction(() => reduce3DViewportSize(page), 10, 100);
    await page.waitForTimeout(5000);
    await checkForScreenshot(
      page,
      page,
      screenShotPaths.threeDPrimary.threeDPrimaryDisplayedCorrectly
    );
  });
});
