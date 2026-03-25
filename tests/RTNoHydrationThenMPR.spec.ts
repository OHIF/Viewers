import { noGpu } from 'testEnv';
import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.describe('RT no hydration then MPR', () => {
  test.skip(noGpu, 'No reliable GPU in this CI environment for 3D rendering');

  test.beforeEach(async ({ page }) => {
    const studyInstanceUID = '1.3.6.1.4.1.5962.99.1.2968617883.1314880426.1493322302363.3.0';
    await visitStudy(page, studyInstanceUID);
  });

  test('should launch MPR with unhydrated RTSTRUCT', async ({
    page,
    leftPanelPageObject,
    mainToolbarPageObject,
    rightPanelPageObject,
  }) => {
    await rightPanelPageObject.toggle();
    await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');

    await page.waitForTimeout(5000);

    await checkForScreenshot(page, page, screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPreMPR);

    await mainToolbarPageObject.layoutSelection.MPR.click();

    await page.waitForTimeout(5000);

    await checkForScreenshot(page, page, screenShotPaths.rtNoHydrationThenMPR.rtNoHydrationPostMPR);
  });
});
