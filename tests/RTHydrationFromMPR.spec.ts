import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should hydrate an RTSTRUCT from MPR', async ({ page }) => {
  await page.getByTestId('side-panel-header-right').click();

  await page.getByTestId('Layout').click();
  await page.getByTestId('MPR').click();

  await page.waitForTimeout(10000);

  await checkForScreenshot(page, page, screenShotPaths.rtHydrationFromMPR.mprBeforeRT);

  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();

  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.rtHydrationFromMPR.mprAfterRT);

  await page.getByTestId('yes-hydrate-btn').click();

  await page.waitForTimeout(5000);

  await checkForScreenshot(page, page, screenShotPaths.rtHydrationFromMPR.mprAfterRTHydrated);

  await page.getByTestId('Layout').click();
  await page.getByTestId('Axial Primary').click();

  await checkForScreenshot(
    page,
    page,
    screenShotPaths.rtHydrationFromMPR.mprAfterRTHydratedAfterLayoutChange
  );
});
