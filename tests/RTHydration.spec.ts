import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate RT reports correctly', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.rtHydration.rtPreHydration);

  await page.getByTestId('yes-hydrate-btn').click();
  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.rtHydration.rtPostHydration);

  await page.getByText('Small Sphere').click();
  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.rtHydration.rtJumpToStructure);
});
