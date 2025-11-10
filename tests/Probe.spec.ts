import {
  checkForScreenshot,
  screenShotPaths,
  simulateClicksOnElement,
  test,
  visitStudy,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the probe tool', async ({ page, mainToolbarPage, viewportGridPage }) => {
  await mainToolbarPage.moreTools.probe.click();
  const activeViewport = viewportGridPage.activeViewport;
  await simulateClicksOnElement({
    locator: activeViewport,
    points: [{ x: 550, y: 200 }],
  });
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();
  await checkForScreenshot(page, page, screenShotPaths.probe.probeDisplayedCorrectly);
});
