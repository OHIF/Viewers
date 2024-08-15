import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils/index.js';

test('should render TMTV correctly.', async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339';
  const mode = 'Total Metabolic Tumor Volume';
  await visitStudy(page, studyInstanceUID, mode, 10000);
  await checkForScreenshot(page, page, screenShotPaths.tmtvRendering.tmtvDisplayedCorrectly, 100);
});
