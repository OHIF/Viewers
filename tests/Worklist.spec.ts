import { test, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto(`/?datasources=ohif`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
});
