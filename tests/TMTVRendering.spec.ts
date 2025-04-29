import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils/index.js';

test.skip('should render TMTV correctly.', async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 10000);
  await checkForScreenshot(page, page, screenShotPaths.tmtvRendering.tmtvDisplayedCorrectly, 100);
});
