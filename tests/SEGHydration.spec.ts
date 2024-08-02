import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate SEG reports correctly', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  await checkForScreenshot(page, page, screenShotPaths.segHydration.segPreHydration);
  await page.getByTestId('yes-hydrate-btn').click();
  await checkForScreenshot(page, page, screenShotPaths.segHydration.segPostHydration);
  await page.getByText('Esophagus').click();
  await checkForScreenshot(page, page, screenShotPaths.segHydration.segJumpToSegment);
});
