import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should launch MPR with unhydrated RTSTRUCT', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();

  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPreMPR);

  await page.getByTestId('Layout').click();
  await page.getByTestId('MPR').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPostMPR);
});
